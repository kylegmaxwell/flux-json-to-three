/**
 * Custom error class for geometry related issues.
 *
 * @param { String } message Description of the error.
 */
'use strict';
export default function GeometryResults() {
    // Container for all geometry results
    this.mesh = new THREE.Object3D();

    // Map from primitive name to boolean
    this.invalidPrims = {};

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
