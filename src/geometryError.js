/**
 * Custom error class for geometry related issues.
 *
 * @param { String } message Description of the error.
 */
'use strict';
export default function FluxGeometryError(message) {
    this.name = 'FluxGeometryError';
    this.message = message || 'Invalid or degenerate geometry specified.';
    this.stack = (new Error()).stack;
}
FluxGeometryError.prototype = Object.create(Error.prototype);
FluxGeometryError.prototype.constructor = FluxGeometryError;
