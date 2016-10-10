/**
 * Class to clean up entities before conversion.
 */
'use strict';

import convertUnits from '../units/unitConverter.js';
import { scene as schema } from 'flux-modelingjs';
import * as materials from './materials.js';
import * as constants from '../constants.js';
import * as revitUtils from './revitUtils.js';

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
 * Replace all properties on an object or its children that are null with undefined
 * @param  {Object} obj JSON object data
 * @return  {Boolean} obj Whether any values were changed by setting to null
 */
function _unsetNulls(obj) {
    var changed = false;
    // Collapse array
    if (obj.constructor === Array) {
        var arr = [];
        var i;
        for (i=0;i<obj.length;i++) {
            if (obj[i]!=null) arr.push(obj[i]);
        }
        obj.length = arr.length;
        for (i=0;i<obj.length;i++) {
            obj[i] = arr[i];
        }
    }
    // Unset nulls
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
            // Handle units set on the container
            convertUnits(obj);
            // Handle units on the children
            if (obj.primitive === 'polycurve') {
                _convertUnits(obj.curves);
            } else if (obj.primitive === 'polysurface') {
                _convertUnits(obj.surfaces);
            } else if (obj.primitive === 'revitElement') {
                _convertUnits(revitUtils.extractGeom(obj));
            }
        } else {
            for (var key in obj) {
                _convertUnits(obj[key]);
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

// TODO(Kyle) Move these constructors to modelingjs for LIB3D-778

/**
 * Create a group primitive
 * @param  {String} id                  Unique id
 * @param  {Array.<String>} children    Array of ids
 * @return {Object}                     Group JSON
 */
function createGroup(id, children) {
    return {
        primitive: constants.SCENE_PRIMITIVES.group,
        id: id,
        children: children
    };
}


/**
 * Create an instance primitive
 * @param  {String} id      Unique identifier
 * @param  {String} child   Id of child object
 * @return {Object}         Flux JSON for instance
 */
function createInstance(id, child) {
    return {
        primitive: constants.SCENE_PRIMITIVES.instance,
        id: id,
        entity: child
    };
}


/**
 * Replace a container element in the scene with a group
 * @param  {Array} scene       Array of Flux JSON
 * @param  {Object} element     Container element to be replaced
 * @param  {Array} children     Array of child entities
 * @return {Object}             New group JSON
 */
function _replaceElementScene(scene, element, children) {
        var ids = [];
        for (var c=0;c<children.length;c++) {
            var child = children[c];
            // Assign an id to the child (previously could not be referenced)
            child.id = element.id+'-child-'+c;
            var instance = createInstance(element.id+'-instance-'+c, child.id);
            scene.push(child);
            scene.push(instance);
            ids.push(instance.id);
        }
        var group = createGroup(element.id, ids);
        return group;
}

/**
 * Flatten a container element and use its children instead
 * @param  {Array} entities Array of Flux JSON
 * @param  {Object} element     Container element to be replaced
 * @param  {Array} children     Array of child entities
 */
function _replaceElement(entities, element, children) {
    _convertUnits(element);
    for (var c=0;c<children.length;c++) {
        var child = children[c];
        if (element.attributes) {
            child.attributes = element.attributes;
        }
        entities.push(child);
    }
}
/**
 * Get rid of container entities and replace them with equivalent content.
 * @param  {Object} entities Array of Flux JSON
 */
function _flattenElements(entities) {
    var i;
    var isScene = schema.isScene(entities);
    var convertedIds = [];
    for (i=0;i<entities.length;i++) {
        var entity = entities[i];
        if (!entity || !entity.primitive) continue;
        if (constants.CONTAINER_PRIMS.indexOf(entity.primitive) !== -1 ) {
            var children = entity[constants.CONTAINER_PRIM_MAP[entity.primitive]];
            // if the entity has an id and this is a scene then replace it with a group
            if (entity.id && isScene) {
                entities[i] = _replaceElementScene(entities, entity, children);
                convertedIds.push(entity.id);
            } else {
                // otherwise just move the entities out and transfer attributes
                entities[i] = null;
                _replaceElement(entities, entity, children);
            }
        }
    }
    for (i=0;i<entities.length;i++) {
        entity = entities[i];
        if (!entity || !entity.primitive) continue;
        if (entity.primitive === constants.SCENE_PRIMITIVES.instance && entity.entity && convertedIds.indexOf(entity.entity) !== -1) {
            entity.primitive = constants.SCENE_PRIMITIVES.group;
            entity.children = [entity.entity];
        }
    }
}

/**
 * Remove all revit data, and just keep render geometry
 * @param  {Array} entities Array of Flux JSON
 */
function _explodeRevit(entities) {
    for (var i=0;i<entities.length;i++) {
        var entity = entities[i];
        if (!entity || !entity.primitive) continue;
        if (entity.primitive === 'revitElement') {
            entities[i] = revitUtils.extractGeom(entity);
        }
    }
}

/**
 * Clone an element and transform it into a valid scene for rendering
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

    _explodeRevit(entityClone);

    _flattenElements(entityClone);

    _convertColors(entityClone);

    _checkMaterials(entityClone, primStatus);

    // Get rid of invalid properties commonly sent by plugins on elements
    // If they remain these properties will fail schema validation.
    entityClone = _removeNulls(entityClone);

    if (schema.checkSchema(entityClone, primStatus)) {
        return null;
    }

    _convertUnits(entityClone);

    return entityClone;
}
