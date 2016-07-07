'use strict';

var test = require('tape');
var THREE = require('three');
var GeometryBuilder = require('../build/index-test.common.js').GeometryBuilder;
var tests = require('./nurbsFixtures.js').tests;

// Maximum variation in parameters allowed for tests to pass
var TEST_TOLERANCE = 0.4;

/**
 * Convert an array to a vector object
 * @param    {Array.<Number>} arr Array of 3 numbers
 * @return {THREE.Vector3}         Resulting vector
 */
function arrayToVec(arr) {
    return new THREE.Vector3(arr[0], arr[1], arr[2]);
}

/**
 * Compare two floating point numbers
 * @param    {Number} a     The first number
 * @param    {Number} b     The second number
 * @param    {Number} tol Fuzzy comparison tolerance
 * @return {Boolean}        Whether the numbers are equal
 */
function floatEquals(a, b, tol) {
    return Math.abs(a-b) < tol;
}

var printError = require('./printError.js').init('nurbs test');

// Module for converting parameter objects to geometry
var builder = new GeometryBuilder();

// Iterate over all the primitive types, and test each one
tests.forEach(function (elem) {
    test('Should render \''+elem.name+'\' without artifacts', function (t) {
        builder.convert(elem.entity).then(function (result) {
            t.ok(result.object,'Object exists');
            var geom = result.object.children[0].geometry;
            var verts = geom.vertices;
            var pArr = geom.type === 'BufferGeometry' ? geom.attributes.position.array : null;
            var center = new THREE.Vector3(0,0,0);
            if (pArr) {
                // Buffergeometry
                for (var i=0; i<pArr.length; i+=3) {
                    center.add(new THREE.Vector3(pArr[i],pArr[i+1],pArr[i+2]));
                }
                center.divideScalar(pArr.length/3);
            } else {
                // Loop over the vertices to compute the center
                for (var i=0; i<verts.length; i++) {
                    center.add(verts[i]);
                }
                center.divideScalar(verts.length);
            }

            var delta = center.distanceTo(arrayToVec(elem.center));
            t.ok(delta < TEST_TOLERANCE, 'Delta in tolerance');
            var minRadius = 1000;
            var maxRadius = 0;
            if (!pArr) {
                // BufferGeometry
                for (var i=0; i<verts.length; i++) {
                    var dist = center.distanceTo(verts[i]);
                    if (dist > maxRadius) {
                        maxRadius = dist;
                    }
                    if (dist < minRadius) {
                        minRadius = dist;
                    }
                }
            } else {
                // Loop over the points and find their relative distances from the center
                for (var i=0; i<pArr.length; i+=3) {
                    var dist = center.distanceTo(new THREE.Vector3(pArr[i],pArr[i+1],pArr[i+2]));
                    if (dist > maxRadius) {
                        maxRadius = dist;
                    }
                    if (dist < minRadius) {
                        minRadius = dist;
                    }
                }
            }
            t.ok(floatEquals(minRadius, elem.minRadius, TEST_TOLERANCE),'Min radius in tolerance');
            t.ok(floatEquals(maxRadius, elem.maxRadius, TEST_TOLERANCE),'Max radius in tolerance');

            t.end();
        }).catch(printError(t));
    }); // end it
}); // end for each

test('should appropriately triangulate nurbs', function (t) {
    // panels sorted from low to high curvature
    var panels = [
    {"controlPoints":[[[10237.582087930936,110256.77664207295,53292.48279714201],
        [16868.0646841163,109485.93234759399,53296.887735121396],[23498.54728030166,
            108715.08805311503,53301.292673100805],[30129.029876487035,107944.24375863609,
            53305.6976110802]],[[10325.572729229012,111830.47616394212,53112.90233095167],
        [17039.688193184822,111054.75941110337,53116.57311260116],[23753.80365714065,
            110279.04265826468,53120.243894250685],[30467.91912109646,109503.3259054259,
            53123.91467590017]],[[10413.56337052709,113404.17568581128,52933.32186476134],
        [17211.31170225336,112623.58647461279,52936.25849008093],[24009.06003397961,
            111842.9972634142,52939.195115400515],[30806.80836570589,111062.4080522157,
            52942.13174072013]],[[10501.554011825167,114977.87520768045,52753.741398571],
        [17382.93521132188,114192.41353812217,52755.943867560694],[24264.3164108186,
            113406.95186856383,52758.146336550395],[31145.697610315314,112621.49019900551,
            52760.348805540096]]],"primitive":"surface","uDegree":3,"uKnots":[0,0,0,0,1,1,
        1,1],"vDegree":3,"vKnots":[0,0,0,0,1,1,1,1]},
    {"controlPoints":[[[10237,110256,53292],[16868,109485,53296],[23498,108715,
        53301],[30129,107944,53305]],[[10325,111830,53112],[17039,111054,53116],
        [23753,110279,53120],[30467,109503,53123]],[[10413,113404,52933],[17211,
        112623,52936],[24009,111842,52939],[30806,111062,52942]],[[10501,114977,
        52753],[17382,114192,52755],[24264,113406,56758],[31145,112621,52760]]],
            "primitive":"surface","uDegree":3,"uKnots":[0,0,0,0,1,1,1,1],"vDegree":3,
            "vKnots":[0,0,0,0,1,1,1,1]},
    {"controlPoints":[[[10237,110256,53292],[16868,109485,53296],[23498,108715,
        73301],[30129,107944,53305]],[[10325,111830,53112],[17039,111054,53116],
        [23753,110279,53120],[30467,109503,53123]],[[10413,113404,52933],[17211,
        112623,52936],[24009,111842,52939],[30806,111062,52942]],[[10501,114977,
        52753],[17382,114192,52755],[24264,113406,72758],[31145,112621,52760]]],
            "primitive":"surface","uDegree":3,"uKnots":[0,0,0,0,1,1,1,1],"vDegree":3,
            "vKnots":[0,0,0,0,1,1,1,1]}
    ]

    // Triangle has x, y, z, x, y, z, x, y, z
    var triangleComponents = 9;
    var faceCount = 0;
    var faceCountPrev = 0;
    builder.convert(panels[0]).then(function(result) {
        t.ok(result.object,'Object exists');
        faceCount = result.object.children[0].geometry.attributes.position.array.length/triangleComponents;
        t.ok(faceCount,2,'Two faces');
        faceCountPrev = faceCount;
        builder.convert(panels[1]).then(function (result) {
            faceCount = result.object.children[0].geometry.attributes.position.array.length/triangleComponents;
            t.ok(faceCount >= faceCountPrev, 'Has more faces');
            faceCountPrev = faceCount;
            builder.convert(panels[2]).then(function (result) {
                faceCount = result.object.children[0].geometry.attributes.position.array.length/triangleComponents;
                t.ok(faceCount >= faceCountPrev,'Has more more faces');
                t.end();
            });
        });
    }).catch(printError(t));
}); // end it
