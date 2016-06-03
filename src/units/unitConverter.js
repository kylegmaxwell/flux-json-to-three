/**
 * Class to convert varied primitives into the same units.
 */
'use strict';

import UnitRegistry from './unitRegistry.js';
import * as constants from '../constants.js';
// import FluxGeometryError from './geometryError.js';
import pointer from 'json-pointer';

var registry = UnitRegistry.newStandardRegistry();

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
    var units = entityClone.units;
    // Iterate over each unit specification and set it on the object
    for (var unitString in units) {
        // json-pointer requires leading slash, but for us it's optional
        var unitPath = unitString;
        if (unitString[0]!=='/') {
            unitPath = '/'+unitString;
        }
        if (!pointer.has(entityClone, unitPath)) {
            // TODO(Kyle): This should be a warning
            // https://vannevar.atlassian.net/browse/LIB3D-709
            // throw new FluxGeometryError('Invalid unit path ' + unitString);
        } else {
            var unitValue = pointer.get(entityClone, unitPath);
            if (unitValue == null) {
                // TODO(Kyle): This should be a warning
                // https://vannevar.atlassian.net/browse/LIB3D-709
                // throw new FluxGeometryError('Invalid unit measure ' + unitString);
                continue;
            }
            var unitMeasure = units[unitString];
            var func = registry.unitConversionFunc(unitMeasure, constants.DEFAULT_UNITS);
            if (!func) {
                // TODO(Kyle): This should be a warning
                // https://vannevar.atlassian.net/browse/LIB3D-709
                // throw new FluxGeometryError('Unknown units specified');
                continue;
            }
            // _setPropIgnoreCase(prop, unitPath[j], func(unitValue));
            pointer.set(entityClone, unitPath, func(unitValue));
            entityClone.units[unitString] = constants.DEFAULT_UNITS;
        }
    }
    return entityClone;
}
