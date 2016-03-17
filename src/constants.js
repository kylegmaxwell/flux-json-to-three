/**
 * set of helpers to make wire primitives
 */

'use strict';

export var HALF_PI = Math.PI * 0.5;
export var TOLERANCE = 0.000001;
export var DEFAULT_ROTATION = new THREE.Vector3( HALF_PI, HALF_PI, 0 );
export var PLANE_DEFAULTS = {
        WIDTH: 10000,
        HEIGHT: 10000,
        WIDTH_SEGMENTS: 100,
        HEIGHT_SEGMENTS: 100
    };
export var CIRCLE_RES = 32;
export var DEG_2_RAD = Math.PI / 180;
export var MATERIAL_TYPES = {
    PHONG: 0,
    POINT: 1,
    LINE: 2
};
//----NURBS
export var NURBS_CURVE_QUALITY = 2.5;
export var NURBS_SURFACE_QUALITY = 2.5;
// A NURBS surface with angles between the faces of its control hull below
// this threshold will be considered flat
var degreesFlatLimit = 1.0;
export var NURBS_FLAT_LIMIT = degreesFlatLimit/180.0;

export var LEGACY_NAMES_MAP = {
    'point-2d': 'point',
    'polygon-set': 'polygonSet'
};
// For a face compare the angle between it's normals and those of
// it's neighbors. If all the angles are smaller than the limit,
// the face will be rendered smooth.
// Range is from 0 (more faceted) to 180 (more smooth)
var degreesSmoothLimit = 45;
export var NORMALS_SMOOTH_LIMIT = Math.cos(degreesSmoothLimit * DEG_2_RAD);

export var DEFAULT_POINT_COLOR = [0.5,0.5,0.8];
export var DEFAULT_LINE_COLOR =  [0.5,0.5,0.8];
export var DEFAULT_PHONG_COLOR = [  1,  1,  1];

export var DEFAULT_MATERIAL_PROPERTIES = {
    // color is per point
    phong: {
        opacity: 1.0,
        //roughness: 1.0,  TODO this has to be translated to specular as in flux-materialUtil.html
        wireframe: false,
        side: THREE.DoubleSide
    },
    point: {
        size: 5.0,
        sizeAttenuation: true
    },
    line: {
        linewidth: 1.0
    }
};