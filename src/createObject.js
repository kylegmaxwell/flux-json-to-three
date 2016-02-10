/**
 * Entry point for creating three-js objects.
 */

'use strict';

/*
 * Imports
 */
import { createPrimitive, listValidPrims } from './createPrimitive.js';
import GeometryResults from './geometryResults.js';

var DEFAULTS = {
    MERGE_MODELS: true
};



/**
 * Creates THREE scene and geometries from parasolid output.
 * The method is called recursively for each array and entities
 * map
 *
 * @function createObject
 *
 * @param { Object }  data        Parasolid Data from the flux json representation
 * @param { Boolean } mergeModels Whether or not to merge resulting geometries where possible
 *                                defaults to true
 * @param { Object } root Object containing properties for categorizing primitives
 */
export function createObject ( data, mergeModels, root ) {
    if (root.constructor !== GeometryResults) {
        throw new Error('Root have class GeometryResults');
    }

    if ( mergeModels == null ) mergeModels = DEFAULTS.MERGE_MODELS;

    if ( data ) {
        if ( data.primitive ) _handlePrimitive( data, root );
        else if ( data.constructor === Array ) _handleArray( data, root, mergeModels );
    }
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
    if (!data) return false;
    var isValid = false;
    if (data.primitive) {
        isValid = listValidPrims().indexOf(data.primitive) !== -1;
    } else if (data.constructor === Array) {
        isValid = data.reduce(function(prev, curr) {
            return prev || isKnownGeom(curr);
        }, false);
    }
    return isValid;
}

/**
 * Helper method to handle the case where the parasolid data has a
 * primitive
 *
 * @function _handlePrimitive
 * @private
 *
 * @param { Object } data Parametric data
 * @param { Object } root The root object that is being built
 *                        in this part of the scene graph
 */
function _handlePrimitive( data, root ) {
    // Breps are skipped when they need to be handled async
    if (data.primitive === 'brep' && (data.faces == null || data.vertices == null)) {
        root.asyncPrims.push(data);
    }
    else {
        var mesh;
        try {
            mesh = createPrimitive( data, root );
        }
        catch(err) {
            if (err.name !== "FluxGeometryError") {
                throw err;
            }
        }
        if ( !mesh ) {
            root.invalidPrims[ data.primitive ] = true;
        }
        else {
            root.invalidPrims[ data.primitive ] = false;
            root.mesh.add(mesh);
        }
    }
}

/**
 * Helper function to handle the case where the parasolid data
 * is an array of other parasolid data
 *
 * @function _handleArray
 * @private
 *
 * @param { Object } data           Parasolid data
 * @param { Object } root           The root object that is being built
 *                                  in this part of the scene graph
 * @param { Object } mergeModels    Whether to merge models when possible
 */
function _handleArray ( data, root, mergeModels ) {
    var i = 0,
        len = data.length;

    for (  ; i < len ; i++ ) {
        createObject( data[ i ], mergeModels, root );

        var children = root.mesh.children;
        var targetMesh = children[children.length-1];
        if ( targetMesh ) {

            targetMesh.updateMatrixWorld( true );

            if ( mergeModels && !targetMesh.materialProperties ) {
                _mergeModels( targetMesh, root );
            }
            else {
                root.mesh.add( targetMesh);
            }
        }
    }

    if ( root.mesh ) _upgradeChildrenToBuffer( root.mesh );
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
 * @param { Object }       root The object being built by recursion
 */
function _mergeModels ( mesh, root ) {

    if ( !root.mesh ) root.mesh = new THREE.Object3D();

    var children = root.mesh.children,
        i = 0,
        len = children.length;

    if ( _objectCanMerge( mesh ) ) {
        for ( ; i < len ; i++ ) {
            if ( _objectCanMerge( children[ i ] ) ) {
                children[ i ].geometry.merge( mesh.geometry, mesh.matrixWorld );
                return;
            }
        }
    }

    root.mesh.add( mesh );

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
    return object.geometry && !( object.geometry instanceof THREE.BufferGeometry ) && object.type === 'Mesh';
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
    object.geometry = new THREE.BufferGeometry().fromGeometry( object.geometry );
}



