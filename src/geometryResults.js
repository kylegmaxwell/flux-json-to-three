/**
 * Custom error class for geometry related issues.
 *
 * @param { String } message Description of the error.
 */
export default function GeometryResults() {
    this.mesh = new THREE.Object3D();
    this.invalidPrims = {};
    this.asyncPrims = [];
}