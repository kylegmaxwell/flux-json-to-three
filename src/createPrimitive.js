/**
 * set of helpers to make primitives
 */

'use strict';

import * as wirePrimitives from './wirePrimitives.js';
import * as sheetPrimitives from './sheetPrimitives.js';
import * as solidPrimitives from './solidPrimitives.js';
import * as primitiveHelpers from './primitives.js';
import * as constants from './constants.js';
import materialToJson from './materials.js';
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
    if (color == null) {
        color = constants.DEFAULT_MATERIAL_PROPERTIES.phong.color;
    }
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
    var color = constants.DEFAULT_POINT_COLOR;
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
    var size = constants.DEFAULT_MATERIAL_PROPERTIES.point.size;
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

    if (!prim) {
        return sizeAttenuation;
    }
    var materialProperties = prim.materialProperties || (prim.attributes && prim.attributes.materialProperties);
    if (materialProperties && materialProperties.sizeAttenuation) {
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

    _convertToZUp( mesh );

    return mesh;
}

/**
 * Creates the ParaSolid Object
 *
 * @function createPrimitive
 * @return { THREE.Mesh } The created mesh
 * @throws FluxGeometryError if unsupported geometry is found
 *
 * @param { Object } data The data to create the object with
 * @param { GeometryResults } geomResult The container for the geometry and caches
 */
export function createPrimitive ( data, geomResult ) {
    var type = resolveType(data.primitive);

    var materialProperties = _findMaterialProperties( data );
    var material = _createMaterial( type.material, materialProperties, geomResult.cubeArray );

    var primFunction = type.func;
    if (!primFunction) return;

    var mesh = primFunction( data, material );

    if ( mesh ) {
        if (mesh.geometry) {
            geomResult._geometryMaterialMap[mesh.geometry.id] = material.name;
        }
        return cleanupMesh(mesh, data, materialProperties);
    }

    throw new FluxGeometryError( 'Unsupported geometry type: ' + data.primitive );

}

/**
 * Move the color from a material to a geometry.
 *
 * This allows meshes of different colors to be merged together.
 * Then the meshes can share a single material with per vertex color.
 *
 * @precondition The color object on the material should not be shared with other materials.
 * @param {THREE.Geometry} geom The geometry to color (buffered or not)
 * @param {THREE.Color} color Pointer to the color in a material to apply (and modify)
 * @private
 */
function _moveMaterialColorToGeom(mesh) {
    var geom = mesh.geometry;
    var color = mesh.material.color;
    var color2 = color.clone();
    if (geom) {
        if (geom.type.indexOf('BufferGeometry') !== -1) {
            var attrLen = geom.attributes.position.array.length;
            var colors = [];
            for (var i=0;i<attrLen;i+=3) {
                colors.push(color.r);
                colors.push(color.g);
                colors.push(color.b);
            }
            geom.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array(colors), 3 ) );
        } else {
            for (var f=0;f<geom.faces.length;f++) {
                geom.faces[f].color = color2;
            }
        }
        // Reset the color since it is now on the points.
        // In three.js color is multiplicative, so:
        // color = material color * vertex color
        // Hence after setting it on the mesh, it must be reset on the material.
        color.r = 1;
        color.g = 1;
        color.b = 1;
    }
}

/**
 * Do some post processing to the mesh to prep it for Flux
 * @param {THREE.Object3D} mesh Geometry and material object
 * @param {Object} data The entity object
 * @returns {THREE.Mesh} The processed mesh
 */
