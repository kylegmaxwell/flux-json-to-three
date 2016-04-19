/**
 * set of helpers to make primitives
 */

'use strict';

import * as materials from './materials.js';
import FluxGeometryError from './geometryError.js';

/**
 * Placeholder used to determine list of valid entity names
 * @function point
 * @throws FluxGeometryError Always
 */
export function point () {
    // Points are already handled in createPrimitive.js
    // since they are aggregated into one entity
    throw new FluxGeometryError('Something went wrong with our code.');
}

/**
 * Placeholder used to determine list of valid entity names
 * @function polycurve
 * @throws FluxGeometryError Always
 */
export function polycurve () {
    // Polycurve entities are de-constructed into their constituent
    // entities during by _flattenData in createObject
    throw new FluxGeometryError('Something went wrong with our code.');
}

/**
 * Placeholder used to determine list of valid entity names
 * @function polysurface
 * @throws FluxGeometryError Always
 */
export function polysurface ( ) {
    // Polysurface entities are de-constructed into their constituent
    // entities during by _flattenData in createObject
    throw new FluxGeometryError('Something went wrong with our code.');
}

/**
 * Placeholder used to determine list of valid entity names
 * @function brep
 * @throws FluxGeometryError Always
 */
export function brep ( ) {
    // Breps are added to the async primitives and thus never rendered here
    throw new FluxGeometryError('Something went wrong with our code.');
}

/**
 * Creates a linear THREE.Mesh from parasolid data and a material
 *
 * @function text
 *
 * @return { THREE.Mesh } The linear THREE.Mesh
 *
 * @param { Object } data     Parasolid data
 */
export function text ( data ) {
    var textHelper = new THREE.TextHelper( data.text, {
        size:       materials._getEntityData(data, 'size', undefined),
        resolution: materials._getEntityData(data, 'resolution', undefined),
        align:      materials._getEntityData(data, 'align', undefined)
    });
    textHelper.material.color = materials._convertColor(materials._getEntityData(data, 'color', 'black'));
    return textHelper;
}
