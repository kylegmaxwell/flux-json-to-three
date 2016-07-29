'use strict';

var test = require('tape');
var THREE = require('three');
var index = require('../build/index-test.common.js');
var FluxGeometryError = index.FluxGeometryError;
var SceneBuilder = index.SceneBuilder;
var fixtures = require('./fixtures.js');
var sphereRound = require('../data/sphere-round.json');
var sphereSurface = require('../data/sphere-surface.json');

var TOLERANCE = 0.000001;

var builder = new SceneBuilder('parasolid','ibl');
var printError = require('./printError.js').init('geometry builder');

test('should create a model when value is changed', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert({"origin":[0,0,0],"primitive":"sphere","radius":10}).then(function (result) {
        t.ok(result.getObject(), "has a mesh");
        t.equal(result.getObject().children.length, 1, "has one child");
        t.end();
    }).catch(printError(t));
});

test('should ignore non geometric types', function (t) {
    builder.convert(3).then(function (result) {
        t.equal(result.getObject(), null,'mesh should be empty');
        t.end();
    }).catch(printError(t));
});

test('should collapse points into point clouds', function (t) {
    builder.convert([{"point": [0, 0, 0], "primitive": "point"},
        {"point": [0.5, 0.8, 195], "primitive": "point"},
        {"point": [-0.8, 1, 275]}]).then(function (result) {
        t.ok(result.getObject(), 'mesh should exist');
        t.equal(result.getObject().children.length, 1, 'length should be 1');
        t.end();
    }).catch(printError(t));
});

test('should handle polygons with many sides', function (t) {
    builder.convert([{"faces":[[4,3,1,2,0]],"primitive":"mesh","vertices":[
        [64.87668454306318,111.66932246077474,0],[2.4623122570067366,
        18.985144722492265,0],[0,88.0005815039231,0],[68.86078946581554,
        0,0],[107.43499292508791,57.281972061594935,0]]}]).then(function (result) {
        t.ok(result.getObject(), 'mesh should exist');
        t.equal(result.getObject().children[0].geometry.attributes.position.array.length, 27, 'should have 9 points');
        t.end();
    }).catch(printError(t));
});

// Iterate over all the primitive types, and test each one
fixtures.tests.forEach(function (elem) {
    var primType = elem.input.primitive;
    var prim = elem.input;
    test('should deserialize \''+primType+'\' in Flux JSON object notation', function (t) {
        builder.convert(prim).then(function (result) {
            // If an object is expected for the result
            if (elem.result) {
                t.ok(result.getObject(), 'Should create an object');
                // Check that the object has the right type
                var obj = result.getObject().children[0];
                t.equal(obj.type, elem.result.type, 'Created object has type '+elem.result.type);
                if (elem.result.type === 'Mesh') {
                    t.ok(obj.geometry.type.indexOf('Buffer')!==-1, 'Meshes should be buffer geometry');
                }
            } else {
                // Check that the invalid primitive was reported correctly
                t.ok(result.getErrorSummary().indexOf(primType)!==-1, 'Invalid primitive reports correctly');
            }
            t.end();
        }).catch(printError(t));

    });

}); // end for each


test('should handle complicated lists', function (t) {
    // This blob is a download of the 'Geometry Flow' data key from the '3D QA Module' Flux app
    var data = [{"attributes":{"materialProperties":{"color":"tomato","wireframe":false,
    "side":2,"polygonOffset":true,"polygonOffsetFactor":1,"polygonOffsetUnits":1}},
    "dimensions":[10,10,10],"origin":[30,0,0],"primitive":"block"},
    {"attributes":{"materialProperties":{"color":"gold","wireframe":false,"side":2,
    "polygonOffset":true,"polygonOffsetFactor":1,"polygonOffsetUnits":1}},
    "origin":[0,30,0],"primitive":"sphere","radius":10},[{"controlPoints":
    [[0,0,0],[20,0,0],[20,20,0],[0,20,0]],"degree":3,"knots":[0,0,0,1,2,3,3,3],
    "primitive":"curve"}],[{"attributes":{"materialProperties":{"color":"#AAAAAA",
    "wireframe":false,"side":2}},"primitive":"polysurface","surfaces":[{"controlPoints":
    [[[-8,-12,0],[8,-12,0]],[[-8,-28,0],[8,-28,0]]],"primitive":"surface","uDegree":1,
    "uKnots":[0,0,1,1],"vDegree":1,"vKnots":[0,0,1,1]},{"controlPoints":
    [[[-20,-12,9],[-8,-12,0]],[[-20,-28,9],[-8,-28,0]]],"primitive":"surface",
    "uDegree":1,"uKnots":[0,0,1,1],"vDegree":1,"vKnots":[0,0,1,1]},{"polygons":
    [{"boundary":[[25,-20,15],[10,-7,0],[10,-33,0]],"holes":[[[20,-20,10],[12,-11,2],
    [12,-29,2]]]}],"primitive":"polygonSet"}]},{"normal":[0,0,1],"origin":[5,5,-10],
    "primitive":"plane"}]];
    // When value is set it should be parsed, and model will be updated
    builder.convert(data).then(function (result) {
        t.ok(result.getObject(), 'Result exists');
        t.end();
    }).catch(printError(t));
});

