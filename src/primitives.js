/**
 * set of helpers to make primitives
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
    Object3d,
    Geometry,
    NURBSCurve,
    NURBSSurface,
    ParametricGeometry,
    TextHelper
} from 'three';
import VectorManager from './vectorManager.js';


/*
 * constants
 */
var HALF_PI = Math.PI * 0.5,
    TOLERANCE = 0.000001,
    DEFAULT_ROTATION = new Vector3( HALF_PI, HALF_PI, 0 ),
    PLANE_DEFAULTS = {
        WIDTH: 10000,
        HEIGHT: 10000,
        WIDTH_SEGMENTS: 100,
        HEIGHT_SEGMENTS: 100
    };


/*
 * helpers
 */

var vec = new VectorManager(); // an ObjectPool for managing Three.js vectors



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
    rotateGeometry( mesh, DEFAULT_ROTATION );

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
    rotateGeometry( mesh, DEFAULT_ROTATION );

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
    rotateGeometry( mesh, DEFAULT_ROTATION );

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
 * Creates a circular mesh from parasolid data and a material
 *
 * @function circle
 *
 * @return { ThreeJS.Mesh } The circular mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function circle ( data, material ) {
    var geometry = new CircleGeometry( data.radius, 32 );
    return new Mesh( geometry, material );
}



/**
 * Creates a rectangular mesh from parasolid data and a material
 *
 * @function rectangle
 *
 * @return { ThreeJS.Mesh } The rectangular mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function rectangle ( data, material ) {
    var geometry = new PlaneBufferGeometry( data.dimensions[ 0 ], data.dimensions[ 1 ] );
    return new Mesh( geometry, material );
}



/**
 * Creates a planar mesh from parasolid data and a material
 *
 * @function plane
 *
 * @return { ThreeJS.Mesh } The planar mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function plane ( data, material ) {
    var geometry = new PlaneBufferGeometry( PLANE_DEFAULTS.WIDTH, PLANE_DEFAULTS.HEIGHT,
                                            PLANE_DEFAULTS.WIDTH_SEGMENTS, PLANE_DEFAULTS.HEIGHT_SEGMENTS );
    return new Mesh( geometry, material );
}



/**
 * Creates a point mesh from parasolid data and a material
 *
 * @function point
 *
 * @return { ThreeJS.Mesh } The point mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function point ( data, material ) {
    var positions = new Float32Array( data.point ),
        geometry = new BufferGeometry();

    geometry.addAttribute( 'position', new BufferAttribute( positions, 3 ) );
    geometry.computeBoundingBox();
    return new Points( geometry, material );
}



/**
 * Creates a vector mesh from parasolid data and a material
 *
 * @function vector
 *
 * @return { ThreeJS.Mesh } The vector mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function vector ( data ) {
    var dir = new Vector3( data.coords[ 0 ], data.coords[ 1 ], data.coords[ 2 ] ),
        origin = new Vector3( 0, 0, 0 );

    if ( dir.length() > 0 ) dir.normalize();
    else throw new Error( 'Vector primitive has length zero' );

    return new ArrowHelper( dir, origin, dir.length() );
}



/**
 * Creates a linear mesh from parasolid data and a material
 *
 * @function line
 *
 * @return { ThreeJS.Mesh } The linear mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function line ( data, material ) {
    var geometry = new BufferGeometry(),
        vertices = new Float32Array( data.start.concat( data.end ) );

    geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );

    return new Line( geometry, material );
}



/**
 * Creates a mesh with multiple curves from parasolid data and a material
 *
 * @function polycurve
 *
 * @return { ThreeJS.Mesh } The mesh with curves
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function polycurve ( data, material ) {
    var mesh = new Object3d(),
        i, len;

    for ( i = 0, len = data.curves.length ; i < len ; i++ )
        mesh.add( curve( data.curves[ i ], material ) );

    return mesh;
}



/**
 * Creates a curve mesh from parasolid data and a material
 *
 * @function curve
 *
 * @return { ThreeJS.Mesh } The curve mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh
 */
