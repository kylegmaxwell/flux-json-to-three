/**
 * Class to clean up entities before conversion.
 */
'use strict';

import convertUnits from '../units/unitConverter.js';
import * as schema from '../schemaValidator.js';
import {scene as modeling} from 'flux-modelingjs';
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
 * Check whether the given scene is valid
 * Removes invalid scene objects
 * @param  {Object} obj        Flux JSON to check and modify
 * @param  {StatusMap} primStatus Container for error messages
 * @return {Boolean}            Returns true for scenes that need to be removed
 */
function _checkScene(obj, primStatus) {
    if (obj != null && typeof obj === 'object') {
        if (obj.primitive === 'scene') {
            if (_checkSceneHelper(obj, primStatus)) {
                return true;
            }
        } else {
            for (var key in obj) {
                if (_checkScene(obj[key], primStatus)) {
                    obj[key] = null;
                }
            }
        }
    }
}

/**
 * Helper function validates a scene primitive once it is found
 * @param  {Object} scene      Flux JSON scene to check
 * @param  {StatusMap} primStatus Container for error messages
 * @return {Boolean}            Returns true when the scene should be removed
 */
function _checkSceneHelper(scene, primStatus) {
    var sceneValidator = new modeling.Validator();
    var sceneValid = sceneValidator.validateJSON(scene);
    if (!sceneValid.getResult()) {
        primStatus.appendError('scene', sceneValid.getMessage());
        return true;
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

    _convertColors(entityClone);

    _checkMaterials(entityClone, primStatus);

    if (_checkScene(entityClone, primStatus)) {
        return null;
    }

    // Get rid of invalid properties commonly sent by plugins on elements
    // If they remain these properties will fail schema validation.
    entityClone = _removeNulls(entityClone);

    if (_checkSchema(entityClone, primStatus)) {
        return null;
    }

    _convertUnits(entityClone);

    return entityClone;
}
