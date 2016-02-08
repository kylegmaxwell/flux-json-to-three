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
 * Creates a linear mesh from parasolid data and a material
 *
 * @function line
 *
 * @return { THREE.Mesh } The linear mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the mesh
 */
export function line ( data, material ) {
    var geometry = new THREE.BufferGeometry(),
        vertices = new Float32Array( data.start.concat( data.end ) );

    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    return new THREE.Line( geometry, material );
}

/**
 * Creates a mesh as a set of lines from parasolid data and a material
 *
 * @function polyline
 *
 * @return { THREE.Mesh } The mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the mesh

 */
export function polyline ( data, material ) {

    var geometry = new THREE.Geometry(),
        point;

    for ( var i = 0, len = data.points.length ; i < len ; i++ ) {
        point = data.points[ i ];
        geometry.vertices.push(
            new THREE.Vector3( point[ 0 ], point[ 1 ], point[ 2 ] )
        );
    }

    return new THREE.Line( geometry, material );
}

/**
 * Creates a circular line from parasolid data and a material
 *
 * @function circle
 *
 * @return { THREE.Line } The circular line
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the mesh
 */
export function circle ( data, material ) {
    var r = data.radius;
    var numPoints = constants.CIRCLE_RES;
    var vertices = new Float32Array( ( numPoints  ) * 3 );
    var i, x, y, t, dt;
    t = 0;
    dt = 2 * Math.PI / (numPoints-1);
    for (i = 0; i < vertices.length; i += 3, t += dt) {
        x = r * Math.cos(t);
        y = r * Math.sin(t);
        vertices[i  ] = x;
        vertices[i+1] = y;
        vertices[i+2] = 0;
    }

    // Create geometry and material
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    return new THREE.Line(geometry, material);
}

/**
 * Creates a curve mesh from parasolid data and a material
 *
 * @function curve
 *
 * @return { THREE.Mesh } The curve mesh
 * @throws FluxGeometryError if nurbs are invalid
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the mesh
 */
export function curve ( data, material ) {
    if ( !data.knots || !data.controlPoints )
        throw new FluxGeometryError( 'Curve is missing knots or control points.');

    var nurbsControlPoints = _createControlPoints( data ),
        geometry = new THREE.Geometry();

    if ( data.knots.length !== nurbsControlPoints.length + data.degree + 1 )
        throw new FluxGeometryError( 'Number of uKnots in a NURBS curve should equal degree + N + 1, where N is the number ' +
                         'of control points' );

    geometry.vertices = data.degree > 1 ?
        new THREE.NURBSCurve( data.degree, data.knots, nurbsControlPoints )
            .getPoints( nurbsControlPoints.length * data.degree * constants.NURBS_CURVE_QUALITY ) : nurbsControlPoints;

    return new THREE.Line( geometry, material );
}

/**
 * Helper to create a set of control points from parasolid data
 *
 * @function _createControlPoints
 * @private
 *
 * @return { Array<Three.Vector4> } The array of vector 4s
 *
 * @param { Object }           data     Parasolid data
 */
function _createControlPoints ( data ) {
    var controlPoints = data.controlPoints,
        result = [],
        i = 0,
        weights = data.weights,
        len = controlPoints.length,
        currentControlPoint;

    for ( ; i < len ; i++ ) {
        currentControlPoint = controlPoints[ i ];
        result.push(
            new THREE.Vector4(
                currentControlPoint[ 0 ],
                currentControlPoint[ 1 ],
                currentControlPoint[ 2 ],
                weights ? weights[ i ] : 1
            )
        );
    }

    return result;
}

/**
 * Creates a arc mesh from parasolid data and a material
 *
 * @function arc
 *
 * @return { THREE.Mesh } The arc mesh
 *
 * @throws FluxGeometryError if the data doesn't have a start, middle, or end property
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the mesh

 */
export function arc ( data, material ) {
    var geometry,
        vertices;

    if (!data.start || !data.middle || !data.end) {
        throw new FluxGeometryError('Can not create arc due to incomplete definition.');
    }

    // Initialize vectors
    var a = vec.alloc().set(data.start[0], data.start[1], data.start[2]);
    var b = vec.alloc().set(data.middle[0], data.middle[1], data.middle[2]);
    var c = vec.alloc().set(data.end[0], data.end[1], data.end[2]);

    // Compute line segments
    var ab = vec.clone(b).sub(a);
    var bc = vec.clone(c).sub(b);

    // check for degenerate inputs
    if (ab.length() < constants.TOLERANCE || bc.length() < constants.TOLERANCE ||
            1.0 - Math.abs(vec.clone(ab).normalize().dot(vec.clone(bc).normalize())) < constants.TOLERANCE) {
        // when the arc is degenerate, just draw line segments
        vertices = new Float32Array( 9 );
        _setVecInArray(vertices, 0, a);
        _setVecInArray(vertices, 3, b);
        _setVecInArray(vertices, 6, c);
    }
    else { // arc is ok
        var abMid =  vec.alloc();
        _computeMidpoint(a, b, abMid);
        var bcMid =  vec.alloc();
        _computeMidpoint(b, c, bcMid);

        // compute perpendicular bisectors
        var up = vec.alloc().crossVectors(ab,bc).normalize();
        var abPerp = vec.alloc().crossVectors(ab,up).normalize();
        var bcPerp = vec.alloc().crossVectors(up,bc).normalize();

        // calculate intersection
        var center =  vec.alloc();
        _intersectLines(abMid, bcMid, abPerp, bcPerp, center);

        // determine line segment points
        vertices = _tessellateArc(a, c, ab, bc, center, up);
    }

    if (vertices.length <= 0) {
        throw new FluxGeometryError( 'Arc has no vertices');
    }

    // Create geometry and material
    geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    vec.clear();

    return new THREE.Line(geometry, material);
}

