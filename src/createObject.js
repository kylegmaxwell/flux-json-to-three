/**
 * Entry point for creating three-js objects.
 */

'use strict';

/*
 * Imports
 */
import * as createPrimitive from './createPrimitive.js';
import * as constants from './constants.js';
import * as materials from './materials.js';
import GeometryResults from './geometryResults.js';
import ErrorMap from './errorMap.js';

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

    if (data && Object.keys(data).length > 0) {
        geomResult.clear();
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
        var type = createPrimitive.resolveType(data.primitive).material;
        switch(type) {
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

    var validPoints = true;
    for (var i=0;i<prims.length; i++) {
        if (!geomResult.checkSchema(prims[i])) {
            validPoints = false;
        }
    }
    if (validPoints) {
        var mesh = createPrimitive.createPoints(prims);
        geomResult.invalidPrims.appendError('point', ErrorMap.NO_ERROR);
        geomResult.mesh.add(mesh);
    }

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
 * Create all the primitives from a list
 *
 * @param { Object } prims Entity parameter data
 * @param {GeometryResult} geomResult The results container
 */
function _handlePrimitives( prims, geomResult ) {
    var primMeshes = [];
    var i;

    // create
    for (i=0;i<prims.length;i++) {
        var mesh = _tryCreatePrimitive( prims[i], geomResult);
        if (mesh) {
            primMeshes.push(mesh);
        }
    }

    //sort
    primMeshes.sort(function (a, b) {
        // Leave non meshes at the front of the list.
        if (!a.material) {
            return -1;
        }
        if (!b.material) {
            return 1;
        }
        return a.material.name > b.material.name;
    });

    //merge
    for (i=0;i<primMeshes.length;i++) {
        _maybeMergeModels(primMeshes[i], geomResult);
    }

    if (geomResult.mesh) _upgradeChildrenToBuffer(geomResult.mesh);
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
    var errorMessage = ErrorMap.NO_ERROR;
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
    geomResult.invalidPrims.appendError(data.primitive, errorMessage);
    return mesh;
}

/**
 * Helper function to merge the children of a particular
 * object in the scene graph into the fewest number of children
 * possible.
 *
 * @function _mergeModels
 * @private
 *
 * @param { ThreeJS.Mesh } mesh A three js mesh
 * @param { Object }       geomResult The object being built
 */
function _maybeMergeModels ( mesh, geomResult ) {
    if ( !geomResult.mesh ) geomResult.mesh = new THREE.Object3D();

    if (!mesh) return;
    mesh.updateMatrixWorld(true);
    var merged = false;
    if (_objectCanMerge(mesh)) {

        var children = geomResult.mesh.children;
        var index = children.length-1;
        var baseMesh = children[index];

        if ( _objectCanMerge( baseMesh)) {
            // Let's move the geometry from mesh to base mesh
            baseMesh.updateMatrixWorld();
            // Remember matrix multiplication applies in reverse
            var matXform = new THREE.Matrix4();
            // Apply the inverse of baseMesh transform to put the vertices from world space into it's local space
            matXform.getInverse(baseMesh.matrixWorld);
            // Apply the mesh transform to get verts from mesh in world space
            matXform.multiply(mesh.matrixWorld);
            merged = _conditionalMerge(baseMesh.geometry, mesh.geometry, matXform, geomResult._geometryMaterialMap);
        }
    }
    if (merged) {
        mesh.geometry.dispose();
    } else {
        geomResult.mesh.add(mesh);
    }
}
/**
 * Determine if two geometries have the same configuration of face vertex uvs
 * Used to determine if the geometry can merge.
 * Three.js throws warnings when converting to buffer geometry if they are mismatched.
 * @param {THREE.Geometry} geomA The first geometry
 * @param {THREE.Geometry} geomB The second geometry
 * @returns {boolean} True if they match
 * @private
 */
function _sameFaceVertexUvs(geomA, geomB) {
    var hasFaceVertexUvA = geomA.faceVertexUvs[ 0 ] && geomA.faceVertexUvs[ 0 ].length > 0;
    var hasFaceVertexUv2A = geomA.faceVertexUvs[ 1 ] && geomA.faceVertexUvs[ 1 ].length > 0;
    var hasFaceVertexUvB = geomB.faceVertexUvs[ 0 ] && geomB.faceVertexUvs[ 0 ].length > 0;
    var hasFaceVertexUv2B = geomB.faceVertexUvs[ 1 ] && geomB.faceVertexUvs[ 1 ].length > 0;
    return hasFaceVertexUvA === hasFaceVertexUvB && hasFaceVertexUv2A === hasFaceVertexUv2B;
}

function _conditionalMerge(geom1, geom2, mat, geomMap) {

    var merged = false;
    //Compare string identifiers for materials to see if they are equivalent
    if (geomMap[geom1.id] === geomMap[geom2.id] && _sameFaceVertexUvs(geom1, geom2)) {
        geom1.merge( geom2, mat );
        merged = true;
    }
    return merged;
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
 * @param { ThreeJS.Object3D } object The object to check
 */
function _objectCanMerge ( object ) {
    return object && object.geometry && object.type === 'Mesh' &&
           !( object.geometry instanceof THREE.BufferGeometry ) ;
}

/**
 * Takes a mesh and determines whether it can be be converted to buffer geometry.
 *
 *  Currently only meshes can be converted to buffers.
 *
 * @function _objectCanBuffer
 * @private
 *
 * @returns { Boolean } Whether the object can become BufferGeometry
 *
 * @param { ThreeJS.Object3D } object The object to check
 */
function _objectCanBuffer ( object ) {
    return object.geometry && !( object.geometry instanceof THREE.BufferGeometry ) && object.type === 'Mesh';
}



/**
 * Takes a Three js object and upgrades its children
 * to buffer geometries if possible
 *
 * @function _upgradeChildrenToBuffer
 * @private
 *
 * @param { ThreeJS.Object3D } object Object to upgrade the children of
 */
function _upgradeChildrenToBuffer ( object ) {

    var child;

    for ( var i = 0, len = object.children.length ; i < len ; i++ ) {
        child = object.children[ i ];
        if ( _objectCanBuffer( child ) ) _upgradeGeometryToBuffer( child );
    }

}



/**
 * Upgrades an object to a buffer geometry
 *
 * @function _upgradeGeometryToBuffer
 * @private
 *
 * @param { ThreeJS.Object3D } object Object to upgrade
 */
function _upgradeGeometryToBuffer ( object ) {
    var oldGeom = object.geometry;
    object.geometry = new THREE.BufferGeometry().fromGeometry( oldGeom );
    oldGeom.dispose();
}



