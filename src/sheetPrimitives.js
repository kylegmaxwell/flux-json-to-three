/**
 * set of helpers to make wire primitives
 */

'use strict';

/*
 * imports
 */

import VectorManager from './vectorManager.js';

import * as constants from './constants.js';

import FluxGeometryError from './geometryError.js';

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
    geometry.computeFaceNormals();

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
    var nsControlPoints = [],
        controlPoints = data.controlPoints,
        i = 0,
        len = controlPoints.length,
        j,
        len2,
        controlPointRow,
        point,
        arr;

    for ( ; i < len ; i++ ) {

        arr = [];
        nsControlPoints.push( arr );
        controlPointRow = controlPoints[ i ];

        for ( j = 0, len2 = controlPointRow.length ; j < len2 ; j++ ) {

            point = controlPointRow[ j ];

            arr.push(
                new THREE.Vector4(
                    point[ 0 ],
                    point[ 1 ],
                    point[ 2 ],
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

    //
    var nurbsSurface = new THREE.NURBSSurface( data.vDegree, data.uDegree, data.vKnots, data.uKnots, nsControlPoints );

    var geometry = new THREE.ParametricGeometry(function ( u, v ) {
        return nurbsSurface.getPoint( u, v );
    },
    data.vDegree * nsControlPoints.length * constants.NURBS_SURFACE_QUALITY,
    data.uDegree * nsControlPoints[0].length * constants.NURBS_SURFACE_QUALITY );

    geometry.computeFaceNormals();

    return new THREE.Mesh( geometry, material );
}
