'use strict';

import * as materials from './utils/materials.js';
import THREE from 'three';

/**
 * Replace the color of an object and its children with the given color
 * @param {THREE.Object3D} object The object to color
 * @param {String|THREE.Color} color  The new render color
 */
export function setObjectColor(object, color) {
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


/**
 * Apply the specified material to object and all of its children
 * @param {THREE.Object3D} object The object to color
 * @param {THREE.Material} material The material to set
 */
export function setObjectMaterial(object, material) {
    if (!material) return;

    object.traverse(function (child) {
        if (child.geometry && child.material.vertexColors === THREE.VertexColors) {
            if (child.type === 'Mesh') {
                child.material = material.surface;
            } else if (child.type === 'Line'){
                child.material = material.line;
            } else if (child.type === 'Points'){
                child.material = material.point;
            }
        }
    });
}
