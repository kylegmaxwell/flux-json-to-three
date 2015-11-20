global.self = {};
'use strict';

var test = require('tape');
test = 'default' in test ? test['default'] : test;
var three_js = require('three.js');

/**
 * The VectorManager class. It is an ObjectPool
 * for three js vectors. When the vectors are done
 * being used, they should be cleared
 *
 * @class VectorManager
 */
function VectorManager () {
    this._vectorData = [];
    this._vectorCount = 0;
}



/**
 * Allocate a new vector with new or existing object.
 * The returned vector may have junk in its values
 *
 * @method alloc
 *
 * @return { THREE.Vector3 } The vector
 */
VectorManager.prototype.alloc = function alloc () {
    var result;

    if ( this._vectorCount < this._vectorData.length ) result = this._vectorData[ this._vectorCount ];
    else {
        result = new three_js.Vector3();
        this._vectorData.push( result );
    }

    this._vectorCount += 1;

    return result;
};



/**
 * Deallocate all vectors and begin reallocating from the pool
 *
 * @method clear
 * @return { VectorManager } this
 */
VectorManager.prototype.clear = function clear () {
    this._vectorCount = 0;
    return this;
};



/**
 * Allocate a new vector with the same values as an existing one
 *
 * @method clone
 * @return { Three.Vector3 } The newly allocated vector
 *
 * @param { Three.Vector3 } v The vector to copy
 */
VectorManager.prototype.clone = function clone ( v ) {
    return this.alloc().clone( v );
};

