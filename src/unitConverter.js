/**
 * Class to convert varied primitives into the same units.
 */
'use strict';

import UnitRegistry from './unitRegistry.js';
import * as constants from './constants.js';
import FluxGeometryError from './geometryError.js';

var registry = UnitRegistry.newStandardRegistry();

/**
 * Find a property of an object, but ignore case
 * @param  {Object} obj  The dictionary
 * @param  {String} prop The case insensitive key
 * @return {Object}      The property or undefined
 */
function _lookupPropIgnoreCase(obj, prop) {
    var keys = Object.keys(obj);
    for (var i=0;i<keys.length;i++) {
        if (keys[i].toLocaleLowerCase() === prop.toLocaleLowerCase()) {
            return obj[keys[i]];
        }
    }
    return undefined;
}

/**
 * Set a property on an object if it matches the given one regardless of case.
 * @param {Object} obj   The object on which to set the property
 * @param {String} prop  The property name to set
 * @param {Object} value  The property value to set
 */
function _setPropIgnoreCase(obj, prop, value) {
    var keys = Object.keys(obj);
    for (var i=0;i<keys.length;i++) {
        if (keys[i].toLocaleLowerCase() === prop.toLocaleLowerCase()) {
            obj[keys[i]] = value;
            return;
        }
    }
    // If there was not case insensitive match, then add the property as new
    obj[prop] = value;
}


/**
 * Convert an entity to standardized units
 * @param {Object} entity Flux entity parameters object
 * @returns {Object} A copy of the entity with standardized units.
 */
export default function convertUnits (entity) {
    // Create a clone so that we can modify the properties in place
    var entityClone = JSON.parse(JSON.stringify(entity));
    if (!entityClone.units) {
        return entityClone;
    }
    var units = Object.keys(entityClone.units).sort();
    var i, j;
    // Iterate over each unit specification and set it on the object
    for (i=0;i<units.length;i++) {
        var unitString = units[i];
        var unitItems = unitString.trim().split('/');
        var unitPath = [];
        for (j = 0; j < unitItems.length; j++) {
            if (unitItems[j]) { // skip empty string
                unitPath.push(unitItems[j]);
            }
        }
        var unitMeasure = _lookupPropIgnoreCase(entityClone.units, unitString);
        var prop = entityClone;
        // Dig in to the next to last level so the property can be replaced
        for (j=0;j<unitPath.length-1;j++) {
            prop = _lookupPropIgnoreCase(prop,unitPath[j]);
            if (prop == null) {
                throw new FluxGeometryError('Invalid unit path '+unitString);
            }
        }
        var unitValue = _lookupPropIgnoreCase(prop,unitPath[j]);
        if (unitValue == null) {
            // TODO(Kyle): This should be a warning
            // https://vannevar.atlassian.net/browse/LIB3D-709
            // throw new FluxGeometryError('Invalid unit path ' + unitString);
            continue;
        }
        var func = registry.unitConversionFunc(unitMeasure, constants.DEFAULT_UNITS);
        if (!func) {
            // TODO(Kyle): This should be a warning
            // https://vannevar.atlassian.net/browse/LIB3D-709
            // throw new FluxGeometryError('Invalid units specified');
            continue;
        }
        _setPropIgnoreCase(prop, unitPath[j], func(unitValue));
        entityClone.units[unitString] = constants.DEFAULT_UNITS;
    }
    return entityClone;
}
