/**
 * Entry point for creating three-js objects.
 */

'use strict';

import THREE from 'three';
import * as createPrimitive from './createPrimitive.js';
import * as constants from './constants.js';
import * as materials from './utils/materials.js';
import GeometryResults from './geometryResults.js';
import StatusMap from './statusMap.js';
import FluxGeometryError from './geometryError.js';
import * as revitHelper from './helpers/revitHelper.js';
import * as bufferUtils from './utils/bufferGeometryUtils.js';

/**
 * Helper function to run a callback on each entity in the nested array
 * @param {Array} arr Array of arrays or entities
 * @param {Function} cb Callbck function returning boolean
 * @returns {boolean} Reduced return value of the callback
 * @private
 */
function _recursiveReduce (arr, cb) {
    if (!arr) return false;
    var isValid = false;
    if (arr.primitive) {
        isValid = cb(arr);
    } else if (arr.constructor === Array) {
        isValid = arr.reduce(function(prev, curr) {
            return prev || _recursiveReduce(curr, cb);
        }, false);
    }
    return isValid;
}
/**
 * Determine if the given data contains geometry.
 *
 * It must only contain geometry, and arrays of geometry, no mixed types.
 *
 * @param  {Object}  data Flux JSON formatted object.
 * @return {Boolean}      Whether the data is geometry.
 */
export function isKnownGeom (data) {
    var prims = createPrimitive.listValidPrims();
    return _recursiveReduce(data, function (item) {
        return prims.indexOf(item.primitive) !== -1;
    });
}

/**
 * Determine if the given data contains materials with roughness.
 *
 * Then it is necessary to load the related textures
 *
 * @param  {Object}  entities Flux JSON formatted object.
 * @return {Boolean}      Whether the materials have roughness.
 */
export function hasRoughness(entities) {
    return _recursiveReduce(entities, function (item) {
        return materials._getEntityData(item, 'roughness', undefined) != null;
    });
}
/**
 * Creates THREE scene and geometries from parasolid output.
 * The method is called recursively for each array and entities
 * map
 *
 * @function createObject
 *
 * @param { Object }  data        Parasolid Data from the flux json representation
 * @param { Object } geomResult Object containing properties for categorizing primitives
 */
export function createObject ( data, geomResult ) {
    if (!geomResult || geomResult.constructor !== GeometryResults) {
        throw new Error('Second argument must have class GeometryResults');
    }

    // It is very important to call clear here, otherwise all existing primtives
    // will be rebuilt and re-added to the scene when any brep response comes back from the server
    geomResult.clear();

    if (data && Object.keys(data).length > 0) {
        _flattenData(data, geomResult);
        _createObject(geomResult);
    }
}

/**
 * Resolve the nested arrays of primitives into categorized flat arrays of primitives.
 * @param {Object} data The entities objects / arrays
 * @param {GeometryResult} geomResult The results container
 * @private
 */
function _flattenData(data, geomResult) {
    if (!data) return;

    // Breps are skipped when they need to be handled async
    if (data.primitive === 'brep' && (data.faces == null || data.vertices == null)) {
        geomResult.asyncPrims.push(data);
    } else if (data.primitive) {
        if (data.primitive === 'polycurve') {
            Array.prototype.push.apply(geomResult.linePrims,data.curves);
        } else if (data.primitive === 'polysurface') {
            Array.prototype.push.apply(geomResult.phongPrims,data.surfaces);
        } else if (data.primitive === "revitElement") {
            Array.prototype.push.apply(geomResult.phongPrims, revitHelper.extractGeom(data));
        }
        else {
            var type = createPrimitive.resolveMaterialType(data.primitive);
            switch (type) {
                case constants.MATERIAL_TYPES.POINT: {
                    geomResult.pointPrims.push(data);
                    break;
                }
                case constants.MATERIAL_TYPES.LINE: {
                    geomResult.linePrims.push(data);
                    break;
                }
                case constants.MATERIAL_TYPES.PHONG: {
                    geomResult.phongPrims.push(data);
                    break;
                }
                default: {
                    geomResult.primStatus.appendError(data.primitive, 'Unsupported geometry type');
                }
            }
        }
    }
    if (data.constructor === Array) {
        for (var i=0;i<data.length;i++) {
            _flattenData(data[i], geomResult);
        }
    }
}
/**
 * Create the objects for each geometry type.
 * @param {GeometryResult} geomResult The results container
 * @private
 */
function _createObject ( geomResult ) {
    _handlePoints(geomResult);
    _handleLines(geomResult);
    _handlePhongs(geomResult);
}

/**
 * Create all point objects into point clouds.
 * @param {GeometryResult} geomResult The results container
 * @private
 */
function _handlePoints(geomResult) {
    var prims = geomResult.pointPrims;
    if (prims.length === 0) return;
    createPrimitive.createPoints(prims, geomResult);
}

/**
 * Create all the lines primitives.
 * @param {GeometryResult} geomResult The results container
 * @private
 */
function _handleLines(geomResult) {
    var prims = geomResult.linePrims;
    if (prims.length === 0) return;
    _handlePrimitives(prims, geomResult);
}

/**
 * Create all geometry that will be phong shaded.
 * @param {GeometryResult} geomResult The results container
 * @private
 */
function _handlePhongs(geomResult) {
    var prims = geomResult.phongPrims;
    if (prims.length === 0) return;
    _handlePrimitives(prims, geomResult);
}

