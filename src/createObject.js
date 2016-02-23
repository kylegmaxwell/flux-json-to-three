/**
 * Entry point for creating three-js objects.
 */

'use strict';

/*
 * Imports
 */
import * as createPrimitive from './createPrimitive.js';
import * as constants from './constants.js';
import GeometryResults from './geometryResults.js';

/**
 * Determine if the given data contains geometry.
 *
 * It must only contain geometry, and arrays of geometry, no mixed types.
 *
 * @param  {Object}  data Flux JSON formatted object.
 * @return {Boolean}      Whether the data is geometry.
 */
export function isKnownGeom (data) {
    if (!data) return false;
    var isValid = false;
    if (data.primitive) {
        isValid = createPrimitive.listValidPrims().indexOf(data.primitive) !== -1;
    } else if (data.constructor === Array) {
        isValid = data.reduce(function(prev, curr) {
            return prev || isKnownGeom(curr);
        }, false);
    }
    return isValid;
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

    if (geomResult.constructor !== GeometryResults) {
        throw new Error('Root must have class GeometryResults');
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

    var mesh = createPrimitive.createPoints(prims);

    geomResult.invalidPrims.point  = false;
    geomResult.mesh.add(mesh);
}

/**
 * Create all the lines primitives.
 * @param {GeometryResult} geomResult The results container
 * @private
 */
function _handleLines(geomResult) {
    var prims = geomResult.linePrims;
    for (var i=0;i<prims.length;i++) {
        _handlePrimitive( prims[i], geomResult);
    }
}

/**
 * Create all geometry that will be phong shaded.
 * @param {GeometryResult} geomResult The results container
 * @private
 */
function _handlePhongs(geomResult) {
    var prims = geomResult.phongPrims;
    for (var i=0;i<prims.length;i++) {
        _handlePrimitive( prims[i], geomResult);
    }
    if (geomResult.mesh) _upgradeChildrenToBuffer(geomResult.mesh);
}

/**
 * Helper method to handle the case where the parasolid data has a
 * primitive
 *
 * @function _handlePrimitive
 * @private
 *
 * @param { Object } data Parametric data
 * @param {GeometryResult} geomResult The geomResult object that is being built
 *                        in this part of the scene graph
 */
function _handlePrimitive( data, geomResult ) {
    var mesh;
    try {
        mesh = createPrimitive.createPrimitive( data, geomResult );
    }
    catch(err) {
        if (err.name !== "FluxGeometryError") {
            throw err;
        }
    }
    if ( !mesh ) {
        geomResult.invalidPrims[ data.primitive ] = true;
    }
    else {
        geomResult.invalidPrims[ data.primitive ] = false;
        _maybeMergeModels(mesh, geomResult);
    }
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

        if ( _objectCanMerge( children[index])) {
            children[index].geometry.merge( mesh.geometry, mesh.matrixWorld );
            merged = true;
        }
    }
    if (!merged) {
        geomResult.mesh.add(mesh);
    } else {
        mesh.geometry.dispose();
    }

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
    return !object.materialProperties && object.geometry &&
           !( object.geometry instanceof THREE.BufferGeometry ) && object.type === 'Mesh';
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



