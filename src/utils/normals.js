/**
 * Utility function for normals
 */

'use strict';

/*
 * imports
 */
import * as THREE from 'three';
import * as constants from '../constants.js';
import * as bufferUtils from './bufferGeometryUtils.js';

/**
 * Compute good looking normal vectors for geometry.
 * Preserve sharp creases, but allow smoothing in low curvature areas.
 * @param  {THREE.Geometry|THREE.BufferGeometry} geometry The geometry in need of normals.
 * @return {THREE.Geometry|THREE.BufferGeometry}          The geometry, or a clone if the original was replaced
 */
export default function computeNormals ( geometry ) {
    var newGeom = geometry;
    // Buffer geometry needs to be treated differently
    // with a lot of custom functions that are missing from THREE.js
    if (geometry instanceof THREE.BufferGeometry) {

        // The first step is to expand the buffer to accommodate every triangle
        // with unique face vertices (no shared vertex between triangles).
        // This gives the most flexibility, since indexed buffer geometry affords
        // too much blending, and does not allow the necessary sharp creases.
        if (newGeom.index) {
            newGeom = newGeom.toNonIndexed();
        }

        // Just get the normals per triangle to be used in the cusp calculation
        // This function actually generates face normals for non indexed geometry
        newGeom.computeVertexNormals();

        // Re-index the geometry merging triangles that have shared vertices.
        // I know we just blew them away, but now we have the full list of triangles
        // so we can store normals per triangle, but also have the connectivity information
        // implicitly by the indexing scheme
        bufferUtils.mergeVertices(newGeom);

        // Calculate vertex normals from a weighted average of neighboring faces' normals
        _computeBufferCuspNormals(newGeom, constants.NORMALS_SMOOTH_LIMIT);

        // Now we want to render as un-indexed geometry, and we already have the
        // points split, so we can just drop the index attribute, and keep our
        // newly calculated connectivity aware normals
        newGeom = _unmergeVertices(newGeom);

    } else {
        geometry.mergeVertices();
        geometry.computeFaceNormals();
        _computeCuspNormals(geometry, constants.NORMALS_SMOOTH_LIMIT);
    }
    return newGeom;
}

function _unmergeVertices(geom) {
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', geom.attributes.position);
    if (geom.attributes.normal) {
        geometry.addAttribute( 'normal', geom.attributes.normal);
        var n = geometry.attributes.normal.array;
        for (var i=0;i<n.length;i++) {
            if (isNaN(n[i])) {
                n[i] = 0;
            }
        }
    } else {
        geometry.addAttribute( 'normal', geom.attributes.faceNormal);
    }
    geom.dispose();
    return geometry;
}


/**
 * Compute optimal normals from face and vertex normals
 *
 * @param  {Three.Geometry} geom  The geometry in need of normals
 * @param  {Number} thresh        Threshold for switching to vertex normals
 */
function _computeCuspNormals( geom, thresh ) {
    var v, vl, f, fl, face, vertexToFaces, faceNormals;
    // List of all the co-incident faces, indexed by [v][f]
    // Stores a pair of a face index and a vertex index on a face
    vertexToFaces = [];

    for ( v = 0, vl = geom.vertices.length; v < vl; v ++ ) {
        vertexToFaces[v] = [];
    }

    faceNormals = [];
    // Add the face normals as vertex normals
    for ( f = 0, fl = geom.faces.length; f < fl; f ++ ) {
        face = geom.faces[ f ];
        faceNormals.push([]);
        faceNormals[f][0] = new THREE.Vector3();
        faceNormals[f][1] = new THREE.Vector3();
        faceNormals[f][2] = new THREE.Vector3();
        vertexToFaces[face.a].push([f,0]);
        vertexToFaces[face.b].push([f,1]);
        vertexToFaces[face.c].push([f,2]);
    }

    // Convert triangle index scheme from a b c to 1 2 3
    var iToAbc = ['a', 'b', 'c'];
    // For each face
    for ( f = 0, fl = geom.faces.length; f < fl; f ++ ) {
        face = geom.faces[ f ];
        // For each vertex on the face
        for (var i=0; i<3; i++) {
            var faceAbc = face[iToAbc[i]];
            // For each face neighboring the vertex
            for ( v = 0, vl = vertexToFaces[faceAbc].length; v < vl; v ++ ) {
                // look up normal by face, and vertex and add if within threshold
                var faceIndex = vertexToFaces[faceAbc][v][0];
                var fN = geom.faces[faceIndex].normal;
                if (face.normal.dot(fN) > thresh) {
                    faceNormals[faceIndex][vertexToFaces[faceAbc][v][1]].add(face.normal);
                }
            }
        }
    }

    // Normalize the normals to unit length
    for ( f = 0, fl = faceNormals.length; f < fl; f ++ ) {
        for (v=0;v<faceNormals[f].length;v++) {
            faceNormals[f][v].normalize();
        }
    }

    // Apply the normals to the faces
    for ( f = 0, fl = geom.faces.length; f < fl; f ++ ) {
        face = geom.faces[ f ];
        // Apply vertex normals if the face is not flat
        if (faceNormals[f][0].distanceToSquared(faceNormals[f][1]) > constants.TOLERANCE ||
            faceNormals[f][1].distanceToSquared(faceNormals[f][2]) > constants.TOLERANCE) {
            var vertexNormals = face.vertexNormals;
            vertexNormals[0] = faceNormals[f][0].clone();
            vertexNormals[1] = faceNormals[f][1].clone();
            vertexNormals[2] = faceNormals[f][2].clone();
        }
    }
}

