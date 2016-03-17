/**
 * set of helpers to work with materials
 */

'use strict';

import * as constants from './constants.js';

/**
 * Convert a material to hash like string.
 * The string will always be the same for the same property values,
 * and can be used to determine uniqueness of materials.
 * @param {constants.MATERIAL_TYPES} type The type of material
 * @param {THREE.material} m The material
 * @return {string} The result
 */
export default function materialToJson(type, m) {
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