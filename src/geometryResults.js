'use strict';

import THREE from 'three';
import StatusMap from './statusMap.js';

/**
 * Container class for 3D geometry and errors.
 */
export default function GeometryResults() {
    // Container for all geometry results
    this.object = new THREE.Object3D();

    // Map from primitive name to error string or empty string when no error
    this.primStatus = new StatusMap();

    // Array of THREE.Texture objects used for image based lighting
    this.cubeArray = null;

    // Buffer for prims that require a server call
    this.asyncPrims = [];

    // Buffer for combining all point objects
    this.pointPrims = [];

    // Buffer for combining all line objects
    this.linePrims = [];

    // Buffer for combining all surface objects
    this.phongPrims = [];

    // List of layers
    this._layerPrims = [];

    // Map from geometry id to material
    // Used to detect shared materials when merging
    this._geometryMaterialMap = {};
}
