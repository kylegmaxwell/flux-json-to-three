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
            changed = changed || _unsetNulls(obj[key]);
        }
    }
    return changed;
}

/**
 * Clone an element and remove null properties
 * @param  {Object} entity JSON element data
 * @return {Object}        New JSON object representation
 */
export default function cleanElement(entity) {

    // Create a clone so that we can modify the properties in place
    // TODO(Kyle) This is slow for very large objects. The only reason we need a clone is for
    // the functions removeNulls and unitConverter, if we change those functions to return a new
    // data structure without modifying the result then this clone will not be necessary.
    var entityClone = JSON.parse(JSON.stringify(entity));

    // Get rid of invalid properties commonly sent by plugins on elements
    // If they remain these properties will fail schema validation.
    entityClone = _removeNulls(entityClone);

    return entityClone;
}
