/**
 * set of helpers to make primitives
 */

'use strict';

import * as materials from '../materials.js';
import TextHelper from '../helpers/TextHelper.js';

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
    var textHelper = new TextHelper( data.text, {
        size:       materials._getEntityData(data, 'size', undefined),
        resolution: materials._getEntityData(data, 'resolution', undefined),
        align:      materials._getEntityData(data, 'align', undefined)
    });
    textHelper.material.color = materials._convertColor(materials._getEntityData(data, 'color', 'black'));
    return textHelper;
}
