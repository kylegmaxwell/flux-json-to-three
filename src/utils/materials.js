/**
 * set of helpers to work with materials
 */

'use strict';

import * as THREE from 'three';
import * as constants from '../constants.js';
export {scene} from 'flux-modelingjs';
import * as print from './debugPrint.js';

// Environment texture for image-based lighting.
var iblCube = null;

// Loads textures
function loadImages() {
    return new Promise(function (resolve) {
        var loader = new THREE.CubeTextureLoader();
        loader.setCrossOrigin(true);
        iblCube = loader.load(constants.CUBE_URLS, resolve, undefined, function() {
            print.warn('Unable to load image based lighting.');
            resolve();
        });
        iblCube.format = THREE.RGBFormat;
    });
}

// Singleton promise for async loading
var imagesLoadingPromise = null;

/**
 * Check if the entity needs IBL and load it.
 * You must wait for this promise to finish, before you start calling createMaterial
 *
 * @param  {type} entities description
 * @return {type}          description
 */
export function prepIBL(entities) {
    var needsImages = _needsIBL(entities);
    if (needsImages && !imagesLoadingPromise) {
        imagesLoadingPromise = loadImages();
    }
    return imagesLoadingPromise || Promise.resolve();
}


/**
 * Helper function to run a callback on each entity in the nested array
 * TODO this might need to wait until after polySurface is flattened
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
 * Determine if the given data contains materials that reflect image based lighting.
 * Then it is necessary to load the related textures.
 *
 * @param  {Object}     entities Flux JSON formatted object.
 * @return {Boolean}    Whether the materials have roughness.
 */
