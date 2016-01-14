/**
 * set of helpers to make primitives
 */

'use strict';

import * as wirePrimitives from './wirePrimitives.js';
import * as sheetPrimitives from './sheetPrimitives.js';
import * as solidPrimitives from './solidPrimitives.js';
import * as primitiveHelpers from './primitives.js';
import * as constants from './constants.js'
import FluxGeometryError from './geometryError.js';


function resolveType (primitive) {
    var resolvedName = _resolveLegacyNames( primitive );

    var primFunction = primitiveHelpers[ resolvedName ];
    var materialType = constants.MATERIAL_TYPES.POINT;

    if (!primFunction) {
        primFunction = wirePrimitives[ resolvedName ];
        materialType = constants.MATERIAL_TYPES.LINE;
    }
    if (!primFunction) {
        primFunction = sheetPrimitives[ resolvedName ];
        materialType = constants.MATERIAL_TYPES.PHONG;
    }
    if (!primFunction) {
        primFunction = solidPrimitives[ resolvedName ];
        materialType = constants.MATERIAL_TYPES.PHONG;
    }

    // special cases
    if (primitive === 'polysurface' || primitive === 'plane') {
        materialType = constants.MATERIAL_TYPES.PHONG;
    }

    if (primitive === 'polycurve') {
        materialType = constants.MATERIAL_TYPES.LINE;
    }

    return { func: primFunction, material: materialType};
}

/**
 * Creates the ParaSolid Object
 *
 * @function createPrimitive
 * @return { ThreeJS.Mesh } The created mesh
 * @throws FluxGeometryError if unsupported geometry is found
 *
 * @param { Object } data The data to create the object with
 */
export default function createPrimitive ( data ) {

    var type = resolveType(data.primitive);

    var materialProperties = _findMaterialProperties( data );
    var material = _createMaterial( type.material, materialProperties );

    var primFunction = type.func;
    if (!primFunction) return;

    var mesh = primFunction( data, material );
    var axis;

    if ( mesh ) {

        _convertToZUp( mesh );

        if ( data.origin ) _applyOrigin( mesh, data.origin );

        axis = data.axis || data.direction || data.normal;

        if ( axis )
            mesh.lookAt( mesh.position.clone().add(
                new THREE.Vector3(
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

    throw new FluxGeometryError( 'Unsupported geometry type: ' + data.primitive );

}

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
    if ( data.attributes && data.attributes.materialProperties ) return data.attributes.materialProperties;
    else if ( data.materialProperties ) return data.materialProperties;
    else return {
        side: THREE.DoubleSide
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
 * @return { THREE.Material } an instance of a Three.js material
 *
 * @param { Number } type               A member of the enumeration of material types
 *                                      present in the parasolid utility
 *
 * @param { Object } materialProperties A set of properties that functions
 *                                      as options for the material
 */
function _createMaterial ( type, materialProperties ) {

    if ( materialProperties && !materialProperties.side ) materialProperties.side = THREE.DoubleSide;

    if ( type === constants.MATERIAL_TYPES.PHONG ) return new THREE.MeshPhongMaterial( materialProperties );
    else if ( type === constants.MATERIAL_TYPES.POINT ) return new THREE.PointsMaterial( materialProperties );
    else if ( type === constants.MATERIAL_TYPES.LINE ) return new THREE.LineBasicMaterial( materialProperties );

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
 * @param { ThreeJS.Object3D } object The object to convert to z-up
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
