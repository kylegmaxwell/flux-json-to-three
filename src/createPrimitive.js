/**
 * set of helpers to make primitives
 */

'use strict';

/*
 * imports
 */
import {
    Vector3,
    DoubleSide as DOUBLE_SIDE,
    MeshPhongMaterial,
    PointsMaterial,
    LineBasicMaterial
} from 'three';
import * as primitiveHelpers from './primitives.js';


/*
 * constants
 */
var PHONG = 0,
    POINT = 1,
    LINE = 2,
    PRIMITIVE_TO_MATERIAL = {
        cone: PHONG,
        cylinder: PHONG,
        sphere: PHONG,
        torus: PHONG,
        block: PHONG,
        circle: PHONG,
        rectangle: PHONG,
        plane: PHONG,
        point: POINT,
        'point-2d': POINT,
        line: LINE,
        polycurve: LINE,
        curve: LINE,
        arc:LINE,
        mesh: PHONG,
        'polygon-set': PHONG,
        polygonSet: PHONG,
        polyline: LINE,
        surface: PHONG
    };



/**
 * Creates the ParaSolid Object
 *
 * @function createPrimitive
 * @return { ThreeJS.Mesh } The created mesh
 *
 * @param { Object } data The data to create the object with
 */
export default function createPrimitive ( data ) {

    var materialProperties = _findMaterialProperties( data );
    var material = _createMaterial( PRIMITIVE_TO_MATERIAL[ data.primitive ], materialProperties );
    var primFunction = primitiveHelpers[ _resolveLegacyNames( data.primitive ) ];
    if (!primFunction) return;
    var mesh = primFunction( data, material );
    var axis;

    if ( mesh ) {

        _convertToZUp( mesh );

        if ( data.origin ) _applyOrigin( mesh, data.origin );

        axis = data.axis || data.direction || data.normal;

        if ( axis )
            mesh.lookAt( mesh.position.clone().add(
                new Vector3(
                    axis[ 0 ],
                    axis[ 1 ],
                    axis[ 2 ]
                )
            ));

        if ( data.attributes && data.attributes.tag ) mesh.userData.tag = data.attributes.tag;

        if ( mesh.type === 'Mesh' ) {
            materialProperties.polygonOffset = true;
            materialProperties.polygonOffsetFactor = 1;
            materialProperties.polygonOffsetUnits = 1;
        }

        mesh.materialProperties = materialProperties;

        return mesh;

    }

    throw new Error( 'Unsupported geometry type: ' + data.primitive )

}


/*
 * helpers
 */

/**
 * Helper method to find the material properties on the data
 *
 * @function _findMaterialProperties
 * @private
 *
 * @return { Object } The material properties
 *
 * @param { Object } data The data used to construct the primitive
 */
function _findMaterialProperties ( data ) {
    if ( data.attributes ) return data.attributes.materialProperties;
    else if ( data.materialProperties ) return data.materialProperties;
    else return {
        side: DOUBLE_SIDE
    };
}



/**
 * Helper method to create the material from the material properties.
 * There are only a few types of materials used, this function takes a type
 * and returns a material with the properties object given
 *
 * @function _createMaterial
 * @private
 *
 * @return { THREEJS.MATERIAL } an instance of a Three.js material
 *
 * @param { Number } type               A member of the enumeration of material types
 *                                      present in the parasolid utility
 *
 * @param { Object } materialProperties A set of properties that functions
 *                                      as options for the material
 */
function _createMaterial ( type, materialProperties ) {

    if ( materialProperties && !materialProperties.side ) materialProperties.side = DOUBLE_SIDE;

    if ( type === PHONG ) return new MeshPhongMaterial( materialProperties );
    else if ( type === POINT ) return new PointsMaterial( materialProperties );
    else if ( type === LINE ) return new LineBasicMaterial( materialProperties );

}



/**
 * A helper to resolve legacy names to present names. This prevents deprication
 * of some of our user's parasolid data.
 *
 * @function _resolveLegacyNames
 * @private
 *
 * @return { String } the current name
 *
 * @param { String } name a name that may be legacy
 */
function _resolveLegacyNames ( name ) {
    switch ( name ) {

        case 'point':
        case 'point-2d': return 'point';

        case 'polygon-set':
        case 'polygonSet': return 'polygonSet';

        default: return name;
    }
}



/**
 * A helper to convert geometry to z-up world by setting ups axis and rotation
 * order
 *
 * @function _convertToZUp
 * @private
 *
 * @param { ThreeJS.Object3d } object The object to convert to z-up
 */
function _convertToZUp ( object ) {
    object.up.set( 0, 0, 1 );
    object.rotation.order = 'YXZ';
}



/**
 * A helper to apply an origin to a mesh
 *
 * @function _applyOrigin
 * @private
 *
 * @param { ThreeJS.Mesh } mesh The mesh to receive the origin
 * @param { Array } origin The vector representing the origin
 */
function _applyOrigin ( mesh, origin ) {
    mesh.position.set(
        origin[ 0 ],
        origin[ 1 ],
        origin[ 2 ] ? origin[ 2 ] : 0
    );
}
