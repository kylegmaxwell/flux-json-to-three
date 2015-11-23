/**
 * Flux Parasolid Util
 */

'use strict';

/*
 * Imports
 */
import createPrimitive from './src/createPrimitive.js';
import { Object3D, BufferGeometry } from 'three';

var DEFAULTS = {
    MERGE_MODELS: true
};



/**
 * Creates THREE scene and geometries from parasolid output.
 * The method is called recursively for each array and entities
 * map
 *
 * @function createObject
 * @return { Object } An object with a ThreeJS scene graph as .mesh and a set of invalid primitives
 *
 * @param { Object }  data        Parasolid Data from the flux json representation
 * @param { Boolean } mergeModels Whether or not to merge resulting geometries where possible
 *                                defaults to true
 */
export default function createObject ( data, mergeModels ) {

    var root = { mesh: null, invalidPrims: {} };

    if ( mergeModels == null ) mergeModels = DEFAULTS.MERGE_MODELS;

    if ( data ) {
        if ( data.primitive ) _handlePrimitives( data, root );
        else if ( data.Entities ) _handleEntities( data, root );
        else if ( data.constructor === Array ) _handleArray( data, root, mergeModels );
    }

    return root;
}



/**
 * Helper method to handle the case where the parasolid data has a
 * primitive
 *
 * @function _handlePrimitives
 * @private
 *
 * @param { Object } data Parametric data
 * @param { Object } root The root object that is being built
 *                        in this part of the scene graph
 */
function _handlePrimitives( data, root ) {
    root.mesh = createPrimitive( data );
    if ( !root.mesh ) root.invalidPrims[ data.primitive ] = true;
}



/**
 * Helper method to handle the case where the parasolid data is
 * an object of entities
 *
 * @function _handleEntities
 * @private
 *
 * @param { Object } data Parasolid data
 * @param { Object } root The root object that is being built
 *                        in this part of the scene graph
 */
function _handleEntities ( data, root ) {

    var key, key2, results;

    for ( key in data.Entities ) {

        results = createObject( data.Entities[ key ] );

        if ( results.mesh ) {
            if ( !root.mesh ) root.mesh = new Object3D();

            root.mesh.add( results.mesh );
        }

        for ( key2 in results.invalidPrims ) root.invalidPrims[ key2 ] = true;

    }

}



/**
 * Helper function to handle the case where the parasolid data
 * is an array of other parasolid data
 *
 * @function _handleArray
 * @private
 *
 * @param { Object } data Parasolid data
 * @param { Object } root The root object that is being built
 *                        in this part of the scene graph
 * @param { Object } data Whether to merge models when possible
 */
function _handleArray ( data, root, mergeModels ) {
    var i = 0,
        len = data.length,
        key,
        results;
    if ( !root.mesh ) root.mesh = new Object3D();

    for (  ; i < len ; i++ ) {
        results = createObject( data[ i ] );

        if ( results.mesh ) {

            results.mesh.updateMatrixWorld( true );

            if ( mergeModels && !results.mesh.materialProperties ) {
                _mergeModels( results.mesh, root );
            }
            else {
                root.mesh.add( results.mesh);
            }
        }

        for ( key in results.invalidPrims ) {
            root.invalidPrims[ key ] = true;
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

    if ( !root.mesh ) root.mesh = new Object3D();

    var children = root.mesh.children,
        i = 0,
        len = children.length;

    for ( ; i < len ; i++ ) {
        if ( _objectDoesntHaveBufferGeometry( children[ i ] ) ) {
            children[ i ].geometry.merge( mesh.geometry, mesh.matrixWorld );
            return;
        }
    }

    root.mesh.add( mesh );

}



/**
 * Takes a mesh and determines whether it can be merged.
 *
 * @function _objectDoesntHaveBufferGeometry
 * @private
 *
 * @returns { Boolean } Whether the object has a BufferGeometry
 *
 * @param { ThreeJS.Object3D } object The object to check
 */
function _objectDoesntHaveBufferGeometry ( object ) {
    return object.geometry && !( object.geometry instanceof BufferGeometry );
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
        if ( _objectDoesntHaveBufferGeometry( child ) ) _upgradeGeometryToBuffer( child );
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
    object.geometry = new BufferGeometry().fromGeometry( object.geometry );
}



