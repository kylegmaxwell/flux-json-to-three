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
import NURBSSurface from '../nurbs/NURBSSurface.js';
import computeNormals from '../utils/normals.js';

/**
 * Calculate the maximum curvature across a surface geometry
 * The curvature is computed for each face compared to it's neighbors
 * and then the maximum angle is the result.
 * @param {THREE.Geometry} geom The surface
 * @returns {number} The normalized curvature between 0 and 1
 * @private
 */
function _calcMaxCurvature(geom) {

    var v, vl, f, fl, face, vertexToFaces;
    // List of all the co-incident faces, indexed by [v][f]
    // Stores a pair of a face index and a vertex index on a face
    vertexToFaces = [];

    for ( v = 0, vl = geom.vertices.length; v < vl; v ++ ) {
        vertexToFaces[v] = [];
    }

    // Add the face normals as vertex normals
    for ( f = 0, fl = geom.faces.length; f < fl; f ++ ) {
        face = geom.faces[ f ];
        vertexToFaces[face.a].push([f,0]);
        vertexToFaces[face.b].push([f,1]);
        vertexToFaces[face.c].push([f,2]);
    }
    var invPi = 1.0 / Math.PI;
    var maxCurvature = 0;
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
                var curvature = invPi * face.normal.angleTo(geom.faces[faceIndex].normal);
                if (curvature > maxCurvature) {
                    maxCurvature = curvature;
                }
            }
        }
    }

    return maxCurvature;
}


/**
 * Check whether control points are co-linear when increasing index in one direction.
 * This is used to determine whether it is safe to optimize away a higher order
 * surface and just replace it with a quad.
 *
 * @param  {Array.<Array.<Number>>} cps Control points
 * @return {Boolean}     True for parallelogram surfaces.
 */
function _linearControlPoints(cps) {
    var a = new THREE.Vector3();
    var b = new THREE.Vector3();
    var c = new THREE.Vector3();
    var d = new THREE.Vector3();

    // Note, nurbs control points must be a rectangular array
    for (var i=0;i<cps.length-2;i++) {
        var row = cps[i];
        for (var j=0; j<row.length; j++) {
            a.copy(cps[i][j]);
            b.copy(cps[i+1][j]);
            c.copy(cps[i+1][j]);
            d.copy(cps[i+2][j]);
            var dp = (b.sub(a).normalize()).dot(d.sub(c).normalize());
            // If dot product is not fuzzy equal 1
            if (Math.abs(dp-1) > constants.TOLERANCE) {
                return false;
            }
        }
    }

    // Repeat in the perpendicular direction
    for (i=0;i<cps.length;i++) {
        row = cps[i];
        for (j=0; j<row.length-2; j++) {
            a.copy(cps[i][j]);
            b.copy(cps[i][j+1]);
            c.copy(cps[i][j+1]);
            d.copy(cps[i][j+2]);
            dp = (b.sub(a).normalize()).dot(d.sub(c).normalize());
            // If dot product is not fuzzy equal 1
            if (Math.abs(dp-1) > constants.TOLERANCE) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Creates a surface THREE.Mesh from parasolid data and a material
 *
 * @function surface
 *
 * @return { THREE.Mesh } The THREE.Mesh
 *
 * @throws FluxGeometryError if nurbs definition is invalid
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh

 */
export function surface ( data, material ) {
    if (!data || !data.controlPoints) {
        throw new FluxGeometryError('Data must exist and have controlPoints');
    }
    var j, len2, controlPointRow, point, arr;
    var nsControlPoints = [];
    var controlPoints = data.controlPoints;
    var i = 0;
    var len = controlPoints.length;

    // For each control point
    for ( ; i < len ; i++ ) {
        arr = [];
        nsControlPoints.push( arr );
        controlPointRow = controlPoints[ i ];
        for ( j = 0, len2 = controlPointRow.length ; j < len2 ; j++ ) {
            point = controlPointRow[ j ];
            arr.push(
                new THREE.Vector4(
                    point[ 0 ], point[ 1 ], point[ 2 ],
                    data.weights ? data.weights[ j * len + i ] : 1
                )
            );
        }
    }

    if ( data.uKnots.length !== nsControlPoints[ 0 ].length + data.uDegree + 1 )
        throw new FluxGeometryError( 'Number of uKnots in a NURBS surface should equal uDegree + N + 1' +
                         ', where N is the number of control points along U direction' );

    if ( data.vKnots.length !== nsControlPoints.length + data.vDegree + 1 )
        throw new FluxGeometryError( 'Number of vKnots in a NURBS surface should equal vDegree + N + 1' +
                         ', where N is the number of control points along V direction' );

    var nurbsSurface = new NURBSSurface( data.vDegree, data.uDegree, data.vKnots, data.uKnots, nsControlPoints );
    var getPointFunction = nurbsSurface.getPoint.bind(nurbsSurface);

    // Tessellate the NURBS at the minimum level to get the polygon control hull
    var minSlices = nsControlPoints.length-1;
    var minStacks = nsControlPoints[0].length-1;
    var geometry = new THREE.ParametricGeometry(getPointFunction, minSlices, minStacks);
    computeNormals(geometry);

    // Determine the appropriate resolution for the surface based on the curvature of the control hull
    var curvature = _calcMaxCurvature(geometry);
    var factor = curvature * constants.NURBS_SURFACE_QUALITY;

    // Interpolate between flat and maximum detail, never less than the nurbs control hull
    var slices = Math.max(Math.floor(data.vDegree * nsControlPoints.length * factor), minSlices);
    var stacks = Math.max(Math.floor(data.uDegree * nsControlPoints[0].length * factor), minStacks);

    // Exception for totally flat surfaces, then render as a single quad
    if (curvature < constants.NURBS_FLAT_LIMIT && _linearControlPoints(nsControlPoints)) {
        slices = 1;
        stacks = 1;
    }

    if (slices !== minSlices || stacks !== minStacks) {
        // Build the final geometry using the dynamic resolution
        geometry.dispose();
        geometry = new THREE.ParametricGeometry(getPointFunction, slices, stacks);
        computeNormals(geometry);
    }
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
    geometry.dispose();
    return new THREE.Mesh( bufferGeometry, material );
}
