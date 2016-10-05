/**
 * set of helpers to make wire primitives
 */

'use strict';
import THREE from 'three';

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
    SURFACE: 0,
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

// These entities are not official Flux Entities, but can be rendered
export var NON_STANDARD_ENTITIES = 'stl obj text';

// These are primitives that are recognized as geometry, but get special
// treatment and do not have their own specific handler function in src/primitives
export var KNOWN_PRIMITIVES = ['point', 'polycurve', 'polysurface', 'brep', 'layer', 'revitElement'];

// Enumeration of strings used as primitive types in scenes
export var SCENE_PRIMITIVES = {
    layer: 'layer',
    group: 'group',
    instance: 'instance',
    geometry: 'geometryList'
};

// For a face compare the angle between it's normals and those of
// it's neighbors. If all the angles are smaller than the limit,
// the face will be rendered smooth.
// Range is from 0 (more faceted) to 180 (more smooth)
var degreesSmoothLimit = 45;
export var NORMALS_SMOOTH_LIMIT = Math.cos(degreesSmoothLimit * DEG_2_RAD);

export var POINT_PIXEL_SIZE = 2.0;

// These properties cause image based lighting maps to be loaded
export var IBL_PROPERTIES = ['glossiness', 'roughness', 'reflectivity'];

// These properties were renamed, and the old names are the complement (1 - new value)
export var LEGACY_INVERSE_PROPERTIES = {
    opacity: 'transparency',
    roughness: 'glossiness'
};

// These are properties defined on three.js materials that are used to differentiate
// them by the viewer's merging logic
export var THREE_MATERIAL_PROPERTIES = [
    'opacity',
    'roughness',
    'metalness',
    'emissive'
];

// Correspondence between Flux material properties and three.js
export var FLUX_MATERIAL_TO_THREE = {
    glossiness: 'roughness',
    transparency: 'opacity',
    reflectivity: 'metalness',
    color: 'color',
    emissionColor: 'emissive'
};
export var LEGACY_POINT_PROPERTIES = {
    pointSize: 'size'
};

export var DEFAULT_MATERIAL_PROPERTIES = {
    // color is per point
    surface: {
        color: [1,1,1],
        reflectivity: 0.0,
        glossiness: 0.0,
        transparency: null,
        emissionColor: null,
        wireframe: false,
        side: THREE.DoubleSide
    },
    point: {
        color: [0.5,0.5,0.8],
        pointSize: 0.001,// This default helps with very small points coming from grasshopper in millimeters
        sizeAttenuation: true
    },
    line: {
        color: [0.5,0.5,0.8],
        linewidth: 1.0
    }
};

export var DEFAULT_UNITS = 'meters';

// Path to static assets of images used for image based lighting.
var imagesUrl = 'https://object-library.storage.googleapis.com/Park2/';
export var CUBE_URLS = [
    imagesUrl + 'posx3.jpg',
    imagesUrl + 'negx3.jpg',
    imagesUrl + 'posz2.jpg',
    imagesUrl + 'negz2.jpg',
    imagesUrl + 'posy2.jpg',
    imagesUrl + 'negy2.jpg'
];