/**
 * Create all the three.js geometry from a list of JSON data.
 *
 * Pseudo-code usage example: _handlePrimitives([{primitive:mesh},{primitive:mesh}],
 *                                              {errors:'',result:{Mesh Hierarchy}})
 * First we convert each item to the appropriate three.js geometry from its
 * JSON data representation. Then the meshes are grouped by their materials,
 * since meshes with the same material can be combined into a single mesh as an
 * optimization. Finally the grouped meshes are merged together and added
 * to the final result.
 *
 * @param {Array.<Object>} prims Array of Flux JSON primitive data
 * @param {GeometryResult} geomResult The results container
 */
function _handlePrimitives( prims, geomResult ) {
    var primMeshes = [];
    var i;
    var mesh;

    // create
    for (i=0;i<prims.length;i++) {
        mesh = _tryCreatePrimitive( prims[i], geomResult);
        if (mesh) {
            primMeshes.push(mesh);
        }
    }

    // Build a map to collect similar objects that can merge
    var materialToMeshes = {};
    for (i=0;i<primMeshes.length;i++) {
        mesh = primMeshes[i];
        if (_objectCanMerge(mesh)) {
            var name = mesh.material.name;
            var sameMeshList = materialToMeshes[name];
            if (!sameMeshList) {
                materialToMeshes[name] = [];
            } else if (!_sameProperties(primMeshes[i].geometry, sameMeshList[sameMeshList.length-1].geometry)) {
                throw new FluxGeometryError('Found two similar meshes with different attributes');
            }
            materialToMeshes[name].push(primMeshes[i]);
        } else {
            geomResult.object.add(mesh);
        }
    }
    for (var key in materialToMeshes) {
        var meshes = materialToMeshes[key];
        _maybeMergeModels(meshes, geomResult);
    }
}

/**
 * Call create primitive and handle errors due to bad inputs
 * @param {Object} data Primitive properties
 * @param {GeometryResults} geomResult The results object for shared data
 * @returns {THREE.Object3D} The created primitive or falsey
 * @private
 */
function _tryCreatePrimitive(data, geomResult) {
    var mesh;
    var errorMessage = StatusMap.NO_ERROR;
    try {
        mesh = createPrimitive.createPrimitive( data, geomResult );
    }
    catch(err) {
        if (err.name !== "FluxGeometryError") {
            throw err;
        } else {
            errorMessage = err.message;
        }
    }
    // Get the error message that exists, and add to it if it exists, or set it
    geomResult.primStatus.appendError(data.primitive, errorMessage);
    return mesh;
}

/**
 * Determines if an object can merge.
 *
 * Currently only meshes can be merged.
 *
 * @function _objectCanMerge
 * @private
 *
 * @returns { Boolean } Whether the object is a mesh that can be combined with others
 *
 * @param { THREE.Object3D } object The object to check
 */
function _objectCanMerge ( object ) {
    return object && object.geometry && object.type === 'Mesh' ;
}

/**
 * Determine if two geometries have the same configuration of face vertex uvs
 * Used to determine if the geometry can merge.
 * Three.js throws warnings when converting to buffer geometry if they are mismatched.
 * @param {THREE.Geometry|THREE.BufferGeometry} geomA The first geometry
 * @param {THREE.Geometry|THREE.BufferGeometry} geomB The second geometry
 * @returns {boolean} True if they match
 * @private
 */
function _sameProperties(geomA, geomB) {
    var bufferA = geomA instanceof THREE.BufferGeometry;
    if (bufferA !== geomB instanceof THREE.BufferGeometry) {
        return false;
    }
    if (bufferA) {
        return true;
    }
    var hasFaceVertexUvA = geomA.faceVertexUvs[ 0 ] && geomA.faceVertexUvs[ 0 ].length > 0;
    var hasFaceVertexUv2A = geomA.faceVertexUvs[ 1 ] && geomA.faceVertexUvs[ 1 ].length > 0;
    var hasFaceVertexUvB = geomB.faceVertexUvs[ 0 ] && geomB.faceVertexUvs[ 0 ].length > 0;
    var hasFaceVertexUv2B = geomB.faceVertexUvs[ 1 ] && geomB.faceVertexUvs[ 1 ].length > 0;
    return hasFaceVertexUvA === hasFaceVertexUvB && hasFaceVertexUv2A === hasFaceVertexUv2B;
}

/**
 * Helper function to merge the children of a particular
 * object in the scene graph into the fewest number of children
 * possible.
 *
 * @function _mergeModels
 * @private
 *
 * @param { Array.<THREE.Object3D> } meshes A list of meshes to join into one
 * @param { Object }       geomResult The object being built
 */
function _maybeMergeModels ( meshes, geomResult ) {
    if ( !geomResult.object ) geomResult.object = new THREE.Object3D();

    if (!meshes || meshes.constructor !== Array || meshes.length === 0) return;
    if (meshes.length === 1) {
        geomResult.object.add(meshes[0]);
        return;
    }
    var baseMesh = meshes[0];
    // Let's move the geometry from mesh to base mesh
    baseMesh.updateMatrixWorld();
    // Remember matrix multiplication applies in reverse
    var matXform = new THREE.Matrix4();
    // transform all the other meshes into the same coordinate system.
    for (var i=1;i<meshes.length;i++) {
        var mesh = meshes[i];
        mesh.updateMatrixWorld(true);

        // Apply the inverse of baseMesh transform to put the vertices from world space into it's local space
        matXform.getInverse(baseMesh.matrixWorld);
        // Apply the mesh transform to get verts from mesh in world space
        matXform.multiply(mesh.matrixWorld);
        mesh.geometry.applyMatrix(matXform);
    }
    var mergedMesh = bufferUtils.mergeBufferGeom(meshes);
    baseMesh.geometry = mergedMesh;
    geomResult.object.add(baseMesh);
}
