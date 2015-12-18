/**
 * set of helpers to make wire primitives
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

import * as constants from './constants.js'

/**
 * Moves a geometry by a vector
 *
 * @function moveGeometry
 *
 * @param { THREEJS.OBJECT3D } object The object to move
 * @param { THREEJS.VECTOR3 } vector The vector to move the object by
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
 * @param { THREEJS.VECTOR3 }  vector The vector to rotate by in Euler Angles
 */
function rotateGeometry ( object, vector ) {
    object.rotation.set( vector.x, vector.y, vector.z );
    object.updateMatrix();
    object.geometry.applyMatrix( object.matrix );
    object.rotation.set( 0, 0, 0 );
}

/**
 * Creates a cone mesh from parasolid data and a material.
 *
 * @function cone
 *
 * @return { ThreeJS.Mesh } The cone mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREEJS.Material } material The material to give the mesh
 */
export function cone ( data, material ) {
    var geometry, mesh;

    geometry = new CylinderGeometry( 0, data.radius, data.height, 32 );
    mesh = new Mesh( geometry, material );
    moveGeometry( mesh, new Vector3( 0, data.height * 0.5, 0 ) );
    rotateGeometry( mesh, constants.DEFAULT_ROTATION );

    return mesh;
}

/**
 * Creates a cylindrical mesh from parasolid data and a material
 *
 * @function cylinder
 *
 * @return { ThreeJS.Mesh } The cylindrical mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function cylinder ( data, material ) {
    var geometry, mesh;

    geometry = new CylinderGeometry( data.radius, data.radius, data.height, 32 );
    mesh = new Mesh( geometry, material );
    moveGeometry( mesh, new Vector3( 0, data.height * 0.5, 0 ) );
    rotateGeometry( mesh, constants.DEFAULT_ROTATION );

    return mesh;
}

/**
 * Creates a spherical mesh from parasolid data and a material
 *
 * @function sphere
 *
 * @return { ThreeJS.Mesh } The spherical mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function sphere ( data, material ) {
    var geometry, mesh;

    geometry = new SphereBufferGeometry( data.radius, 12, 8 );
    mesh = new Mesh( geometry, material );
    rotateGeometry( mesh, constants.DEFAULT_ROTATION );

    return mesh;
}

/**
 * Creates a toroidal mesh from parasolid data and a material
 *
 * @function torus
 *
 * @return { ThreeJS.Mesh } The toroidal mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function torus ( data, material ) {
    var geometry = new TorusGeometry( data.major_radius, data.minor_radius, 24, 24 );
    return new Mesh( geometry, material );
}

/**
 * Creates a box mesh from parasolid data and a material
 *
 * @function block
 *
 * @return { ThreeJS.Mesh } The box mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function block ( data, material ) {
    var geometry = new BoxGeometry( data.dimensions[ 0 ], data.dimensions[ 1 ], data.dimensions[ 2 ] );
    return new Mesh( geometry, material );
}

/**
 * Creates a mesh from parasolid data and a material
 *
 * @function mesh
 *
 * @return { ThreeJS.Mesh } The mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function mesh ( data, material ) {
    var geometry = new Geometry(),
        face;

    for ( var i = 0, len = data.vertices.length ; i < len ; i++ )
        geometry.vertices.push(
            new Vector3( data.vertices[ i ][ 0 ], data.vertices[ i ][ 1 ], data.vertices[ i ][ 2 ] )
        );

    for ( i = 0, len = data.faces.length ; i < len ; i++ ) {

        face = data.faces[ i ];

        if ( face.length === 3 )
            geometry.faces.push(
                new Face3( face[ 0 ], face[ 1 ], face[ 2 ] )
            );

        else if ( face.length === 4 ) {
            geometry.faces.push(
                new Face3( face[ 0 ], face[ 1 ], face[ 2 ] )
            );
            geometry.faces.push(
                new Face3( face[ 0 ], face[ 2 ], face[ 3 ] )
            );
        }

    }

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();

    return new Mesh( geometry, material );
}

/**
 * Creates a mesh from parasolid brep with mesh information
 *
 * @function brep
 *
 * @return { ThreeJS.Mesh } The mesh

 * @throws Error if brep is missing faces or vertices properties
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function brep ( data, material ) {
    // If we define both faces and points, then treat the primitive as
    // a mesh for rendering purposes;
    if (data.faces != null && data.vertices != null) {
        data.primitive = 'mesh';
        return mesh(data, material);
    }
    throw new Error('Brep not supported.');
}
