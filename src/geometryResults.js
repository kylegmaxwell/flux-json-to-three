'use strict';

import THREE from 'three';
import {scene} from 'flux-modelingjs';
var StatusMap = scene.StatusMap;

/**
 * Container class for 3D geometry and errors.
 * Note: This could call clear, but does not in order to allow JavaScript
 * compiler to optimize the member variable initialization
 * asyncPrims - Buffer for prims that require a server call
 * pointPrims - Buffer for combining all point objects
 * linePrims - Buffer for combining all line objects
 * surfacePrims - Buffer for combining all surface objects
 * _layerPrims - List of layers
 */
export default function GeometryResults() {
    // Container for all geometry results
    this.object = new THREE.Object3D();

    // Map from primitive name to error string or empty string when no error
    this.primStatus = new StatusMap();

    this.asyncPrims = [];
    this.pointPrims = [];
    this.linePrims = [];
    this.surfacePrims = [];
    this._layerPrims = [];
}

/**
 * Reset all temporary buffers so new geometry can be added
 */
GeometryResults.prototype.clear = function () {
    this.asyncPrims = [];
    this.pointPrims = [];
    this.linePrims = [];
    this.surfacePrims = [];
    this._layerPrims = [];
};