export function curve ( data, material ) {
    var nurbsControlPoints = _createControlPoints( data ),
        geometry = new Geometry();

    if ( data.knots.length !== nurbsControlPoints.length + data.degree + 1 )
        throw new Error( 'Number of uKnots in a NURBS curve should equal degree + N + 1, where N is the number ' +
                         'of control points' );

    geometry.vertices = data.degree > 1 ?
        new NURBSCurve( data.degree, data.knots, nurbsControlPoints )
            .getPoints( nurbsControlPoints.length * data.degree * 4 ) : nurbsControlPoints;

    return new Line( geometry, material );
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
            new Vector4(
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
 * @return { ThreeJS.Mesh } The arc mesh
 *
 * @throws Error if the data doesn't have a start, middle, or end property
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function arc ( data, material ) {
    var geometry,
        vertices;

    if (!data.start || !data.middle || !data.end) {
        throw new Error('Can not create arc due to incomplete definition.');
    }

    // Initialize vectors
    var a = vec.alloc().set(data.start[0], data.start[1], data.start[2]);
    var b = vec.alloc().set(data.middle[0], data.middle[1], data.middle[2]);
    var c = vec.alloc().set(data.end[0], data.end[1], data.end[2]);

    // Compute line segments
    var ab = vec.clone(b).sub(a);
    var bc = vec.clone(c).sub(b);

    // check for degenerate inputs
    if (ab.length() < TOLERANCE || bc.length() < TOLERANCE ||
            1.0 - Math.abs(vec.clone(ab).normalize().dot(vec.clone(bc).normalize())) < TOLERANCE) {
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

    // Create geometry and material
    geometry = new BufferGeometry();
    geometry.addAttribute( 'position', new BufferAttribute( vertices, 3 ) );

    vec.clear();

    return new Line(geometry, material);
}



/**
 * Computes the midpoint as the center of segment ab
 *
 * @function _computeMidpoint
 * @private
 *
 * @param { ThreeJS.Vector3 } a        The first point
 * @param { ThreeJS.Vector3 } b        The second point
 * @param { ThreeJS.Vector3 } midPoint The midpoint
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
 * @param { Three.Vector3 } a First point along the arc
 * @param { Three.Vector3 } c Third point on arc
 * @param { Three.Vector3 } ab Segement from a to b
 * @param { Three.Vector3 } bc Segement from b to c
 * @param { Three.Vector3 } center Center of arc
 * @param { Three.Vector3 } up Normal to plane containing the arc
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
    while(isFinite(t0) && i < cases.length) {
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
 * Creates a mesh as a set of polygons from parasolid data and a material
 *
 * @function polygonSet
 *
 * @return { ThreeJS.Mesh } The mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function polygonSet ( data, material ) {

    /*eslint-disable no-console */
    console.warn( 'polygonSet has not been implmenented\n\nReceived Data: ' + JSON.stringify( data ) +
                  '\n\nand material: ' + JSON.stringify( material ) );
    /*eslint-enable no-console */

    return null;

    /* TODO:(dan/kyle) port the required utils from genie/geom to make this not
     * stubbed out
     */

    /* commented out
    var allPolygons = new Geometry(),
        mesh;

    for ( var i = 0, len = data.polygons.length ; i < len ; i++ ) {
        mesh = _makeShapeFromPolygon( data.polygons[ i ] );
        allPolygons.merge( mesh.geometry, mesh.matrix );
    }

    return new Mesh( allPolygons, material );
    */
}



/**
 * Creates a mesh as a set of lines from parasolid data and a material
 *
 * @function polyline
 *
 * @return { ThreeJS.Mesh } The mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function polyline ( data, material ) {

    var geometry = new Geometry(),
        point;

    for ( var i = 0, len = data.points.length ; i < len ; i++ ) {
        point = data.points[ i ];
        geometry.vertices.push(
            new Vector3( point[ 0 ], point[ 1 ], point[ 2 ] )
        );
    }

    return new Mesh( geometry, material );
}



/**
 * Creates a surface mesh from parasolid data and a material
 *
 * @function surface
 *
 * @return { ThreeJS.Mesh } The mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 */
export function surface ( data, material ) {
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
                new Vector4(
                    point[ 0 ],
                    point[ 1 ],
                    point[ 2 ],
                    data.weights ? data.weights[ j * len + j ] : 1
                )
            );

        }

    }


    if ( data.uKnots.length !== nsControlPoints[ 0 ].length + data.uDegree + 1 )
        throw new Error( 'Number of uKnots in a NURBS surface should equal uDegree + N + 1' +
                         ', where N is the number of control points along U direction' );

    if ( data.vKnots.length !== nsControlPoints.length + data.vDegree + 1 )
        throw new Error( 'Number of vKnots in a NURBS surface should equal vDegree + N + 1' +
                         ', where N is the number of control points along V direction' );

    //
    var nurbsSurface = new NURBSSurface( data.vDegree, data.uDegree, data.vKnots, data.uKnots, nsControlPoints );

    var geometry = new ParametricGeometry(function ( u, v ) {
        return nurbsSurface.getPoint( u, v );
    }, data.vDegree * nsControlPoints.length * 4, data.uDegree * nsControlPoints[ 0 ].length * 4 );

    geometry.computeFaceNormals();

    return new Mesh( geometry, material );
}



/**
 * Creates a polysurface mesh from parasolid data and a material
 *
 * @function polysurface
 *
 * @return { ThreeJS.Mesh } The polysurface mesh
 *
 * @param { Object }           data     Parasolid data
 * @param { ThreeJS.Material } material The material to give the mesh

 *
 */
export function polysurface ( data, material ) {
    var mesh = new Object3D();

    for ( var i = 0, len = data.surfaces.length ; i < len ; i++ )
        mesh.add( surface( data.surfaces[ i ], material ) );

    return mesh;
}



/**
 * Creates a linear mesh from parasolid data and a material
 *
 * @function line
 *
 * @return { ThreeJS.Mesh } The linear mesh
 *
 * @param { Object } data     Parasolid data
 */
export function text ( data ) {
    return new TextHelper( data.text, {
        size: data.size,
        resolution: data.resolution,
        color: data.color,
        align: data.align
    });
}

