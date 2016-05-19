/**
 * Data structure to track unit conversion values.
 */
'use strict';

import FluxGeometryError from './geometryError.js';

export default function UnitRegistry() {
    // Dimension (string) -> bool
    this.dimensions = {};

    // Unit -> dimension
    this.units = {};

    // Alias -> Unit
    this.aliases = {};

    // Unit -> {Unit -> Scale}}
    this.conversions = {};

}

/**
 * Add a unit as a known type that can be converted
 * @param {String} unit The name of the unit (ex 'feet')
 * @param {String} dim The name of the dimension (ex 'length')
 * @param {Array.<String>} aliases Other names for the same unit (ex ['foot', 'ft'])
 */
UnitRegistry.prototype.addUnit = function (unit, dim, aliases) {
    this.units[unit] = dim;
    for(var i=0;i<aliases.length;i++) {
        this.aliases[aliases[i]] = unit;
    }
};

/**
 * Determine the numeric value to convert between two linear units
 * @param {String} from The old unit name
 * @param {String} to The new unit name
 * @returns {Number} The multiplier
 */
UnitRegistry.prototype.unitConversionFactor = function (from, to) {
    var standardFrom = from;
    if (this.aliases[from]) {
        standardFrom = this.aliases[from];
    }
    // Don't need to convert same units or
    // units that are known, but don't have a conversion
    if (from === to || standardFrom === to) {
        return 1.0;
    }
    var conversionFrom = this.conversions[from];
    if (!conversionFrom) {
        if (standardFrom) {
            conversionFrom = this.conversions[standardFrom];
        }
    }
    if (conversionFrom) {
        return conversionFrom[to];
    }
    // Known units that are missing conversions are considered a pass through
    if (this.units[standardFrom] && this.units[to]) {
        return 1.0;
    }
    // TODO(Kyle): This should be a warning
    // https://vannevar.atlassian.net/browse/LIB3D-709
    // throw new FluxGeometryError('Could not convert units from "'+from+'" to '+to);
    return null;
};

/**
 * Modify all the numeric properties in an object
 * @param {Object} obj The thing to modify
 * @param {Number} factor The multiplier for each property
 * @returns {Object} The modified object
 * @private
 */
function _scaleProperties(obj, factor) {
    if (obj) {
        if (obj.constructor === Number) {
            return obj * factor;
        }
        if (obj.constructor === Array) {
            return obj.map(function (item) {
                return _scaleProperties(item, factor);
            });
        }
        // TODO handle objects if needed
    }
    return obj;
}

/**
 * Create a function to repeatedly convert a pair of units
 * @param {String} from The old units
 * @param {String} to The new units
 * @returns {Function} The conversion function
 */
UnitRegistry.prototype.unitConversionFunc = function (from, to) {
    var factor = this.unitConversionFactor(from, to);
    if (factor !== null) {
        return function (obj) {
            if (!obj) {
                throw new FluxGeometryError('Invalid unit string '+obj);
            } else if (obj.constructor === Number) {
                return obj * factor;
            }
            return _scaleProperties(obj, factor);
        };
    }
    return null;
};

/**
 * Add a new dimension that can be measured
 * @param {String} d The dimension
 */
UnitRegistry.prototype.addConcreteDimension = function (d) {
    this.dimensions[d] = true;
};

/**
 * Register a scale factor for a given unit conversion
 * @param {String} from Old units
 * @param {String} to New units
 * @param {Number} scale The relative scale of the units
 */
UnitRegistry.prototype.addConversion = function (from, to, scale) {

    if (!this.conversions[from]) {
        this.conversions[from] = {};
    }
    if (this.conversions[from][to] == null) {
        this.conversions[from][to] = scale;
    }
};

/**
 * Factory function to create a units registry with common values populated
 *
 * This is hand migrated code from units-of-measurement / flux-measure.
 * We did not use the emscripten based port because it was too large (~2MB)
 * for what is a reasonable amount of JavaScript code. Also the web viewer
 * only needs a subset of the units conversion logic to display geometry.
 * TODO: move all these function calls into a .json file containing
 * the data and have the code loop over it instead of being hard coded.
 * It is this way currently to match the structure of the other repository.
 *
 * @returns {UnitRegistry} The new registry
 */
UnitRegistry.newStandardRegistry = function () {
    var r = new UnitRegistry();
    r.addConcreteDimension("length");

    r.addUnit("microns", "length", ["um", "micron"]);
    r.addUnit("millimeters", "length", ["mm", "millimeter"]);
    r.addUnit("centimeters", "length", ["cm", "centimeter"]);
    r.addUnit("meters", "length", ["m", "meter"]);
    r.addUnit("kilometers", "length", ["km", "kilometer"]);

    r.addUnit("inches", "length", ["inch", "in"]);
    r.addUnit("feet", "length", ["ft", "foot"]);
    r.addUnit("miles", "length", ["mile"]);

    r.addConversion("microns", "meters", 1e-6);
    r.addConversion("millimeters", "meters", 1e-3);
    r.addConversion("centimeters", "meters", 1e-2);
    r.addConversion("kilometers", "meters", 1e3);
    r.addConversion("feet", "meters", 0.30480);
    r.addConversion("inches", "meters", 0.0254);


    //---- The rest of these units don't actually work, but we want to register that they exist
    r.addConcreteDimension("area");

    r.addUnit("acres", "area", []);
    r.addUnit("hectares", "area", []);

    r.addConcreteDimension("volume");
    r.addUnit("liters", "volume", ["liter", "l"]);
    r.addUnit("gallons", "volume", ["gallon", "gal"]);

    r.addConcreteDimension("temperature");
    r.addUnit("farenheit", "temperature", ["F"]);
    r.addUnit("celsius", "temperature", ["C"]);
    r.addUnit("kelvin", "temperature", ["K"]);

    r.addConcreteDimension("time");
    r.addUnit("nanoseconds", "time", ["nanosecond", "ns"]);
    r.addUnit("microseconds", "time", ["microsecond", "us"]);
    r.addUnit("milliseconds", "time", ["milisecond", "ms"]);
    r.addUnit("seconds", "time", ["second", "s"]);
    r.addUnit("minutes", "time", ["minute"]);
    r.addUnit("hours", "time", ["hour", "h"]);
    r.addUnit("days", "time", ["day"]);
    r.addUnit("weeks", "time", ["week"]);
    r.addUnit("years", "time", ["year"]);

    r.addConcreteDimension("angle");
    r.addUnit("radians", "angle", ["radian", "rad"]);
    r.addUnit("degrees", "angle", ["degree", "deg"]);

    r.addConcreteDimension("mass");
    r.addUnit("grams", "mass", ["gram", "g"]);
    r.addUnit("kilograms", "mass", ["kilogram", "kg"]);
    r.addUnit("pounds", "mass", ["pound", "lb"]); // Use 'pounds' to refer to mass.

    r.addConcreteDimension("force");
    r.addUnit("newtons", "force", ["newton"]);
    r.addUnit("pound-force", "force", ["lbf"]);

    r.addConcreteDimension("energy");
    r.addUnit("joules", "energy", ["joule"]);
    r.addUnit("kwh", "energy", ["kilowatt hour"]);

    r.addConcreteDimension("luminous-intensity");
    r.addUnit("candelas", "luminous-intensity", ["candela"]);

    return r;
};