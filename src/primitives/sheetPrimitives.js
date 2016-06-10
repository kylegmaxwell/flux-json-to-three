/**
 * set of helpers to make wire primitives
 */

'use strict';

/*
 * imports
 */
import THREE from 'three';
import VectorManager from '../vectorManager.js';
import * as constants from '../constants.js';
import FluxGeometryError from '../geometryError.js';
import NURBSSurface from '../nurbs/NURBSSurface.js';
import computeNormals from '../primitives/normals.js';

/*
 * helpers
 */

var vec = new VectorManager(); // an ObjectPool for managing Three.js vectors

/**
 * Convert a flux json polygon to an object with THREE Vector3 coordinates
 *
 * @function _polygonToThree
 *
 * @return {Object}         The new converted polygon
 *
 * @param  {Object} polygon The Flux JSON polygon to convert
 */
function _polygonToThree(polygon) {
    var polygonThree = {boundary: [], holes: []};
    _pointArrayToThree(polygonThree.boundary, polygon.boundary);
    if (!polygon.holes) return polygonThree;
    for (var i=0, len=polygon.holes.length; i<len; i++) {
        var holeThree = [];
        polygonThree.holes.push(holeThree);
        _pointArrayToThree(holeThree, polygon.holes[i]);
    }
    return polygonThree;
}

/**
 * Convert an array of triples of numbers into an array of THREE.Vector3
 * @param  {Array.<THREE.Vector3>} pointsThree Destination
 * @param  {Array.<[Number,Number,Number]>} pointsArray Source
 */
function _pointArrayToThree(pointsThree, pointsArray) {
    for (var i=0, len=pointsArray.length; i<len; i++) {
        pointsThree.push(vec.convert(pointsArray[i]));
    }
}

/**
 * Creates a THREE.Mesh as a set of polygons from parasolid data and a material
 *
 * @function polygonSet
 *
 * @return { THREE.Mesh } The THREE.Mesh
 *
 *  @throws FluxGeometryError if polygon is non planar
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the THREE.Mesh
 */
export function polygonSet ( data, material ) {

    // TODO check for degeneracy (such as collocated points)
    // TODO check for winding order (holes should match boundary)
    var p = vec.alloc();
    var n = vec.alloc();
    var u = vec.alloc();
    var v = vec.alloc();

    // Loop over all shapes and holes
    for (var i=0, len=data.polygons.length; i<len; i++) {

        var polygon = _polygonToThree(data.polygons[i]);

        _computePointBasis(p, n, u, v, polygon.boundary);

        var p0 = vec.clone(polygon.boundary[0]);

        // Polygon must be planar
        if (!_isPlanarPolygon(polygon, n, p0)) {
            throw new FluxGeometryError('Non planar polygon in polygonSet');
        }

        //TODO convert the remaining code to use polygon
        var polygon2d = { boundary: [], holes: []};
        _reduceCoordinates(polygon2d.boundary, polygon.boundary, u, v, p0);
        if (polygon.holes) {
            for (var j=0, jLen = polygon.holes.length; j<jLen; j++) {
                polygon2d.holes.push([]);
                _reduceCoordinates(polygon2d.holes[j], polygon.holes[j], u, v, p0);
            }
        }
        // Build the triangulated shape
        var geometry = _makeShapeGeometry(polygon2d);

        _restoreCoordinates(geometry, p, u, v);
    }

    return new THREE.Mesh( geometry, material );
}

/**
 * Check if an array of points is on a given plane
 * @param  {Array.<THREE.Vector3>}  pointsThree List of point objects
 * @param  {THREE.Vector3}  n       Normal vector
 * @param  {THREE.Vector3}  p0      Point on the plane
 * @return {Boolean}                True when the points are on the plane
 */
function _isPlanarArray (pointsThree, n, p0) {
    var pointRel = vec.alloc();
    for (var i=0, len=pointsThree.length; i<len; i++) {
        pointRel.copy(pointsThree[i]).sub(p0);
        if (Math.abs(pointRel.dot(n))>constants.TOLERANCE) {
            return false;
        }
    }
    return true;
}

/**
 * Check if a polygon is flat.
 * @param  {Object}  polyThree Polygon with points as objects
 * @param  {THREE.Vector3}  n       Normal vector
 * @param  {THREE.Vector3}  p0      Point on the plane
 * @return {Boolean}           True if the polygon and it's holes are planar
 */
function _isPlanarPolygon(polyThree, n, p0) {
    var planar = _isPlanarArray(polyThree.boundary, n, p0);
    if (!polyThree.holes) return planar;
    for (var i=0, len=polyThree.holes.length; i<len && planar; i++) {
        if (!_isPlanarArray(polyThree.holes[i], n, p0)) {
            planar = false;
        }
    }
    return planar;
}

