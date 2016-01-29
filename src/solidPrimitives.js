/**
 * set of helpers to make wire primitives
 */

'use strict';

/*
 * imports
 */

import * as constants from './constants.js';

import FluxGeometryError from './geometryError.js';

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
    geometry = new THREE.CylinderGeometry( topRadius+data.radius, data.radius, data.height, constants.CIRCLE_RES );
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

    geometry = new THREE.CylinderGeometry( data.radius, data.radius, data.height, constants.CIRCLE_RES );
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
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function sphere ( data, material ) {
    var geometry, mesh;

    geometry = new THREE.SphereBufferGeometry( data.radius, 12, 8 );
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
    var geometry = new THREE.TorusGeometry( data.major_radius, data.minor_radius, 24, 24 );
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
    var geometry = new THREE.BoxGeometry( data.dimensions[ 0 ], data.dimensions[ 1 ], data.dimensions[ 2 ] );
    return new THREE.Mesh( geometry, material );
}

/**
 * Creates a THREE.Mesh from parasolid data and a material
 *
 * @function THREE.Mesh
 *
 * @return { THREE.Mesh } The THREE.Mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh

 */
export function mesh ( data, material ) {
    var geometry = new THREE.Geometry(),
        face;

    for ( var i = 0, len = data.vertices.length ; i < len ; i++ )
        geometry.vertices.push(
            new THREE.Vector3( data.vertices[ i ][ 0 ], data.vertices[ i ][ 1 ], data.vertices[ i ][ 2 ] )
        );

    for ( i = 0, len = data.faces.length ; i < len ; i++ ) {

        face = data.faces[ i ];

        if ( face.length === 3 )
            geometry.faces.push(
                new THREE.Face3( face[ 0 ], face[ 1 ], face[ 2 ] )
            );

        else if ( face.length === 4 ) {
            geometry.faces.push(
                new THREE.Face3( face[ 0 ], face[ 1 ], face[ 2 ] )
            );
            geometry.faces.push(
                new THREE.Face3( face[ 0 ], face[ 2 ], face[ 3 ] )
            );
        }

    }

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();

    return new THREE.Mesh( geometry, material );
}

/**
 * Creates a THREE.Mesh from parasolid brep with THREE.Mesh information
 *
 * @function brep
 *
 * @return { THREE.Mesh } The THREE.Mesh

 * @throws FluxGeometryError if brep is missing faces or vertices properties
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh

 */
export function brep ( data, material ) {
    // If we define both faces and points, then treat the primitive as
    // a THREE.Mesh for rendering purposes;
    if (data.faces != null && data.vertices != null) {
        return mesh(data, material);
    }
    throw new FluxGeometryError('Brep not supported.');
}
