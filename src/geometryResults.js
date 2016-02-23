/**
 * Custom error class for geometry related issues.
 *
 * @param { String } message Description of the error.
 */
'use strict';
export default function GeometryResults() {
    this.mesh = new THREE.Object3D();
    this.invalidPrims = {};
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
};