test('should handle lists of curves', function (t) {
    var data = [{"controlPoints":[[0,0,0],[20,0,0],[20,20,0],[0,20,0]],"degree":3,"knots":[0,0,0,1,2,3,3,3],"primitive":"curve"}];
    // When value is set it should be parsed, and model will be updated
    builder.convert(data).then(function(result) {
        t.ok(result.getObject(), 'Object exists');
        if (result.getObject().children[0].geometry.type.indexOf('BufferGeometry') !== -1) {
            t.ok(result.getObject().children[0].geometry.attributes.position.length !== 0, 'Should have positions');
        } else {
            t.ok(result.getObject().children[0].geometry.vertices.length !== 0, 'Should have vertices');
        }
        t.end();
    }).catch(printError(t));
});

var normalsTests = [
    {
    "name": "dataRightAngle",
    "input": {"vertices": [[-1,0,0],[-1,1,2],[1,0,2],[-1,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
    "faceNormals": true,
    },
    {
    "name": "dataAlmostFlat",
    "input": {"vertices": [[-1,0,0],[0,1,0.2],[1,0,0],[0,-1,0.2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
    "faceNormals": false,
    },
    {
    "name": "dataFlatSplit",
    "input": {"vertices": [[-1,0,0],[0,1,-0.2],[1,0,0],[0,-1,-0.2],
    [0,1,-0.2], [0,-1,-0.2]],"faces":[[0,5,4],[1,3,2]],"primitive":"mesh"},
    "faceNormals": false,
    }
];
// Iterate over all the fixtures for normals testing
normalsTests.forEach(function (elem) {
    var word = elem.faceNormals?'':'not';
    test('Should '+word+' use face normals for '+elem.name, function (t) {
        builder.convert(elem.input).then(function(result) {
            t.ok(result.getObject(), 'Object exists');
            var geom = result.getObject().children[0].geometry;
            if (geom.type.indexOf('BufferGeometry') !== -1) {
                var nArr = geom.attributes.normal.array;
                // We assume all faces are triangles with 3 normal vectors with 3 components
                for (var i = 0; i < nArr.length; i+=9) {
                    var n1 = new THREE.Vector3(nArr[i  ], nArr[i + 1], nArr[i + 2]);
                    var n2 = new THREE.Vector3(nArr[i+3], nArr[i + 4], nArr[i + 5]);
                    var n3 = new THREE.Vector3(nArr[i+6], nArr[i + 7], nArr[i + 8]);
                    var isFlat = n1.distanceToSquared(n2) + n2.distanceToSquared(n3) < TOLERANCE*2;
                    var flatWord = elem.faceNormals ? '' : 'not';
                    t.equal(isFlat,elem.faceNormals, 'Face '+(i/9)+' should '+flatWord+'have face normals');
                }
            } else {
                for (var i = 0; i < geom.faces.length; i++) {
                    t.ok(geom.faces[i].vertexNormals.length === (elem.faceNormals ? 0 : 3), 'Has the right number of face normals');
                }
            }
            t.end();
        }).catch(printError(t));
    });
}); // end for each

test('should make round nurbs spheres', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(sphereRound).then(function (result) {
        t.ok(result.getObject(), 'sphere made a mesh');
        var geom = result.getObject().children[0].geometry;
        var isRound = true;
        var pAttr = geom.attributes.position.array;
        // For each point (points always have 3 components)
        for (var i=0; i<pAttr.length; i+=3) {
            var p = new THREE.Vector3(pAttr[i],pAttr[i+1],pAttr[i+2]);
            if (Math.abs(p.length()-1) >= TOLERANCE) {
                isRound = false;
            }
        }
        t.ok(isRound,'Sphere is round');
        t.end();
    }).catch(printError(t));
});

// This test renders a sphere which has many disjoint points at the top.
// It passes when those points are merged together which results in a
// normal vector that points up due to the average orientation of those faces.
test('should merge vertices on surfaces', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(sphereSurface).then(function (result) {
        t.ok(result.getObject(), 'sphere made a mesh');
        var geom = result.getObject().children[0].geometry;
        var upCount = 0;
        var nAttr = geom.attributes.normal.array;
        var up = new THREE.Vector3(0,0,1);
        // For each point (points always have 3 components)
        for (var i=0; i<nAttr.length; i+=3) {
            var n = new THREE.Vector3(nAttr[i],nAttr[i+1],nAttr[i+2]);
            if (Math.abs(n.distanceTo(up)) < 0.001) {
                upCount++;
            }
        }
        t.ok(upCount > 10,'Up vector exits on sphere');
        t.end();
    }).catch(printError(t));
});

test('should merge multi colored objects', function (t) {
    var coloredPanels = [{"attributes":{"materialProperties":{"color":"red"}},"vertices":
        [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
        {"attributes":{"materialProperties":{"color":"blue"}},"vertices": [[-1,0,0],
        [0,1,0],[1,0,0],[0,-1,0]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"}];
    // When value is set it should be parsed, and model will be updated
    builder.convert(coloredPanels).then(function (result) {
        t.ok(result.getObject(),'Create a mesh');
        t.equal(result.getObject().children.length,1,'One child');
        var color = result.getObject().children[0].geometry.attributes.color.array;
        t.ok(color,'Color exists');

        // Check for red
        t.equal(color[0],1,'Color component r');
        t.equal(color[1],0,'Color component g');
        t.equal(color[2],0,'Color component b');

        // Check for blue
        t.equal(color[color.length-3],0,'Last color component r');
        t.equal(color[color.length-2],0,'Last color component g');
        t.equal(color[color.length-1],1,'Last color component b');

        t.end();
    }).catch(printError(t));
});

test('should merge non consecutive objects', function (t) {
    var coloredPanels = [{"attributes":{"materialProperties":{"color":"red"}},"vertices":
        [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
        {"attributes":{"materialProperties":{"opacity":0.4}},"origin":[0,0,0],"primitive":"sphere","radius":10},
        {"attributes":{"materialProperties":{"color":"blue"}},"vertices": [[-1,0,0],
        [0,1,0],[1,0,0],[0,-1,0]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"} ];
    // When value is set it should be parsed, and model will be updated
    builder.convert(coloredPanels).then(function (result) {
        t.ok(result.getObject(),'Object exists');
        t.equal(result.getObject().children.length,2,'has two children');
        t.end();
    }).catch(printError(t));
});

test('should support torus parms', function (t) {
    var torus = {"origin": [0,0,0],"majorRadius": 5,"minorRadius":3,"axis":[0,0,1],
        "primitive":"torus"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(torus).then(function (result) {
        var pos = result.getObject().children[0].geometry.attributes.position.array;
        var maxX = 0;
        for (var i=0;i<pos.length;i+=3) {
            if (pos[i] > maxX) {
                maxX = pos[i];
            }
        }
        t.equal(maxX,8,'Torus max x is 8');
        t.end();
    }).catch(printError(t));
});

test('should merge transformed geometry', function (t) {
    var boxes = [{"dimensions":[1,1,1],"origin":[1,1,1],"primitive":"block"},
        {"dimensions":[1,1,1],"origin":[1,1,1],"primitive":"block"}];

    // When value is set it should be parsed, and model will be updated
    builder.convert(boxes).then(function (result) {
        t.equal(result.getObject().children.length,1,'Has one child');
        var pos = result.getObject().children[0].geometry.attributes.position.array;
        var minX = pos[0];
        var maxX = pos[0];
        for (var i=3;i<pos.length;i+=3) {
            if (pos[i] < minX) {
                minX = pos[i];
            }
            if (pos[i] > maxX) {
                maxX = pos[i];
            }
        }
        // All points should be in local coordinates bounds for x
        t.equal(minX,-0.5,'minX');
        t.equal(maxX,0.5,'maxX');
        t.end();
    }).catch(printError(t));
});

test('schema allow extra attributes', function (t) {
    var line = {"materialProperties":{"color":[0.25,1,0.639],"size":4},
        "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],"degree":3,
        "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(line).then(function (result) {
        t.ok(result.getErrorSummary().indexOf("additional properties")===-1,'Not contain additional properties');
        t.end();
    }).catch(printError(t));
});

test('schema should allow anything inside attributes', function (t) {
    var line = {"attributes":{"materialProperties":{"color":[0.25,1,0.639],"size":4},
        "foo":123, "bar":[22,3,5], "cats":"dogs"},
        "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],"degree":3,
        "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(line).then(function (result) {
        t.equal(result.getErrorSummary(),'','No invalid keys');
        t.equal(result.getObject().children.length,1,'One child');
        t.end();
    }).catch(printError(t));
});
