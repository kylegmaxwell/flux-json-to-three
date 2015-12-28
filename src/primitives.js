/**
 * set of helpers to make primitives
 */

'use strict';

import * as wirePrimitives from './wirePrimitives.js';
import * as sheetPrimitives from './sheetPrimitives.js';
import * as solidPrimitives from './solidPrimitives.js';
import * as constants from './constants.js';
import FluxGeometryError from './geometryError.js';

var BODY_TYPES = {
    minimum: 0,
    wire: 1,
    sheet: 2,
    solid: 3,
    other: 4
};

var wirePrimitivesList = Object.keys(wirePrimitives);
var sheetPrimitivesList = Object.keys(sheetPrimitives);
var solidPrimitivesList = Object.keys(solidPrimitives);

function getEntityType ( primitive ) {
    if (wirePrimitivesList.indexOf(primitive) !== -1) {
        return BODY_TYPES.wire;
    }
    if (sheetPrimitivesList.indexOf(primitive) !== -1) {
        return BODY_TYPES.sheet;
    }
    if (solidPrimitivesList.indexOf(primitive) !== -1) {
        return BODY_TYPES.solid;
    }
    return 'other';
}

/**
 * Creates a planar THREE.Mesh from parasolid data and a material
 *
 * @function plane
 *
 * @return { THREE.Mesh } The planar THREE.Mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function plane ( data, material ) {
    var geometry = new THREE.PlaneBufferGeometry( constants.PLANE_DEFAULTS.WIDTH, constants.PLANE_DEFAULTS.HEIGHT,
                                            constants.PLANE_DEFAULTS.WIDTH_SEGMENTS, constants.PLANE_DEFAULTS.HEIGHT_SEGMENTS );
    return new THREE.Mesh( geometry, material );
}

/**
 * Creates a point THREE.Mesh from parasolid data and a material
 *
 * @function point
 *
 * @return { THREE.Mesh } The point THREE.Mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function point ( data, material ) {
    var positions = new Float32Array( data.point ),
        geometry = new THREE.BufferGeometry();

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.computeBoundingBox();
    return new THREE.Points( geometry, material );
}

/**
 * Creates a vector THREE.Mesh from parasolid data and a material
 *
 * @function vector
 *
 * @return { THREE.Mesh } The vector THREE.Mesh
 *
 * @throws FluxGeometryError if vector has zero length
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function vector ( data ) {
    var dir = new THREE.Vector3( data.coords[ 0 ], data.coords[ 1 ], data.coords[ 2 ] ),
        origin = new THREE.Vector3( 0, 0, 0 );

    if ( dir.length() > 0 ) dir.normalize();
    else throw new FluxGeometryError( 'Vector primitive has length zero' );

    return new THREE.ArrowHelper( dir, origin, dir.length() );
}

/**
 * Creates a THREE.Mesh with multiple curves from parasolid data and a material
 *
 * @function polycurve
 *
 * @return { THREE.Mesh } The THREE.Mesh with curves
 *
 * @throws FluxGeometryError if it contains non wire entities
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function polycurve ( data, material ) {
    var mesh = new THREE.Object3D();
    var i, len;
    for ( i = 0, len = data.curves.length ; i < len ; i++ ) {
        var curveData = data.curves[ i ];
        if (curveData.primitive && getEntityType(curveData.primitive) === BODY_TYPES.wire) {
            var wireFunction = wirePrimitives[curveData.primitive];
            mesh.add( wireFunction( data.curves[ i ], material ) );
        } else {
            throw new FluxGeometryError( 'Found non wire body in a polycurve' );
        }
    }

    return mesh;
}

/**
 * Creates a polysurface THREE.Mesh from parasolid data and a material
 *
 * @function polysurface
 *
 * @return { THREE.Mesh } The polysurface THREE.Mesh
 *
 * @throws FluxGeometryError if it contains non sheet entities
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh

 *
 */
export function polysurface ( data, material ) {
    var mesh = new THREE.Object3D();

    for ( var i = 0, len = data.surfaces.length ; i < len ; i++ ) {
        var surfaceData = data.surfaces[ i ];
        if (surfaceData.primitive && getEntityType(surfaceData.primitive) === BODY_TYPES.sheet) {
            var sheetFunction = sheetPrimitives[surfaceData.primitive];
            mesh.add( sheetFunction( data.surfaces[ i ], material ) );
        } else {
            throw new FluxGeometryError( 'Found non sheet body in a polysurface' );
        }
    }

    return mesh;
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
    return new THREE.TextHelper( data.text, {
        size: data.size,
        resolution: data.resolution,
        color: data.color,
        align: data.align
    });
}
