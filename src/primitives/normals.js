/**
 * Utility function for normals
 */

'use strict';

/*
 * imports
 */
import THREE from 'three';
import * as constants from '../constants.js';

export default function computeNormals ( geometry ) {
    geometry.mergeVertices();
    geometry.computeFaceNormals();
    computeCuspNormals(geometry, constants.NORMALS_SMOOTH_LIMIT);
}

/**
 * Compute optimal normals from face and vertex normals
 *
 * @function computeCuspNormals
 *
 * @param  {Three.Geometry} geom  The geometry in need of normals
 * @param  {Number} thresh        Threshold for switching to vertex normals
 */
function computeCuspNormals ( geom, thresh ) {
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