export function _needsIBL(entities) {
    return _recursiveReduce(entities, function (item) {
        for (var i=0;i<constants.IBL_PROPERTIES.length; i++) {
            var key = constants.IBL_PROPERTIES[i];
            var value = _getEntityData(item, key, undefined);
            if (value != null && value !== constants.DEFAULT_MATERIAL_PROPERTIES.surface[key]) {
                return true;
            }
        }
        return false;
    });
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
 * Get the value and apply to the properties if set, with defaults
 * @param  {Object} propsSource  User input material properties
 * @param  {String} nameSource   Name of the input property
 * @param  {Object} propsDest    Material properties for three.js
 * @param  {String} nameDest     Name of the three.js property
 * @param  {Boolean} invertDest  Whether the output is the complement of the input
 */
function _getPropertyValue(propsSource, nameSource, propsDest, nameDest, invertDest) {
    var value;
    if (propsSource[nameSource] != null) {
        value = propsSource[nameSource];
    } else {
        value = constants.DEFAULT_MATERIAL_PROPERTIES.surface[nameSource];
    }
    if (value != null) {
        if (invertDest) {
            value = 1.0 - value;
        }
        propsDest[nameDest] = value;
    }
}
/**
 * Modify a material to approximate a shading model with roughness
 * @param {Object}              propsSource Flux material properties
 * @param {Object}              propsDest   Resulting three.js material properties
 * @private
 */
function _applyPhysicalProperties(propsSource, propsDest) {

    if (propsSource.wireframe != null) {
        propsDest.wireframe = propsSource.wireframe;
    }

    var props = constants.FLUX_MATERIAL_TO_THREE;
    for (var p in props) {
        var destName = props[p];
        var complement = destName in constants.LEGACY_INVERSE_PROPERTIES;
        _getPropertyValue(propsSource, p, propsDest, destName, complement);
    }

    // Convert colors
    propsDest.color = _convertColor(propsDest.color);
    if (propsDest.emissive){
        propsDest.emissive = _convertColor(propsDest.emissive);
    }

    if (iblCube != null) {
        propsDest.envMap = iblCube;
    }
}

/**
 * Helper method to create the material from the material properties.
 * There are only a few types of materials used, this function takes a type
 * and returns a material with the properties object given
 *
 * @private
 * @param { Number } type               A member of the enumeration of material types
 *                                      present in the parasolid utility
 * @param { Object } materialProperties A set of properties that functions
 *                                      as options for the material
 * @param {GeometryResults} geomResult  Container for textures and errors
 * @return { THREE.Material } an instance of a Three.js material
 */
export function create(type, materialProperties) {
    var material;
    // Just the properties that actually make sense for this material
    var props = {};
    // Add sidedness to local state if it is not present
    if ( !materialProperties || materialProperties.side == null ) {
        props.side = THREE.DoubleSide;
    } else {
        props.side = materialProperties.side;
    }

    var masterMaterial = {};
    // Create a material of the appropriate type
    if ( type === constants.MATERIAL_TYPES.SURFACE || type === constants.MATERIAL_TYPES.ALL ) {

        if (type !== constants.MATERIAL_TYPES.ALL) {
            props.vertexColors = THREE.VertexColors;
        }

        _applyPhysicalProperties(materialProperties, props);
        material = new THREE.MeshPhysicalMaterial( props );
        masterMaterial.surface = material;
    }
    if ( type === constants.MATERIAL_TYPES.POINT || type === constants.MATERIAL_TYPES.ALL ) {
        props = {};
        _addKnownProps(constants.DEFAULT_MATERIAL_PROPERTIES.point, materialProperties, props);
        material = new THREE.PointsMaterial( props );
        material.color = _convertColor(materialProperties.color||constants.DEFAULT_MATERIAL_PROPERTIES.point.color);
        masterMaterial.point = material;
    }
    if ( type === constants.MATERIAL_TYPES.LINE || type === constants.MATERIAL_TYPES.ALL) {
        props = {};
        if (type !== constants.MATERIAL_TYPES.ALL) {
            props.vertexColors = THREE.VertexColors;
        }
        _addKnownProps(constants.DEFAULT_MATERIAL_PROPERTIES.line, materialProperties, props);
        material = new THREE.LineBasicMaterial( props );
        material.color = _convertColor(materialProperties.color||constants.DEFAULT_MATERIAL_PROPERTIES.line.color);
        masterMaterial.line = material;
    }
    // Use the material's name to track uniqueness of it's source
    material.name = materialToJson(type, props);

    if (material.opacity < 1) {
        material.transparent = true;
    }
    if (type === constants.MATERIAL_TYPES.ALL) {
        return masterMaterial;
    } else {
        return material;
    }
}

/**
 * Convert a material to hash like string.
 * The string will always be the same for the same property values,
 * and can be used to determine uniqueness of materials.
 * @param {constants.MATERIAL_TYPES} type The type of material
 * @param {THREE.material} m The material
 * @return {string} The result
 */
export function materialToJson(type, m) {
    var knownProperties = constants.DEFAULT_MATERIAL_PROPERTIES;
    var propertyNames = [];
    var prop;
    switch ( type ) {
        case constants.MATERIAL_TYPES.SURFACE: {
            propertyNames = Object.keys(knownProperties.surface).concat(
                constants.THREE_MATERIAL_PROPERTIES);
            break;
        }
        case constants.MATERIAL_TYPES.POINT: {
            propertyNames = Object.keys(knownProperties.point);
            break;
        }
        case constants.MATERIAL_TYPES.LINE: {
            propertyNames = Object.keys(knownProperties.line);
            break;
        }
    }
    propertyNames.sort();
    var orderedMaterial =[];
    var i, len;
    for (i=0, len=propertyNames.length; i<len; i++) {
        var name = propertyNames[i];
        if (name === 'color') continue;
        prop = m[name];
        if (prop != null) {
            orderedMaterial.push(name+JSON.stringify(prop));
        }
    }
    // Use the type (mesh, surface, line) as a namespace to separate materials
    var result = JSON.stringify(type);
    result += JSON.stringify(orderedMaterial);
    return result;
}

/**
 * Convert a color string or array to an object
 * @param {String|Array} color The html color
 * @returns {THREE.Color} The color object
 * @private
 */
export function _convertColor(color) {
    if (color == null) {
        color = constants.DEFAULT_MATERIAL_PROPERTIES.surface.color;
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
 * Find a parameter on the entity object data
 * @param {Object} data The entity parameters object
 * @param {String} attr The name of the desired attribute
 * @param {*} defaultAttr The default value for the attribute
 * @returns {*} The found property or the default
 * @private
 */
export function _getEntityData(data, attr, defaultAttr) {
    if (!data) return defaultAttr;
    var value = defaultAttr;
    if (data[attr]) {
        value = data[attr];
    } else if (data.materialProperties && data.materialProperties[attr]) {
        value = data.materialProperties[attr];
    } else if (data.attributes && data.attributes.materialProperties && data.attributes.materialProperties[attr]) {
        value = data.attributes.materialProperties[attr];
    }
    return value;
}
