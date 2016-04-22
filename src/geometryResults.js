/**
 * Container class for 3D geometry and errors.
 */
'use strict';

import * as schemaJson from 'flux-modelingjs/schemas/psworker.json';
import Ajv from 'ajv/dist/ajv.min.js';
import * as constants from './constants.js';
import ErrorMap from './errorMap.js';

//---- Singletons

// Mapping from primitive names to schema validator functions
var ajvValidators = null;

// Cache schema compiler object
var ajvSchema = null;

/**
 * Create schema compiler object
 * @private
 */
function _initSchema() {
    if (!ajvSchema) {
        ajvSchema = Ajv({ allErrors: true });
        ajvSchema.addSchema(schemaJson, "_");
        ajvValidators = {};
    }
}

/**
 * Compile the schema for the given primitive
 * @param {String} primitive The name of the primitive
 * @private
 * @returns {Function} The validator
 */
function _findValidator(primitive) {
    _initSchema();

    // Compile the schema for this primitive if needed
    if (!ajvValidators[primitive]) {
        var schemaPrim = schemaJson.entities[primitive];
        if (!schemaPrim) {
            return null;
        }
        var schemaId = "#/entities/"+primitive;
        ajvValidators[primitive] = ajvSchema.compile({ $ref: "_" + schemaId });
    }
    return ajvValidators[primitive];
}

//---- Class Definition

export default function GeometryResults() {
    // Container for all geometry results
    this.mesh = new THREE.Object3D();

    // Map from primitive name to error string or empty string when no error
    this.invalidPrims = new ErrorMap();

    // Array of THREE.Texture objects used for image based lighting
    this.cubeArray = null;

    this.clear();
}

/**
 * Clear / initialize all temporary arrays
 */
GeometryResults.prototype.clear = function () {
    // Buffer for prims that require a server call
    this.asyncPrims = [];

    // Buffer for combining all point objects
    this.pointPrims = [];

    // Buffer for combining all line objects
    this.linePrims = [];

    // Buffer for combining all surface objects
    this.phongPrims = [];

    // Map from geometry id to material
    // Used to detect shared materials when merging
    this._geometryMaterialMap = {};


};

/**
 * Check if the entities match the parasolid entity schema
 * @param {Array} entity Array of arrays or entities
 * @param {GeometryResults} geomResult Object container for errors
 * @returns {boolean} True if the schema checked out
 * @private
 */
GeometryResults.prototype.checkSchema = function (entity) {
    if (entity.primitive) {
        if (constants.NON_STANDARD_ENTITIES.indexOf(entity.primitive) !== -1) {
            return true;
        }
        var validate = _findValidator(entity.primitive);
        // Warning this assumes validate is synchronous so that we can
        // call validate on a singleton, and read the results safely from it's properties
        if (!validate) {
            this.invalidPrims.appendError(entity.primitive,"Unknown primitive type.");
            return false;
        }
        if (!validate(entity)) {
            this.invalidPrims.appendError(entity.primitive, _serializeErrors(validate.errors));
            return false;
        }
        return true;
    } else {
        return false;
    }
};

/**
 * Turn ajv errors into strings of their messages
 * @param {Array} errors Ajv error objects
 * @returns {string} Error message
 * @private
 */
function _serializeErrors(errors) {
    var messages = [];
    for (var i=0; i<errors.length; i++) {
        var error = errors[i];
        var message = '';
        if (error.dataPath) {
            message += error.dataPath+': ';
        }
        message += error.message;
        if ( Object.keys(error.params).length > 0) {
            var param = error.params[Object.keys(error.params)[0]];
            if (message.toLowerCase().indexOf(param) === -1) {
                message += ' ['+error.params[Object.keys(error.params)[0]]+']';
            }
        }
        messages.push(message);
    }
    return messages.join(', ');
}