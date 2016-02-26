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
export var NURBS_CURVE_QUALITY = 4;
export var NURBS_SURFACE_QUALITY = 4;
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