/**
 * Computes the midpoint as the center of segment ab
 *
 * @function _computeMidpoint
 * @private
 *
 * @param { THREE.Vector3 } a        The first point
 * @param { THREE.Vector3 } b        The second point
 * @param { THREE.Vector3 } midPoint The midpoint
 */
function _computeMidpoint ( a, b, midPoint ) {
    midPoint.copy( b );
    midPoint.sub( a );
    midPoint.multiplyScalar( 0.5 );
    midPoint.add( a );
}

/**
 * Caclulate an appropriate number of points along a given arc
 *
 * @function _tessellateArc
 * @private
 *
 * @return { Float32Array } List of coordinates
 *
 * @param { THREE.Vector3 } a First point along the arc
 * @param { THREE.Vector3 } c Third point on arc
 * @param { THREE.Vector3 } ab Segement from a to b
 * @param { THREE.Vector3 } bc Segement from b to c
 * @param { THREE.Vector3 } center Center of arc
 * @param { THREE.Vector3 } up Normal to plane containing the arc
 */
function _tessellateArc ( a, c, ab, bc, center, up ) {
    // interpolate points on the curve and populate geometry
    var relA = vec.clone( a ).sub( center ),
        relC = vec.clone( c ).sub( center ),
        angle = relA.angleTo( relC ),
        angleABC = Math.PI - ab.angleTo( bc );

    if ( angleABC < Math.PI * 0.5 ) {
        angle = 2 * Math.PI - angle;
    }

    var numSections = Math.ceil( angle * ( 42 / ( 2 * Math.PI ) ) ),
        dTheta = angle / numSections,
        vertices = new Float32Array( ( numSections + 1  ) * 3 );

    for ( var i = 0 ; i <= numSections ; i++ ) {
        vertices[ i * 3 ] = relA.x + center.x;
        vertices[ i * 3 + 1 ] = relA.y + center.y;
        vertices[ i * 3 + 2 ] = relA.z + center.z;
        relA.applyAxisAngle( up, dTheta );
    }

    return vertices;
}

/**
 * Compute the intersection of two lines in 3D.
 * @Precondition The lines are not parallel, there is exactly 1 intersection.
 *
 * @function _intersectLines
 * @private
 *
 * @param  {THREE.Vector3} p0 Point on the first line
 * @param  {THREE.Vector3} p1 Point on the second line
 * @param  {THREE.Vector3} d0 Direciton of first line
 * @param  {THREE.Vector3} d1 Direction of second line
 * @param {THREE.Vector3} intersect Return parameter for intersection point
 */
function _intersectLines (p0, p1, d0, d1, intersect) {
    // Mathematically this is solved by equating the parametric equations
    // of the two lines and solving for t at the time of their intersection
    // Equivalent equations can be made by substituting each component x, y and z
    // so we try each permutation in case one of them runs into divide by zero.
    // Each pair of elements in this array is one case to calculate.
    var cases = ['x', 'y', 'x', 'z', 'y', 'x',
        'y', 'z', 'z', 'x', 'z', 'y' ];
    var t0;
    var i = 0;
    var x;
    var y;
    while(!isFinite(t0) && i < cases.length) {
        x = cases[i];
        y = cases[i+1];
        // compute t from the formula
        t0 = (p0[x] - p1[x] - (p0[y] * d1[x]) / d1[y] + (p1[y] * d1[x]) / d1[y] ) /
            ( (d0[y] * d1[x]) / d1[y] - d0[x]);
            i += 2;
    }
    // calculate the intersection as a linear combination of the point and direction
    intersect.copy(d0).multiplyScalar(t0).add(p0);
}

/**
 * Add each element of a vector to an array
 * @param  {Array} arr Array of coordinates
 * @param  {Number} offset Index to start in array
 * @param  {THREE.Vector3} vec Vector of 3 values
 */
function _setVecInArray (arr, offset, vec) {
    arr[offset] = vec.x;
    arr[offset+1] = vec.y;
    arr[offset+2] = vec.z;
}

/**
 * Creates a rectangular line from parasolid data and a material
 *
 * @function rectangle
 *
 * @return { THREE.Line } The rectangular line
 *
 * @param { Object }           data     Parasolid data
 * @param { THREE.Material } material The material to give the mesh
 */
export function rectangle ( data, material ) {
    var dx = data.dimensions[0] * 0.5;
    var dy = data.dimensions[1] * 0.5;

    var numPoints = 5;
    var vertices = new Float32Array( ( numPoints  ) * 3 );
    vertices[0] = -dx;
    vertices[1] = dy;
    vertices[2] = 0;

    vertices[3] = dx;
    vertices[4] = dy;
    vertices[5] = 0;

    vertices[6] = dx;
    vertices[7] = -dy;
    vertices[8] = 0;

    vertices[9] = -dx;
    vertices[10] = -dy;
    vertices[11] = 0;

    vertices[12] = -dx;
    vertices[13] = dy;
    vertices[14] = 0;

    // Create geometry and material
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    return new THREE.Line(geometry, material);
}