/**
 * Convert planar three dimensional points to a two dimensional coordinate system.
 * @param  {[]} destPoints Array to hold output
 * @param  {[]} srcPoints  Source array of points
 * @param  {THREE.Vector3} u          Coordinate basis first direction
 * @param  {THREE.Vector3} v          Coordinate basis second direction
 * @param  {THREE.Vector3} p0         Point on the polygon
 */
function _reduceCoordinates(destPoints, srcPoints, u, v, p0) {
    var p = vec.alloc();
    var s, t;
    for (var i=0, len=srcPoints.length; i<len; i++) {
        p.copy(srcPoints[i]).sub(p0);

        s = p.dot(u);
        t = p.dot(v);
        destPoints.push(vec.alloc().set(s, t, 0));
    }
}

/**
 * Convert 2D coordinates back to world space 3D.
 * This modifies the vertex positions in place.
 * @param  {THREE.Geometry} geometry The geometry to transform
 * @param  {[type]} p        The origin point on the polygon
 * @param  {[type]} u        The first basis direction.
 * @param  {[type]} v        The second basis direction.
 */
function _restoreCoordinates(geometry, p, u, v) {
    var uTmp = vec.alloc();
    var vTmp = vec.alloc();
    for ( var i = 0, len = geometry.vertices.length ; i < len ; i++ ) {

        var vert = geometry.vertices[i];
        var s = vert.x;
        var t = vert.y;
        uTmp.copy(u);
        vTmp.copy(v);

        vert.copy(p);
        vert.add(uTmp.multiplyScalar(s));
        vert.add(vTmp.multiplyScalar(t));
    }
    geometry.verticesNeedUpdate = true;
}

/**
 * Compute a coordinate system for the given set of points
 * @param  {THREE.Vector3} p      Return vector for a point on the polygon
 * @param  {THREE.Vector3} n      Return vector for the polygon normal
 * @param  {THREE.Vector3} u      Return vector for the polygon basis first direction
 * @param  {THREE.Vector3} v      Return vector for the polygon basis second direction
 * @param  {Array.<Array.<Number>>} points The points defining the polygon
 */
function _computePointBasis(p, n, u, v, points) {
    n.set(0,0,1);
    if (points.length < 3) {
        return;
    }
    p.copy(points[0]);

    //TODO check memory allocation (would be large for many polygons)
    var v0 = vec.alloc().copy(points[0]);
    u.copy(points[1]);
    v.copy(points[points.length-1]);

    u.sub(v0).normalize();
    v.sub(v0).normalize();

    n.crossVectors(u, v).normalize();
    v.crossVectors(n, u).normalize();
}

/**
 * Make THREE.geometry from a flux JSON polygon object.
 * The polygon is like a flux JSON object, but actually
 * the points have all been converted from arrays to Vector3 objects.
 * @param  {Object} polygon Flux JSON polygon
 * @return {THREE.Geometry}         The renderable geometry.
 */
function _makeShapeGeometry(polygon) {

    var shape = _makeShape( polygon.boundary );

    _makeShapeHoles(shape, polygon.holes);

    var geometry = new THREE.ShapeGeometry( shape );

    geometry.computeBoundingSphere();
    computeNormals(geometry);

    return geometry;
}

/**
 * Process each hole as a shape to convert it.
 * @param  {Object} shape The shape to contain the converted holes
 * @param  {Object} holes The list of holes
 */
function _makeShapeHoles(shape, holes) {
    for (var i=0, len=holes.length; i<len; i++) {
        var hole = _makeShape( holes[i] );
        shape.holes.push(hole);
    }
}

/**
 * Create a shape object from a list of points
 * @param  {Array.<THREE.Vector3>} boundary The points to process
 * @return {THREE.Shape}          Shape object representing the polygon
 */
function _makeShape(boundary) {

    var shape = new THREE.Shape();
    for ( var i = 0, len = boundary.length ; i < len ; i++ ) {
        shape.moveTo( boundary[i].x, boundary[i].y );
    }
    return shape;
}

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
    if (curvature < constants.NURBS_FLAT_LIMIT) {
        slices = 1;
        stacks = 1;
    }

    if (slices !== minSlices || stacks !== minStacks) {
        // Build the final geometry using the dynamic resolution
        geometry.dispose();
        geometry = new THREE.ParametricGeometry(getPointFunction, slices, stacks);
        computeNormals(geometry);
    }

    return new THREE.Mesh( geometry, material );
}
