'use strict';

import * as materials from './utils/materials.js';
import * as THREE from 'three';

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
            for (var i=0;i<colors.length;i++) {
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
        // Meshes can have vertex colors when they are the result of merging two different
        // primitives with different materialProperties.
        var notMesh = child.type !== 'Mesh';
        var canOverride = notMesh || child.material.vertexColors === THREE.VertexColors;
        if (child.geometry && canOverride) {
            if (child.type === 'Mesh') {
                child.material = material.surface.clone();
            } else if (child.type === 'Line'){
                child.material = material.line.clone();
            } else if (child.type === 'Points'){
                child.material = material.point.clone();
            }
        }
    });
}