export function cleanupMesh(mesh, data) {
    // Only convert the color for objects with material
    if (mesh.material) {
        _moveMaterialColorToGeom(mesh);
    }

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
 * Function to copy white listed properties from the input to the output
 * @param {Object} knownPropsMap Map from material properties to defualt values
 * @param {Object} propsIn Map from material properties to values
 * @param {Object} propsOut Subset of propsIn (return parameter)
 * @private
 */
function _addKnownProps(knownPropsMap, propsIn, propsOut) {
    var knownProps = Object.keys(knownPropsMap);
    for (var i=0;i<knownProps.length;i++) {
        var prop = knownProps[i];
        var propValue = propsIn[prop];
        if (propValue != null) {
            propsOut[prop] = propValue;
        }
    }
}

/**
 * Modify a material to approximate a shading model with roughness
 * @param {Number} roughness        The roughness (measures shiny to matte)
 * @param {THREE.Material} material The material to edit
 * @param {Array} cubeArray         Array of textures
 * @private
 */
function _applyRoughness(roughness, material, cubeArray) {
    if (roughness != null && cubeArray != null) {
        // There are some magic numbers here to simulate physically-accurate lighting.
        // This is only an artistic approximation of physically-accurate models.
        // TODO(aki): implement custom shader with better lighting model.
        material.envMap = cubeArray[Math.floor(Math.pow(roughness, 0.2) * 8)];
        // TODO(aki): Colored materials have clear white reflection.
        material.combine = THREE.AddOperation;
        material.reflectivity = 1 - roughness * 1;
        if (material.color.r !== 1 || material.color.g !== 1 || material.color.b !== 1) {
            var hsl = material.color.getHSL();
            material.reflectivity *= Math.pow(hsl.l, 2);
            material.specular = material.color.clone();
            material.color.multiplyScalar(Math.pow(roughness, 0.3));
            material.specular.multiplyScalar(1 - Math.pow(roughness, 2));
        }
    }
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
 * @param {Array} cubeArray             Array of textures
 */
function _createMaterial ( type, materialProperties, cubeArray ) {
    var material;
    // Just the properties that actually make sense for this material
    var props = {};
    // Add sidedness to local state if it is not present
    if ( materialProperties && !materialProperties.side ) {
        props.side = THREE.DoubleSide;
    }
    // Create a material of the appropriate type
    if ( type === constants.MATERIAL_TYPES.PHONG ) {
        // Add material properties related to shadows. This is an offset
        // to prevent z-fighting with stencil buffer shadows and their host object
        props.polygonOffset = true;
        props.polygonOffsetFactor = 1;
        props.polygonOffsetUnits = 1;
        props.vertexColors = THREE.VertexColors;

        _addKnownProps(constants.DEFAULT_MATERIAL_PROPERTIES.phong, materialProperties, props);
        material = new THREE.MeshPhongMaterial( props );
        material.color = _convertColor(materialProperties.color||constants.DEFAULT_PHONG_COLOR);

        // Apply roughness (modifies color and other material object properties)
        _applyRoughness(materialProperties.roughness, material, cubeArray);
        if (materialProperties.roughness) props.roughness = materialProperties.roughness;

    } else if ( type === constants.MATERIAL_TYPES.POINT ) {

        _addKnownProps(constants.DEFAULT_MATERIAL_PROPERTIES.point, materialProperties, props);
        material = new THREE.PointsMaterial( props );
        material.color = _convertColor(materialProperties.color||constants.DEFAULT_POINT_COLOR);

    } else if ( type === constants.MATERIAL_TYPES.LINE ) {

        props.vertexColors = THREE.VertexColors;
        _addKnownProps(constants.DEFAULT_MATERIAL_PROPERTIES.line, materialProperties, props);
        material = new THREE.LineBasicMaterial( props );
        material.color = _convertColor(materialProperties.color||constants.DEFAULT_LINE_COLOR);
    }
    // Use the material's name to track uniqueness of it's source
    material.name = materialToJson(type, props);

    if (material.opacity < 1) {
        material.transparent = true;
    }

    return material;

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
 * @param { THREE.Object3D } object The object to convert to z-up
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
 * @param { THREE.Mesh } mesh The mesh to receive the origin
 * @param { Array } origin The vector representing the origin
 */
function _applyOrigin ( mesh, origin ) {
    mesh.position.set(
        origin[ 0 ],
        origin[ 1 ],
        origin[ 2 ] ? origin[ 2 ] : 0
    );
}
