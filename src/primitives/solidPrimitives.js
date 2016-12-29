/**
 * set of helpers to make wire primitives
 */

'use strict';

/*
 * imports
 */
import * as THREE from 'three';
import * as constants from '../constants.js';
import FluxGeometryError from '../geometryError.js';
import OBJLoader from '../loaders/OBJLoader.js';
import STLLoader from '../loaders/STLLoader.js';
import computeNormals from '../utils/normals.js';
import { scene as sceneUtils } from 'flux-modelingjs';

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

    geometry = new THREE.SphereBufferGeometry( data.radius, 24, 24 );
    geometry = computeNormals(geometry);
    mesh = new THREE.Mesh( geometry, material );
    rotateGeometry( mesh, constants.DEFAULT_ROTATION );
    return mesh;
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
 * Add an attribute from the input as a buffer attribute for rendering
 * @param  {THREE.BufferGeometry} geometry  The renderable geometry.
 * @param  {Object} data                    Flux JSON mesh
 * @param  {String} attr                    Name of the attribute to add (must be the same in Flux and three.js)
 * @param  {Number} expectedLength          Expected length of the attribute list (determines
 *                                          whether this is a per vertex or per face vertex attribute)
 * @param  {Number} stride                  How many numbers make up a single element
 */
function _addMeshAttribute(geometry, data, attr, expectedLength, stride) {
    // Flatten uvs if they are available per vertex
    if (data[attr] && data[attr].length === expectedLength) {
        // for each vertex
        var as = sceneUtils.flattenArray(data[attr]);
        geometry.addAttribute( attr, new THREE.BufferAttribute( new Float32Array(as), stride ) );
    }
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
    // Flatten the list of vertices
    var positions = sceneUtils.flattenArray(data.vertices);

    // Flatten faces (and assume already triangulated)
    var triangles = sceneUtils.flattenArray(data.faces);

    var geometry = new THREE.BufferGeometry();

    _addMeshAttribute(geometry, data, 'color', data.vertices.length, 3);
    geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(positions), 3 ) );
    geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( triangles ), 1 ) );

    geometry.computeBoundingSphere();
    geometry = computeNormals(geometry);
    // After compute normals the mesh has been converted to non indexed buffer geometry
    // Then the mesh has attributes at the per face vertex rate instead of per point
    _addMeshAttribute(geometry, data, 'uv', data.faces.length, 2);
    //TODO(Kyle) This is inefficient, should not compute normal if it's going to be replaced
    _addMeshAttribute(geometry, data, 'normal', data.faces.length, 3);
    return new THREE.Mesh(geometry, material);
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
