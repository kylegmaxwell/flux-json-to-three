/**
 * Class to clean up entities before conversion.
 */
'use strict';

import convertUnits from '../units/unitConverter.js';
import * as schema from '../schemaValidator.js';
import * as materials from './materials.js';
import * as constants from '../constants.js';

/**
 * Modify an object and then return a copy of it with no null properties
 * @param  {Object} obj JSON data
 * @return {Object}     Updated JSON data
 */
function _removeNulls(obj) {
    if (!obj) return obj;
    var changed = _unsetNulls(obj);
    if (changed) {
        return JSON.parse(JSON.stringify(obj));
    } else {
        return obj;
    }
}

/**
 * Replace all properties on an object or it's children that are null with undefined
 * @param  {Object} obj JSON object data
 * @return  {Boolean} obj Whether any values were changed by setting to null
 */
function _unsetNulls(obj) {
    var changed = false;
    for (var key in obj) {
        if (obj[key] === null) {
            obj[key] = undefined;
            changed = true;
        } else if (obj[key] && typeof obj[key] === 'object') {
            if (_unsetNulls(obj[key])) {
                changed = true;
            }
        }
    }
    return changed;
}

/**
 * Convert all units to meters
 * @param  {Object} obj JSON object to modify
 */
function _convertUnits(obj) {
    if (obj != null && typeof obj === 'object') {
        if (obj.primitive) {
            convertUnits(obj);
        } else {
            for (var key in obj) {
                _convertUnits(obj[key]);
            }
        }
    }
}

/**
 * Check whether all primitives in a JSON object match their schema.
 * Removes entities that are invalid.
 * @param  {Object} obj        Flux JSON to check and modify
 * @param  {type} primStatus Container for error messages
 * @return {Boolean}            Returns true when the property needs to be removed
 */
function _checkSchema(obj, primStatus) {
    if (obj != null && typeof obj === 'object') {
        if (obj.primitive && typeof obj.primitive === 'string' && obj.primitive !== 'scene') {
            if (!schema.checkEntity(obj, primStatus)) {
                return true;
            }
        } else {
            for (var key in obj) {
                if (_checkSchema(obj[key], primStatus)) {
                    obj[key] = null;
                }
            }
        }
    }
}

/**
 * Convert color strings to arrays
 * @param  {Object} obj Flux JSON data to be modified
 */
function _convertColors(obj) {
    if (obj != null && typeof obj === 'object') {
        for (var key in obj) {
            var value = obj[key];
            if (key === 'color' && typeof obj[key] === 'string') {
                obj[key] = materials.scene.colorToArray(value);
            } else {
                _convertColors(value);
            }
        }
    }
}


/**
 * Check whether the materialProperties objects are valid
 * Replaces invalid material properties with empty ones
 * @param  {Object} obj        Flux JSON object to check and modify
 * @param  {StatusMap} primStatus Container for error messages
 */
function _checkMaterials(obj, primStatus) {
    var props = constants.LEGACY_INVERSE_PROPERTIES;
    if (obj != null && typeof obj === 'object') {
        for (var key in obj) {
            var value = obj[key];
            if (key === 'materialProperties') {
                for (var p in value) {
                    if (p in props) {
                        value[props[p]] = 1.0 - value[p];
                        value[p] = undefined;
                    }
                }
                if (!schema.checkMaterial(value, primStatus)) {
                    obj[key] = {};
                }
            } else if (typeof value === 'object'){
                _checkMaterials(value, primStatus);
            }
        }
    }
}

/**
 * Flatten a nested array into a simple list
 * This function is recursive.
 * @param  {Array} arr    Source data
 * @param  {Array} result Empty array to store elements
 * @return {Array}        Return the result again for convenience
 */
function _flattenArray(arr, result) {
    if (arr == null) return result;

    if (arr.constructor === Array) {
        for (var i=0;i<arr.length;i++) {
            _flattenArray(arr[i], result);
        }
    } else {
        result.push(arr);
    }
    return result;
}

/**
 * Clone an element and remove null properties
 * @param  {Object} entity JSON element data
 * @param  {StatusMap} primStatus Map to track errors per primitive
 * @return {Object}        New JSON object representation
 */
export default function cleanElement(entity, primStatus) {
    // Create a clone so that we can modify the properties in place
    // TODO(Kyle) This is slow for very large objects. The only reason we need a clone is for
    // the functions removeNulls and unitConverter, if we change those functions to return a new
    // data structure without modifying the result then this clone will not be necessary.
    var entityClone = JSON.parse(JSON.stringify(entity));

    // Guarantee that the data is an array and it is flat
    entityClone = _flattenArray([entity], []);

    _convertColors(entityClone);

    _checkMaterials(entityClone, primStatus);

    // Get rid of invalid properties commonly sent by plugins on elements
    // If they remain these properties will fail schema validation.
    entityClone = _removeNulls(entityClone);

    if (_checkSchema(entityClone, primStatus)) {
        return null;
    }

    _convertUnits(entityClone);

    return entityClone;
}