// Optimization: These variables are only allocated once and made unique by rollup namespacing
var gFaceN = new THREE.Vector3();
var gNeighborFaceN = new THREE.Vector3();
var gTmpN = new THREE.Vector3();
// Temporary normals buffer to use for accumulation
var gFaceNormals = new Float32Array(900);

/**
 * Calculate nice looking normal vectors for a buffer geometry
 * Precondition: Normal attribute contains flat face normals
 * Precondition: Buffer geometry has a vertex for each face vertex and has been indexed to map shared vertices
 * @param  {THREE.BufferGeometry} geom   The geometry to use
 * @param  {Number} thresh  Threshold for smooth or sharp normals
 */
function _computeBufferCuspNormals(geom, thresh) {

    var i, il, v, vl, f, fl, faceAbc, vertexToFaces, faceIndex;
    // Just allocate a constant number of

    var normals = geom.attributes.normal.array;
    var faces = geom.index.array;

    vertexToFaces = {};
    _linkFaces(vertexToFaces, faces);

    _resetNormalBuffer(normals);

    // Accumulate the normals
    // For each face
    for ( f = 0, fl = faces.length; f < fl; f+=3 ) {
        gFaceN.set(normals[f*3],
                  normals[f*3+1],
                  normals[f*3+2]);
        // For each vertex on the face
        for (i=0; i<3; i++) {
            faceAbc = faces[f+i];
            // For each face neighboring the vertex
            for ( v = 0, vl = vertexToFaces[faceAbc].length; v < vl; v ++ ) {
                // look up normal by face, and vertex and add if within threshold
                faceIndex = vertexToFaces[faceAbc][v][0];
                // Get the smooth and flat normal from the current face
                gNeighborFaceN.set(normals[faceIndex*3],
                                  normals[faceIndex*3+1],
                                  normals[faceIndex*3+2]);
                var delta = gFaceN.dot(gNeighborFaceN);
                if (delta > thresh) {
                    // append the normal to the cumulation for the neighboring face
                    var faceI = 3*(faceIndex+vertexToFaces[faceAbc][v][1]);
                    gTmpN.set(gFaceNormals[faceI+0],gFaceNormals[faceI+1],gFaceNormals[faceI+2]).add(gFaceN);
                    gFaceNormals[faceI  ] = gTmpN.x;
                    gFaceNormals[faceI+1] = gTmpN.y;
                    gFaceNormals[faceI+2] = gTmpN.z;
                }
            }
        }
    }

    _normalizeNormals(gFaceNormals, normals.length, gTmpN);

    // Apply the normals
    for ( i=0, il=normals.length; i < il; i++) {
        normals[i] = gFaceNormals[i];
    }
}

/**
 * Resize or clear the reused normal buffer
 * @param  {Float32Array} normals      The reference buffer for length
 */
function _resetNormalBuffer(normals) {
    // Allocate a bigger array if necessary
    if (gFaceNormals.length < normals.length) {
        gFaceNormals = new Float32Array(normals.length);
    } else { // clear the array
        for (var i=0, il=normals.length; i < il; i++) {
            gFaceNormals[i] = 0;
        }
    }
}

/**
 * Create an array of face adjacencies
 * @param  {Object} vertexToFaces List of all the co-incident faces, indexed by [v][f]
 *                                Stores a pair of a face index and a vertex index on a face
 * @param  {UInt32Array} faces    List of face offsets
 */
function _linkFaces(vertexToFaces, faces) {
    var i, f, fl, face, faceAbc;

    // Add the face normals as vertex normals
    for ( f = 0, fl = faces.length; f < fl; f+=3 ) {
        face = [faces[f],faces[f+1],faces[f+2]];
        // For each vertex on the face
        for (i=0; i<3; i++) {
            faceAbc = face[i];
            if (!vertexToFaces[faceAbc]) {
                vertexToFaces[faceAbc]=[];
            }
            vertexToFaces[faceAbc].push([f,i]);
        }
    }
}

/**
 * Normalize the given list of vectors
 * @param  {Float32Array}   faceNormals The normal vector data
 * @param  {Number}         length      The length of the data array (it is reused so this might be different than the actual length in memory)
 * @param  {THREE.Vector3}  tmpN        Pre allocated vector limits need for garbage collection
 */
function _normalizeNormals(faceNormals, length, tmpN) {
    var f, fl;
    // Normalize the normals to unit length
    for ( f = 0, fl = length; f < fl; f +=3 ) {
        tmpN.set(faceNormals[f+0],faceNormals[f+1],faceNormals[f+2]).normalize();
        faceNormals[f  ] = tmpN.x;
        faceNormals[f+1] = tmpN.y;
        faceNormals[f+2] = tmpN.z;
    }
}
