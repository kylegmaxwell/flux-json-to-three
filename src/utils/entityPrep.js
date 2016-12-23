/**
 * Class to clean up entities before conversion.
 */
'use strict';

import { scene } from 'flux-modelingjs';

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
 * Extract only the geometry entities to render for scenes that are invalid due to errors
 * @param  {Object} entity Flux JSON data.
 * @return {Array}        Flux JSON data list of geometry entities.
 */
export default function cleanEntities(entity) {
    var entityClone = _flattenArray([entity], []);
    for (var i=0;i<entityClone.length;i++) {
        var e = entityClone[i];
        if (e != null && typeof e === 'object' && typeof e.primitive === 'string') {
            if (e.primitive in scene.SCENE_PRIMITIVES) {
                entityClone[i] = null;
            }

        }
    }
    return entityClone;
}
