/**
 * Class to clean up entities before conversion.
 */
'use strict';
/**
 * Modify an object and then return a copy of it with no null properties
 * @param  {Object} obj JSON data
 * @return {Object}     Updated JSON data
 */
function _removeNulls(obj) {
    if (!obj) return obj;
    _unsetNulls(obj);
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Replace all properties on an object or it's children that are null with undefined
 * @param  {Object} obj JSON object data
 */
function _unsetNulls(obj) {
    for (var key in obj) {
        if (obj[key] === null) {
            obj[key] = undefined;
        } else if (typeof obj[key] === 'object') {
            _removeNulls(obj[key]);
        }
    }
}

/**
 * Clone an element and remove null properties
 * @param  {Object} entity JSON element data
 * @return {Object}        New JSON object representation
 */
export default function cleanElement(entity) {

    // Create a clone so that we can modify the properties in place
    var entityClone = JSON.parse(JSON.stringify(entity));

    // Get rid of invalid properties commonly sent by plugins on elements
    // If they remain these properties will fail schema validation.
    entityClone = _removeNulls(entityClone);

    return entityClone;
}
