/**
 * set of helpers to make primitives
 */

'use strict';

/*
 * imports
 */
import {
    Object3D,
    Vector3,
    Vector4,
    Face3,
    CylinderGeometry,
    Mesh,
    SphereBufferGeometry,
    TorusGeometry,
    BoxGeometry,
    CircleGeometry,
    PlaneBufferGeometry,
    BufferGeometry,
    Points,
    BufferAttribute,
    ArrowHelper,
    Line,
    Geometry,
    NURBSCurve,
    NURBSSurface,
    ParametricGeometry,
    TextHelper
} from 'three';

import VectorManager from './vectorManager.js';

import * as wirePrimitives from './wirePrimitives.js';
import * as sheetPrimitives from './sheetPrimitives.js';
import * as solidPrimitives from './solidPrimitives.js';
import * as constants from './constants.js';

var BODY_TYPES = {
    minimum: 0,
    wire: 1,
    sheet: 2,
    solid: 3,
    other: 4,
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
 * Creates a planar mesh from parasolid data and a material
 *
 * @function plane
 *
 * @return { ThreeJS.Mesh } The planar mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function plane ( data, material ) {
    var geometry = new PlaneBufferGeometry( constants.PLANE_DEFAULTS.WIDTH, constants.PLANE_DEFAULTS.HEIGHT,
                                            constants.PLANE_DEFAULTS.WIDTH_SEGMENTS, constants.PLANE_DEFAULTS.HEIGHT_SEGMENTS );
    return new Mesh( geometry, material );
}

/**
 * Creates a point mesh from parasolid data and a material
 *
 * @function point
 *
 * @return { ThreeJS.Mesh } The point mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function point ( data, material ) {
    var positions = new Float32Array( data.point ),
        geometry = new BufferGeometry();

    geometry.addAttribute( 'position', new BufferAttribute( positions, 3 ) );
    geometry.computeBoundingBox();
    return new Points( geometry, material );
}

/**
 * Creates a vector mesh from parasolid data and a material
 *
 * @function vector
 *
 * @return { ThreeJS.Mesh } The vector mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function vector ( data ) {
    var dir = new Vector3( data.coords[ 0 ], data.coords[ 1 ], data.coords[ 2 ] ),
        origin = new Vector3( 0, 0, 0 );

    if ( dir.length() > 0 ) dir.normalize();
    else throw new Error( 'Vector primitive has length zero' );

    return new ArrowHelper( dir, origin, dir.length() );
}

/**
 * Creates a mesh with multiple curves from parasolid data and a material
 *
 * @function polycurve
 *
 * @return { ThreeJS.Mesh } The mesh with curves
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function polycurve ( data, material ) {
    var mesh = new Object3D();
    var i, len;
    for ( i = 0, len = data.curves.length ; i < len ; i++ ) {
        var curveData = data.curves[ i ];
        if (curveData.primitive && getEntityType(curveData.primitive) === BODY_TYPES.wire) {
            var wireFunction = wirePrimitives[curveData.primitive];
            mesh.add( wireFunction( data.curves[ i ], material ) );
        } else {
            throw new Error( 'Found non wire body in a polycurve' );
        }
    }

    return mesh;
}

/**
 * Creates a polysurface mesh from parasolid data and a material
 *
 * @function polysurface
 *
 * @return { ThreeJS.Mesh } The polysurface mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 *
 */
export function polysurface ( data, material ) {
    var mesh = new Object3D();

    for ( var i = 0, len = data.surfaces.length ; i < len ; i++ ) {
        var surfaceData = data.surfaces[ i ];
        if (surfaceData.primitive && getEntityType(surfaceData.primitive) === BODY_TYPES.sheet) {
            var sheetFunction = sheetPrimitives[surfaceData.primitive];
            mesh.add( sheetFunction( data.surfaces[ i ], material ) );
        } else {
            throw new Error( 'Found non sheet body in a polysurface' );
        }
    }

    return mesh;
}

/**
 * Creates a linear mesh from parasolid data and a material
 *
 * @function text
 *
 * @return { ThreeJS.Mesh } The linear mesh
 *
 * @param { Object } data     Parasolid data
 */
export function text ( data ) {
    return new TextHelper( data.text, {
        size: data.size,
        resolution: data.resolution,
        color: data.color,
        align: data.align
    });
}
