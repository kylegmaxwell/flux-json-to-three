/**
 * set of helpers to make wire primitives
 */

'use strict';

/*
 * imports
 */
import THREE from 'three';
import * as constants from '../constants.js';
import FluxGeometryError from '../geometryError.js';
import OBJLoader from '../loaders/OBJLoader.js';
import STLLoader from '../loaders/STLLoader.js';
import computeNormals from '../utils/normals.js';

/**
 * Moves a geometry by a vector
 *
 * @function moveGeometry
 *
 * @param { THREEJS.OBJECT3D } object The object to move
 * @param { THREE.Vector3 } vector The vector to move the object by
 */
function moveGeometry ( object, vector ) {
    object.position.copy( vector );
    object.updateMatrix();
    object.geometry.applyMatrix( object.matrix );
    object.position.set( 0, 0, 0 );
}

/**
 * Rotates a geometry by a vector
 *
 * @function rotateGeometry
 *
 * @param { THREEJS.OBJECT3D } object The object to rotate
 * @param { THREE.Vector3 }  vector The vector to rotate by in Euler Angles
 */
function rotateGeometry ( object, vector ) {
    object.rotation.set( vector.x, vector.y, vector.z );
    object.updateMatrix();
    object.geometry.applyMatrix( object.matrix );
    object.rotation.set( 0, 0, 0 );
}

/**
 * Extract the semi angle property from a data object.
 * Used to determine cone shape. Data is expected to have a
 * semiAngle property set in degrees.
 *
 * @param  {Object} data The data describing a cone.
 *
 * @function getSemiAngle
 *
 * @throws FluxGeometryError if property is missing or out of bounds
 *
 * @return {Number}      The semi angle in radians.
 */
function getSemiAngle(data) {
    var semiAngle;
    if (data.semiAngle) {
        semiAngle = data.semiAngle;
    } else {
        if (data['semi-angle']) {
            semiAngle = data['semi-angle'];
        } else {
            throw new FluxGeometryError('Cone must specify semiAngle parameter.');
        }
    }
    if (data.semiAngle <= 0 || data.semiAngle >= 90) {
        throw new FluxGeometryError('Cone semiAngle must be between 0 and 90 degrees exclusive.');
    }
    return constants.DEG_2_RAD * semiAngle;
}
/**
 * Creates a cone THREE.Mesh from parasolid data and a material.
 *
 * @function cone
 *
 * @return { THREE.Mesh } The cone THREE.Mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function cone ( data, material ) {
    var geometry, mesh;
    var semiAngle = getSemiAngle(data);
    var topRadius = data.height * Math.tan(semiAngle);
    geometry = new THREE.CylinderBufferGeometry( topRadius+data.radius, data.radius, data.height, constants.CIRCLE_RES );
    mesh = new THREE.Mesh( geometry, material );
    moveGeometry( mesh, new THREE.Vector3( 0, data.height * 0.5, 0 ) );
    rotateGeometry( mesh, constants.DEFAULT_ROTATION );

    return mesh;
}

/**
 * Creates a cylindrical THREE.Mesh from parasolid data and a material
 *
 * @function cylinder
 *
 * @return { THREE.Mesh } The cylindrical THREE.Mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function cylinder ( data, material ) {
    var geometry, mesh;

    geometry = new THREE.CylinderBufferGeometry( data.radius, data.radius, data.height, constants.CIRCLE_RES );
    mesh = new THREE.Mesh( geometry, material );
    moveGeometry( mesh, new THREE.Vector3( 0, data.height * 0.5, 0 ) );
    rotateGeometry( mesh, constants.DEFAULT_ROTATION );

    return mesh;
}

/**
 * Creates a spherical THREE.Mesh from parasolid data and a material
 *
 * @function sphere
 *
 * @return { THREE.Mesh } The spherical THREE.Mesh
 *
 * @throws FluxGeometryError if sphere is missing radius
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function sphere ( data, material ) {
    var geometry, mesh;

    if (!data.radius) {
        throw new FluxGeometryError('Sphere is missing radius.');
    }

    geometry = new THREE.SphereBufferGeometry( data.radius, 12, 8 );
    geometry = computeNormals(geometry);
    mesh = new THREE.Mesh( geometry, material );
    rotateGeometry( mesh, constants.DEFAULT_ROTATION );
    return mesh;
}

/**
 * Creates a toroidal THREE.Mesh from parasolid data and a material
 *
 * @function torus
 *
 * @return { THREE.Mesh } The toroidal THREE.Mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function torus ( data, material ) {
    var majorRadius = data.majorRadius || data.major_radius;
    var minorRadius = data.minorRadius || data.minor_radius;
    var geometry = new THREE.TorusBufferGeometry( majorRadius, minorRadius, 24, 24 );
    return new THREE.Mesh( geometry, material );
}

/**
 * Creates a box THREE.Mesh from parasolid data and a material
 *
 * @function block
 *
 * @return { THREE.Mesh } The box THREE.Mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function block ( data, material ) {
    var geometry = new THREE.BoxBufferGeometry( data.dimensions[ 0 ], data.dimensions[ 1 ], data.dimensions[ 2 ] );
    return new THREE.Mesh( geometry, material );
}


/**
 * Creates a THREE.Mesh from parasolid data and a material
 *
 * @precondition The faces in the mesh must be triangles or convex planar polygons.
 * Also this assumes the faces are wound counter clockwise.
 *
 * @function THREE.Mesh
 *
 * @return {THREE.Mesh} The THREE.Mesh
 *
 * @param {Object}          data     Parasolid data
 * @param {THREE.Material}  material The material to give the THREE.Mesh

 */
export function mesh (data, material) {
    var positions = [];
    for ( var i = 0, len = data.vertices.length ; i < len ; i++ ) {
        positions.push(data.vertices[i][0]);
        positions.push(data.vertices[i][1]);
        positions.push(data.vertices[i][2]);
    }

    var face;
    var triangles = [];
    for ( i = 0, len = data.faces.length ; i < len ; i++ ) {
        face = data.faces[ i ];
        if ( face.length === 3 ) {
            triangles.push(face[0]);
            triangles.push(face[1]);
            triangles.push(face[2]);
        } else if ( face.length > 3 ) {
            for ( var j=0; j+2<face.length; j++) {
                triangles.push(face[0]);
                triangles.push(face[j+1]);
                triangles.push(face[j+2]);
            }
        }

    }

    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(positions), 3 ) );
    geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( triangles ), 1 ) );

    geometry.computeBoundingSphere();
    geometry = computeNormals(geometry);
    return new THREE.Mesh( geometry, material );
  }

// Singleton loader object
var objLoader = new OBJLoader();
/**
 * Convert stl data into geometry
 * @param {object} data The stl primitive
 * @param {THREE.material} material The material to use
 * @returns {THREE.Mesh} The mesh containing the geometry
 */
export function obj (data) {
    return objLoader.parse(data.data);
}

// Singleton loader object
var stlLoader = new STLLoader();
/**
 * Convert stl data into geometry
 * @param {object} data The stl primitive
 * @param {THREE.material} material The material to use
 * @returns {THREE.Mesh} The mesh containing the geometry
 */
export function stl (data, material) {
    var geometry = stlLoader.parseASCII(data.data);

    geometry.computeBoundingSphere();
    computeNormals(geometry);
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
    geometry.dispose();
    return new THREE.Mesh( bufferGeometry, material );
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
