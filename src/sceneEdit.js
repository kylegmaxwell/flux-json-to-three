'use strict';

import * as materials from './materials.js';

/**
 * Replace the color of an object and it's children with the given color
 * @param {String|THREE.Color} color  The new render color
 * @param {THREE.Object3D} object The object to color
 */
//setlayercolor
export default function setObjectColor(object, color) {
    if (!color) return;

    var colorObj = materials._convertColor(color);

    object.traverse(function (child) {
        if (child.geometry && child.material) {
            // Clear the old color
            var colors = child.geometry.attributes.color.array;
            for (var i=0;i<color.length;i++) {
                colors[i] = 1;
            }
            // Apply color to material (multiplies with per vertex color)
            child.material.color.set(colorObj);
        }
    });
}
