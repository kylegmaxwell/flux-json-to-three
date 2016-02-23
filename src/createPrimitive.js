/**
 * set of helpers to make primitives
 */

'use strict';

import * as wirePrimitives from './wirePrimitives.js';
import * as sheetPrimitives from './sheetPrimitives.js';
import * as solidPrimitives from './solidPrimitives.js';
import * as primitiveHelpers from './primitives.js';
import * as constants from './constants.js';
import FluxGeometryError from './geometryError.js';

/**
 * Determine the material type that would be used for a given primitive
 * @param {Object} primitive The geometry object parameters
 * @returns {{func: *, material: number}} A function to convert a prim to geomtry and a material type
 */
export function resolveType (primitive) {
    var resolvedName = _resolveLegacyNames( primitive );

    var primFunction = primitiveHelpers[ resolvedName ];
    var materialType = constants.MATERIAL_TYPES.PHONG;
    if (resolvedName === 'point') {
        materialType = constants.MATERIAL_TYPES.POINT;
    }

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
 * Cache to prevent repetitive munging of arrays.
 * Stores all the acceptable primitive types for geometry.
 * @type {Array.<String>}
 */
var validPrimsList = null;

/**
 * Return a list of all the valid primitive strings
 * @return {Array.<String>} The list of primitives
 */
export function listValidPrims ( ) {
    if (validPrimsList) return validPrimsList;

    validPrimsList = Object.keys(primitiveHelpers).concat(
                        Object.keys(solidPrimitives),
                        Object.keys(sheetPrimitives),
                        Object.keys(wirePrimitives),
                        Object.keys(constants.LEGACY_NAMES_MAP));
    return validPrimsList;
}

/**
 * Convert a color string or array to an object
 * @param {String|Array} color The html color
 * @returns {THREE.Color} The color object
 * @private
 */
function _convertColor(color) {
    var newColor = new THREE.Color();
    if (typeof color === 'object' &&
        color.r !== undefined && color.g !== undefined && color.b !== undefined) {
        newColor.copy(color);
    } else if (typeof color === 'object' && color instanceof Array && color.length === 3) {
        newColor.setRGB(color[0], color[1], color[2]);
    } else {
        newColor.set(color);
    }
    return newColor;
}

/**
 * Get the color from a given entity
 * @param {Object} prim The primitive with the material
 * @returns {Array.<Number>} Color array
 * @private
 */
function _getColor(prim) {
    var color = [0.5,0.5,0.8];
    if (!prim) return;
    var materialProperties = prim.materialProperties || (prim.attributes && prim.attributes.materialProperties);
    if (materialProperties && materialProperties.color) {
        color = materialProperties.color;
    }
    var threeColor = _convertColor(color);
    return [threeColor.r, threeColor.g, threeColor.b];
}

/**
 * Get the point size from a given entity
 * @param {Array} prims Array of point data
 * @returns {Number} Point size
 * @private
 */
function _getPointSize(prims) {
    var size = 10;
    // Just use the first point for now, can't set size per point.
    var prim = prims[0];
    if (!prim) return;
    var materialProperties = prim.materialProperties || (prim.attributes && prim.attributes.materialProperties);
    if (materialProperties && materialProperties.size) {
        size = materialProperties.size;
    }
    return size;
}

/**
 * Get the point size attenuation from a given entity
 * Determines whether the points change size based on distance to camera
 * @param {Array} prims Array of point data
 * @returns {Boolean} True when points change apparent size
 * @private
 */
function _getPointSizeAttenuation(prims) {
    // default to fixed size for 1 point, and attenuate for multiples
    var sizeAttenuation = prims.length !== 1;
    // Just use the first point for now, can't set attenuation per point.
    var prim = prims[0];
    if (!prim) return;
    var materialProperties = prim.materialProperties || (prim.attributes && prim.attributes.materialProperties);
    if (materialProperties && materialProperties.size) {
        sizeAttenuation = materialProperties.sizeAttenuation;
    }
    return sizeAttenuation;
}

/**
 * Create the point cloud mesh for all the input primitives
 * @param {Object} prims List of point primitive objects
 * @returns {THREE.Points} An Object3D containing points
 */
export function createPoints (prims) {
    var positions = new Float32Array(prims.length*3);
    var colors = new Float32Array(prims.length*3);
    for (var i=0;i<prims.length;i++) {
        var prim = prims[i];
        positions[i*3] = prim.point[0];
        positions[i*3+1] = prim.point[1];
        positions[i*3+2] = prim.point[2]||0;
        // Get color or default color
        var color = _getColor(prim);
        colors[i*3] = color[0];
        colors[i*3+1] = color[1];
        colors[i*3+2] = color[2];
    }
    var geometry = new THREE.BufferGeometry();

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    var materialProperties = {
        size: _getPointSize(prims),
        sizeAttenuation: _getPointSizeAttenuation(prims),
        vertexColors: THREE.VertexColors
    };
    var material = new THREE.PointsMaterial(materialProperties);
    var mesh = new THREE.Points( geometry, material );

    cleanupMesh(mesh);

    return mesh;
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
export function createPrimitive ( data ) {

    var type = resolveType(data.primitive);

    var materialProperties = _findMaterialProperties( data );
    var material = _createMaterial( type.material, materialProperties );

    var primFunction = type.func;
    if (!primFunction) return;

    var mesh = primFunction( data, material );

    if ( mesh ) {
        return cleanupMesh(mesh, data, materialProperties);
    }

    throw new FluxGeometryError( 'Unsupported geometry type: ' + data.primitive );

}

/**
 * Do some post processing to the mesh to prep it for Flux
 * @param {THREE.Object3D} mesh Geometry and material object
 * @param {Object} data The entity object
 * @param {Object} materialProperties The material properties object
 * @returns {THREE.Mesh} The processed mesh
 */
export function cleanupMesh(mesh, data, materialProperties) {
    _convertToZUp( mesh );

    if (!data) return;

    if ( data.origin ) _applyOrigin( mesh, data.origin );

    var axis = data.axis || data.direction || data.normal;

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
    var legacyMap = constants.LEGACY_NAMES_MAP;
    if (Object.keys(legacyMap).indexOf(name) !== -1)
        return legacyMap[name];
    return name;
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
