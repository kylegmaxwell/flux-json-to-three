/**
 * set of helpers to work with materials
 */

'use strict';

import THREE from 'three';
import * as constants from './constants.js';

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
        case constants.MATERIAL_TYPES.PHONG: {
            propertyNames = Object.keys(knownProperties.phong);
            // Special case roughness since its not a real property, but determines uniqueness
            propertyNames.push('roughness');
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
        prop = m[propertyNames[i]];
        if (prop) {
            orderedMaterial.push(prop);
        }
    }
    // Use the type (mesh, phong, line) as a namespace to separate materials
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