var HALF_PI = Math.PI * 0.5;
var TOLERANCE = 0.000001;
var DEFAULT_ROTATION = new three_js.Vector3( HALF_PI, HALF_PI, 0 );
var PLANE_DEFAULTS = {
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
function cone$1 ( data, material ) {
    var geometry, mesh;
    
    geometry = new three_js.CylinderGeometry( 0, data.radius, data.height, 32 );
    mesh = new three_js.Mesh( geometry, material );
    moveGeometry( mesh, new three_js.Vector3( 0, data.height * 0.5, 0 ) );
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
function cylinder$1 ( data, material ) {
    var geometry, mesh;

    geometry = new three_js.CylinderGeometry( data.radius, data.radius, data.height, 32 );
    mesh = new three_js.Mesh( geometry, material );
    moveGeometry( mesh, new three_js.Vector3( 0, data.height * 0.5, 0 ) );
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
function sphere$1 ( data, material ) {
    var geometry, mesh;

    geometry = new three_js.SphereBufferGeometry( data.radius, 12, 8 );
    mesh = new three_js.Mesh( geometry, material );
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
function torus$1 ( data, material ) {
    var geometry = new three_js.TorusGeometry( data.major_radius, data.minor_radius, 24, 24 );
    return new three_js.Mesh( geometry, material );
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
function block$1 ( data, material ) {
    var geometry = new three_js.BoxGeometry( data.dimensions[ 0 ], data.dimensions[ 1 ], data.dimensions[ 2 ] );
    return new three_js.Mesh( geometry, material );
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
function circle$1 ( data, material ) {
    var geometry = new three_js.CircleGeometry( data.radius, 32 );
    return new three_js.Mesh( geometry, material );
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
function rectangle$1 ( data, material ) {
    var geometry = new three_js.PlaneBufferGeometry( data.dimensions[ 0 ], data.dimensions[ 1 ] );
    return new three_js.Mesh( geometry, material );
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
function plane$1 ( data, material ) {
    var geometry = new three_js.PlaneBufferGeometry( PLANE_DEFAULTS.WIDTH, PLANE_DEFAULTS.HEIGHT,
                                            PLANE_DEFAULTS.WIDTH_SEGMENTS, PLANE_DEFAULTS.HEIGHT_SEGMENTS );
    return new three_js.Mesh( geometry, material );
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
function point$1 ( data, material ) {
    var positions = new Float32Array( data.point ),
        geometry = new three_js.BufferGeometry();

    geometry.addAttribute( 'position', new three_js.BufferAttribute( positions, 3 ) );
    geometry.computeBoundingBox();
    return new three_js.Points( geometry, material );
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
function vector$1 ( data ) {
    var dir = new three_js.Vector3( data.coords[ 0 ], data.coords[ 1 ], data.coords[ 2 ] ),
        origin = new three_js.Vector3( 0, 0, 0 );

    if ( dir.length() > 0 ) dir.normalize();
    else throw new Error( 'Vector primitive has length zero' );

    return new three_js.ArrowHelper( dir, origin, dir.length() );
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
function line$1 ( data, material ) {
    var geometry = new three_js.BufferGeometry(),
        vertices = new Float32Array( data.start.concat( data.end ) );

    geometry.addAttribute( 'position', new three_js.BufferAttribute( vertices, 3 ) );

    return new three_js.Line( geometry, material );
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
function polycurve$1 ( data, material ) {
    var mesh = new three_js.Object3d(),
        i, len;

    for ( i = 0, len = data.curves.length ; i < len ; i++ )
        mesh.add( curve$1( data.curves[ i ], material ) );

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
function curve$1 ( data, material ) {
    var nurbsControlPoints = _createControlPoints( data ),
        geometry = new three_js.Geometry();

    if ( data.knots.length !== nurbsControlPoints.length + data.degree + 1 )
        throw new Error( 'Number of uKnots in a NURBS curve should equal degree + N + 1, where N is the number ' +
                         'of control points' );

    geometry.vertices = data.degree > 1 ?
        new three_js.NURBSCurve( data.degree, data.knots, nurbsControlPoints )
            .getPoints( nurbsControlPoints.length * data.degree * 4 ) : nurbsControlPoints;

    return new three_js.Line( geometry, material );
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
            new three_js.Vector4(
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
function arc$1 ( data, material ) {
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
    geometry = new three_js.BufferGeometry();
    geometry.addAttribute( 'position', new three_js.BufferAttribute( vertices, 3 ) );

    vec.clear();

    return new three_js.Line(geometry, material);
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
function mesh$1 ( data, material ) {
    var geometry = new three_js.Geometry(),
        face;

    for ( var i = 0, len = data.vertices.length ; i < len ; i++ )
        geometry.vertices.push(
            new three_js.Vector3( data.vertices[ i ][ 0 ], data.vertices[ i ][ 1 ], data.vertices[ i ][ 2 ] )
        );

    for ( i = 0, len = data.faces.length ; i < len ; i++ ) {

        face = data.faces[ i ];

        if ( face.length === 3 )
            geometry.faces.push(
                new three_js.Face3( face[ 0 ], face[ 1 ], face[ 2 ] )
            );

        else if ( face.length === 4 ) {
            geometry.faces.push(
                new three_js.Face3( face[ 0 ], face[ 1 ], face[ 2 ] )
            );
            geometry.faces.push(
                new three_js.Face3( face[ 0 ], face[ 2 ], face[ 3 ] )
            );
        }

    }

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals();

    return new three_js.Mesh( geometry, material );
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
function polygonSet$1 ( data, material ) {

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
function polyline$1 ( data, material ) {
    
    var geometry = new three_js.Geometry(),
        point;

    for ( var i = 0, len = data.points.length ; i < len ; i++ ) {
        point = data.points[ i ];
        geometry.vertices.push(
            new three_js.Vector3( point[ 0 ], point[ 1 ], point[ 2 ] )
        );
    }

    return new three_js.Mesh( geometry, material );
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
function surface$1 ( data, material ) {
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
                new three_js.Vector4(
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
    var nurbsSurface = new three_js.NURBSSurface( data.vDegree, data.uDegree, data.vKnots, data.uKnots, nsControlPoints );

    var geometry = new three_js.ParametricGeometry(function ( u, v ) {
        return nurbsSurface.getPoint( u, v );
    }, data.vDegree * nsControlPoints.length * 4, data.uDegree * nsControlPoints[ 0 ].length * 4 );

    geometry.computeFaceNormals();

    return new three_js.Mesh( geometry, material );
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
function polysurface$1 ( data, material ) {
    var mesh = new three_js.Object3D();

    for ( var i = 0, len = data.surfaces.length ; i < len ; i++ )
        mesh.add( surface$1( data.surfaces[ i ], material ) );

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
function text$1 ( data ) {
    return new three_js.TextHelper( data.text, {
        size: data.size,
        resolution: data.resolution,
        color: data.color,
        align: data.align
    });
}



var primitiveHelpers = Object.freeze({
    cone: cone$1,
    cylinder: cylinder$1,
    sphere: sphere$1,
    torus: torus$1,
    block: block$1,
    circle: circle$1,
    rectangle: rectangle$1,
    plane: plane$1,
    point: point$1,
    vector: vector$1,
    line: line$1,
    polycurve: polycurve$1,
    curve: curve$1,
    arc: arc$1,
    mesh: mesh$1,
    polygonSet: polygonSet$1,
    polyline: polyline$1,
    surface: surface$1,
    polysurface: polysurface$1,
    text: text$1
});

var PHONG = 0;
var POINT = 1;
var LINE = 2;
var PRIMITIVE_TO_MATERIAL = {
        cone: PHONG,
        cylinder: PHONG,
        sphere: PHONG,
        torus: PHONG,
        block: PHONG,
        circle: PHONG,
        rectangle: PHONG,
        plane: PHONG,
        point: POINT,
        'point-2d': POINT,
        line: LINE,
        polycurve: LINE,
        curve: LINE,
        arc:LINE,
        mesh: PHONG,
        'polygon-set': PHONG,
        polygonSet: PHONG,
        polyline: LINE,
        surface: PHONG
    };
/**
 * Creates the ParaSolid Object
 *
 * @function createPrimitive
 * @return { ThreeJS.Mesh } The created mesh
 *
 * @param { Object } data The data to create the object with
 */
function createPrimitive ( data ) {

    var materialProperties = _findMaterialProperties( data ),
        material = _createMaterial( PRIMITIVE_TO_MATERIAL[ data.primitive ], materialProperties ),
        mesh = primitiveHelpers[ _resolveLegacyNames( data.primitive ) ]( data, material ),
        axis;

    if ( mesh ) {

        _convertToZUp( mesh );

        if ( data.origin ) _applyOrigin( mesh, data.origin );

        axis = data.axis || data.direction || data.normal;

        if ( axis )
            mesh.lookAt( mesh.position.clone().add(
                new three_js.Vector3(
                    axis[ 0 ],
                    axis[ 1 ],
                    axis[ 2 ]
                )
            ));

        if ( data.attributes && data.attributes.tag ) mesh.userData.tag = data.attributes.tag;

        if ( mesh.type === 'Mesh' ) {
            materialProperties.polygonOffset = true;
            materialProperties.polygonOffsetFactor = 1;
            materialProperties.polygonOffsetUnits = 1;
        }

        mesh.materialProperties = materialProperties;

        return mesh;

    }
    
    throw new Error( 'Unsupported geometry type: ' + data.primitive )

}


/*
 * helpers
 */

/**
 * Helper method to find the material properties on the data
 *
 * @function _findMaterialProperties
 * @private
 *
 * @return { Object } The material properties
 *
 * @param { Object } data The data used to construct the primitive
 */
function _findMaterialProperties ( data ) {
    if ( data.attributes ) return data.attributes.materialProperties;
    else if ( data.materialProperties ) return data.materialProperties;
    else return {
        side: three_js.DoubleSide
    };
}



/**
 * Helper method to create the material from the material properties.
 * There are only a few types of materials used, this function takes a type
 * and returns a material with the properties object given
 *
 * @function _createMaterial
 * @private
 *
 * @return { THREEJS.MATERIAL } an instance of a Three.js material
 *
 * @param { Number } type               A member of the enumeration of material types
 *                                      present in the parasolid utility
 *
 * @param { Object } materialProperties A set of properties that functions
 *                                      as options for the material
 */
function _createMaterial ( type, materialProperties ) {

    if ( materialProperties && !materialProperties.side ) materialProperties.side = three_js.DoubleSide;

    if ( type === PHONG ) return new three_js.MeshPhongMaterial( materialProperties );
    else if ( type === POINT ) return new three_js.PointsMaterial( materialProperties );
    else if ( type === LINE ) return new three_js.LineBasicMaterial( materialProperties );

}



/**
 * A helper to resolve legacy names to present names. This prevents deprication
 * of some of our user's parasolid data.
 *
 * @function _resolveLegacyNames
 * @private
 * 
 * @return { String } the current name
 *
 * @param { String } name a name that may be legacy
 */
function _resolveLegacyNames ( name ) {
    switch ( name ) {

        case 'point':
        case 'point-2d': return 'point';

        case 'polygon-set':
        case 'polygonSet': return 'polygonSet';

        default: return name;
    }
}



/**
 * A helper to convert geometry to z-up world by setting ups axis and rotation
 * order
 *
 * @function _convertToZUp
 * @private
 *
 * @param { ThreeJS.Object3d } object The object to convert to z-up
 */
function _convertToZUp ( object ) {
    object.up.set( 0, 0, 1 );
    object.rotation.order = 'YXZ';
}



/**
 * A helper to apply an origin to a mesh
 *
 * @function _applyOrigin
 * @private
 *
 * @param { ThreeJS.Mesh } mesh The mesh to receive the origin
 * @param { Array } origin The vector representing the origin
 */
function _applyOrigin ( mesh, origin ) {
    mesh.position.set(
        origin[ 0 ],
        origin[ 1 ],
        origin[ 2 ] ? origin[ 2 ] : 0
    );
}

var DEFAULTS = {
    MERGE_MODELS: true
};



/**
 * Creates THREE scene and geometries from parasolid output.
 * The method is called recursively for each array and entities
 * map
 * 
 * @function createObject
 * @return { Object } An object with a ThreeJS scene graph as .mesh and a set of invalid primitives
 * 
 * @param { Object }  data        Parasolid Data from the flux json representation
 * @param { Boolean } mergeModels Whether or not to merge resulting geometries where possible
 *                                defaults to true
 */
function createObject ( data, mergeModels ) {

    var root = { mesh: null, invalidPrims: {} };

    if ( mergeModels == null ) mergeModels = DEFAULTS.MERGE_MODELS;

    if ( data ) {
        if ( data.primitive ) _handlePrimitives( data, root );
        else if ( data.Entities ) _handleEntities( data, root );
        else if ( data.constructor === Array ) _handleArray( data, root, mergeModels );
    }

    return root;
}



/**
 * Helper method to handle the case where the parasolid data has a
 * primitive
 *
 * @function _handlePrimitives
 * @private
 *
 * @param { Object } data Parametric data
 * @param { Object } root The root object that is being built
 *                        in this part of the scene graph
 */
function _handlePrimitives( data, root ) {
    root.mesh = createPrimitive( data );
    if ( !root.mesh ) root.invalidPrims[ data.primitive ] = true;
}



/**
 * Helper method to handle the case where the parasolid data is
 * an object of entities
 *
 * @function _handleEntities
 * @private
 *
 * @param { Object } data Parasolid data
 * @param { Object } root The root object that is being built
 *                        in this part of the scene graph
 */
function _handleEntities ( data, root ) {

    var key, key2, results;

    for ( key in data.Entities ) {

        results = createObject( data.Entities[ key ] );

        if ( results.mesh ) {
            if ( !root.mesh ) root.mesh = new three_js.Object3D();

            root.mesh.add( results.mesh );
        }

        for ( key2 in results.invalidPrims ) root.invalidPrims[ key2 ] = true;

    }

}



/**
 * Helper function to handle the case where the parasolid data
 * is an array of other parasolid data
 *
 * @function _handleArray
 * @private
 *
 * @param { Object } data Parasolid data
 * @param { Object } root The root object that is being built
 *                        in this part of the scene graph
 */
function _handleArray ( data, root ) {
    var i = 0,
        len = data.length,
        key,
        results;

    for (  ; i < len ; i++ ) {
        results = this.createObject( data[ i ] );

        if ( results.mesh ) {

            results.mesh.updateMatrixWorld( true );

            if ( this.mergeModels && !results.mesh.materialProperties )
                _mergeModels( results.mesh, root );

            else root.mesh.add( results.mesh );

        }

        for ( key in results.invalidPrims ) root.invalidPrims[ key ] = true;

    }

    if ( root.mesh ) _upgradeChildrenToBuffer( root.mesh );
}



/**
 * Helper function to merge the children of a particular
 * object in the scene graph into the fewest number of children
 * possible.
 *
 * @function _mergeModels
 * @private
 *
 * @param { ThreeJS.Mesh } mesh A three js mesh
 * @param { Object }       root The object being built by recursion
 */
function _mergeModels ( mesh, root ) {

    if ( !root.mesh ) root.mesh = new three_js.Object3D();

    var children = root.mesh.children,
        i = 0,
        len = children.length;

    for ( ; i < len ; i++ ) {
        if ( _objectDoesntHaveBufferGeometry( children[ i ] ) ) {
            children[ i ].geometry.merge( mesh.geometry, mesh.matrixWorld );
            return;
        }
    }

    root.mesh.add( mesh );

}



/**
 * Takes a mesh and determines whether it can be merged.
 *
 * @function _objectDoesntHaveBufferGeometry
 * @private
 *
 * @returns { Boolean } Whether the object has a BufferGeometry
 *
 * @param { ThreeJS.Object3D } object The object to check
 */
function _objectDoesntHaveBufferGeometry ( object ) {
    return object.geometry && !( object.geometry instanceof three_js.BufferGeometry );
}



/**
 * Takes a Three js object and upgrades its children
 * to buffer geometries if possible
 *
 * @function _upgradeChildrenToBuffer
 * @private
 *
 * @param { ThreeJS.Object3D } object Object to upgrade the children of
 */
function _upgradeChildrenToBuffer ( object ) {

    var child;

    for ( var i = 0, len = object.children.length ; i < len ; i++ ) {
        child = object.children[ i ];
        if ( _objectDoesntHaveBufferGeometry( child ) ) _upgradeGeometryToBuffer( child );
    }

}



/**
 * Upgrades an object to a buffer geometry
 *
 * @function _upgradeGeometryToBuffer
 * @private
 *
 * @param { ThreeJS.Object3D } object Object to upgrade
 */
function _upgradeGeometryToBuffer ( object ) {
    object.geometry = new three_js.BufferGeometry().fromGeometry( object.geometry );
}

/*
 * A set of fixtures for the parasolid util tests
 */

var cone = {
    "input": {
        "direction":[1,1,1],
        "height":10,
        "origin":[0,0,0],
        "primitive":"cone",
        "radius":10,
        "semi-angle":10
    },
    "result": {
        "type": "Mesh"
    }
};

var cylinder = {
    "input": {
        "axis":[10,20,30],
        "height":40,
        "origin":[0,0,0],
        "primitive":"cylinder",
        "radius":10
    },
    "result": {
        "type": "Mesh"
    }
};

var sphere = {
    "input": {
        "origin":[0,0,0],
        "primitive":"sphere",
        "radius":10
    },
    "result": {
        "type": "Mesh"
    }
};

var torus = {
    "input": {
        "origin": [0,0,0],
        "majorRadius": 5,
        "minorRadius":3,
        "axis":[0,0,1],
        "primitive":"torus"
    },
    "result": {
        "type": "Mesh"
    }
};

var block = {
    "input": {
        "origin":[0,0,0],
        "dimensions":[1,2,3],
        "axis":[0,0,1],
        "reference":[0,1,0],
        "primitive":"block"
    },
    "result": {
        "type": "Mesh"
    }
};


var circle = {
     "input": {
         "origin":[0,0,0],
         "primitive":"circle",
         "radius":10
     },
     "result": {
         "type": "Mesh"
     }
};

var rectangle = {
    "input": {
        "dimensions": [2,2],
        "primitive": "rectangle"
    },
    "result": {
        "type": "Mesh"
    }
};

var plane = {
    "input": {
        "origin":[5,5,0],
        "normal":[0,0,1],
        "primitive":"plane"
    },
    "result": {
        "type": "Mesh"
    }
};

var point = {
    "input": {
        "point":[0,0,0],
        "primitive":"point"
    },
    "result": {
        "type":"Points"
    }
};

var vector = {
    "input": {
        "coords": [2,2,0], 
        "primitive": "vector"
    },
    "result": {
        "type": "Object3D"
    }
};

var line = {
    "input": {
        "end":[2,2,2],
        "primitive":"line",
        "start":[1,1,1]
    },
    "result": {
        "type": "Line"
    }
};

var curve = {
    "input": {
        "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],
        "degree":3,
        "knots":[0,0,0,1,2,3,3,3],
        "primitive":"curve"
    },
    "result": {
        "type": "Line"
    }
};

var polycurve = {
    "input": {
        "curves":[{
            "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],
            "degree":3,"knots":[0,0,0,1,2,3,3,3],
            "primitive":"curve"
        }, {
            "degree":3,
            "knots":[0,0,0,0,14.1,14.1,14.1,14.1],
            "controlPoints":[[0,0,0],[-3.3,-3.3,0],[-6.6,-6.6,0],[-10,-10,0]],
            "primitive":"curve"
        }],
        "primitive":"polycurve"
    },
    "result": {
        "type": "Object3D"
    }
};

var arc = {
    "input": {
        "start":[1,0,0],
        "middle":[0,1,0],
        "end":[-1,0,0],
        "primitive":"arc"
    },
    "result": {
        "type": "Line"
    }
};

var degenerateArc = { // test degenerate arc
    "input": {
        "start":[0,0,0],
        "middle":[1,1,0],
        "end":[0,0,0],
        "primitive":"arc"
    },
    "result": {
        "type": "Line"
    }
};

var mesh = {
    "input": {
         "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
         "faces":[[0,3,1],[1,3,2]],
         "primitive":"mesh"
    },
    "result": {
        "type": "Mesh"
    }
};

var polygonSet = {
    "input":{
        "polygons":[{
            "boundary":[[15,0,0],[-7.5,13.0,0],[-7.5,-13.0,0]],
            "holes":[]
        }],
        "primitive":"polygon-set"
    },
    "result": {
        "type": "Mesh"
    },
};

var polyline = {
    "input": {
        "points":[[0,0,5],[1,0,5],[2,2,5],[0,1,5]],
        "primitive":"polyline"
    },
    "result": {
        "type": "Line"
    }
};

var surface = {
    "input": {
        "controlPoints":[[[-8,8,0],[8,8,0]],[[-8,-8,0],[8,-8,0]]],
        "primitive":"surface",
        "uDegree":1,
        "uKnots":[0,0,1,1],
        "vDegree":1,
        "vKnots":[0,0,1,1]
    },
    "result": {
        "type": "Mesh"
    }
};

var polysurface = {
    "input": {
        "surfaces":[{
            "controlPoints":[[[-8,8,0],[8,8,0]],[[-8,-8,0],[8,-8,0]]],
            "primitive":"surface",
            "uDegree":1,
            "uKnots":[0,0,1,1],
            "vDegree":1,
            "vKnots":[0,0,1,1]
        }, {
            "controlPoints":[[[-20,8,9],[-8,8,0]],[[-20,-8,9],[-8,-8,0]]],
            "primitive":"surface",
            "uDegree":1,
            "uKnots":[0,0,1,1],
            "vDegree":1,
            "vKnots":[0,0,1,1]
        }],
        "primitive":"polysurface"
    },
    "result": {
        "type": "Object3D"
    }
};

var text = {
    "input": {
        "align":[0,0,0],
        "direction":[0,-1,100],
        "origin":[0,-7,1],
        "primitive":"text",
        "size":8,
        "text":"Text!"
    },
    "result": {
        "type": "textHelper"
    }
};

var invalid = {
    "input": {
        "info": "Not supported", 
        "primitive": "brep"
    },
    "result": null
};



var fixtures = Object.freeze({
    cone: cone,
    cylinder: cylinder,
    sphere: sphere,
    torus: torus,
    block: block,
    circle: circle,
    rectangle: rectangle,
    plane: plane,
    point: point,
    vector: vector,
    line: line,
    curve: curve,
    polycurve: polycurve,
    arc: arc,
    degenerateArc: degenerateArc,
    mesh: mesh,
    polygonSet: polygonSet,
    polyline: polyline,
    surface: surface,
    polysurface: polysurface,
    text: text,
    invalid: invalid
});

test( 'flux-parasolidUtil', function ( t ) {
    var obj = createObject( 3 ),
        key,
        input;

    t.equal( obj.mesh, null, 'it should ignore non geometric types' );

    for ( key in fixtures ) {
        input = fixtures[ key ].input;
        obj = createObject( input );

        if ( fixtures[ key ].result ) {
            t.ok( obj.mesh, 'createObject should create a mesh for parasolid data of ' + key  );
            t.equal( obj.mesh.type, fixtures[ key ].result.type, 'createObject should create a mesh of type ' +
                                                                 fixtures[ key ].result.type + ' for data ' + key ); 
        } else {
            t.ok( obj.invalidPrims[ input.primitive ], 'if the data is invalid, createObject' +
                                                       ' should return it as part of' +
                                                       ' the set of invalid primitives' ); 
        }
    }

});