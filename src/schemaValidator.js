/**
 * Entry point for creating scenes.
 */
'use strict';

import Ajv from 'ajv/dist/ajv.min.js';
import * as schemaJson from 'flux-modelingjs/schemas/psworker.json';
import * as constants from './constants.js';

// Mapping from primitive names to schema validator functions
var ajvValidators = null;

// Cache schema compiler object
var ajvSchema = null;


/**
 * Check if the entities match the parasolid entity schema
 * @param {Array} entity Array of arrays or entities
 * @param {StatusMap} statusMap Container for errors
 * @returns {boolean} True if the schema checked out
 * @private
 */
export default function checkSchema (entity, statusMap) {
    if (entity.primitive) {
        if (constants.NON_STANDARD_ENTITIES.indexOf(entity.primitive) !== -1) {
            return true;
        }
        var validate = _findValidator(entity.primitive);
        // Warning this assumes validate is synchronous so that we can
        // call validate on a singleton, and read the results safely from it's properties
        if (!validate) {
            statusMap.appendError(_getDescriptor(entity),"Unknown primitive type.");
            return false;
        }
        if (!validate(entity)) {
            statusMap.appendError(_getDescriptor(entity), _serializeErrors(validate.errors));
            return false;
        }
        return true;
    } else {
        return false;
    }
}

function _getDescriptor(entity) {
    var descriptor = entity.primitive;
    if (entity.id) {
        descriptor += ':'+entity.id;
    }
    return descriptor;
}

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
 * @returns {Function} Ajv validator function
 * @private
 */
function _findValidator(primitive) {
    _initSchema();
    // Compile the schema for this primitive if needed
    if (!ajvValidators[primitive]) {
        var schemaPrim = schemaJson.entities[primitive];
        var schemaId = "#/entities/"+primitive;
        if (!schemaPrim) {
            schemaPrim = schemaJson[primitive];
            schemaId = "#/"+primitive;//scene, instance ...
        }
        if (!schemaPrim) {
            return null;
        }
        ajvValidators[primitive] = ajvSchema.compile({ $ref: "_" + schemaId });
    }
    return ajvValidators[primitive];
}

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
