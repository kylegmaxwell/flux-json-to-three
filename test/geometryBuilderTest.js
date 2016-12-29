'use strict';

var test = require('tape-catch');
var THREE = require('three');
var index = require('../build/index-test.common.js');
var SceneBuilder = index.SceneBuilder;
var fixtures = require('./data/fixtures.js');
var sphereSurface = require('./data/sphere-surface.json');

var TOLERANCE = 0.000001;

var builder = new SceneBuilder('parasolid','ibl');
var builder2 = new SceneBuilder('parasolid','ibl');
builder2.setAllowMerge(false);
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
                t.ok(result.getObject(), 'Should create an object: '+result.getErrorSummary());
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
    "uDegree":1,"uKnots":[0,0,1,1],"vDegree":1,"vKnots":[0,0,1,1]},{"vertices":
    [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"
    }]},{"normal":[0,0,1],"origin":[5,5,-10],
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
            t.ok(result.getObject().children[0].geometry.attributes.position.array.length !== 0, 'Should have positions');
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
                for (i = 0; i < geom.faces.length; i++) {
                    t.ok(geom.faces[i].vertexNormals.length === (elem.faceNormals ? 0 : 3), 'Has the right number of face normals');
                }
            }
            t.end();
        }).catch(printError(t));
    });
}); // end for each

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


test( 'Schema for geometry', function ( t ) {
    var data = {
        "x":5,
        "units":{
            "/controlPoints":"meters"
        },
        "attributes":{"materialProperties":{"color":[0.25,1,0.639],"size":4}},
        "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],
        "degree":3,
        "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"
    };
    builder.convert(data).then(function(result) {
        var summary = result.getErrorSummary();
        t.ok(summary === '', 'Should match schema '+summary);
        t.end();
    }).catch(printError(t));

});

test( 'Invalid schema for polycurve', function ( t ) {
    var data = {"x":5,
        "attributes":{"materialProperties":{"color":[0.25,1,0.639],"size":4}},
        "curves":[
        {"controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],"degree":3,
            "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"},
            {"start":[1,0,0],"middle":[0,1,0],"end":[-1,0,0],
            "units":{"start":12}, // unit key is missing slash
            "primitive":"arc"}],
        "primitive":"polycurve"
    };
    builder.convert(data).then(function(result) {
        var summary = result.getErrorSummary();
        t.ok(summary !== '', 'Should not match schema '+summary);
        t.ok(summary.indexOf('units') !== -1, "Should contain message about units");
        t.end();
    }).catch(printError(t));
});

test('mixed value same prim', function (t) {
    var data = [{"origin":[0,0,0],"primitive":"sphere","radius":1},
                {"origin":[1,0,0],"primitive":"sphere","xradius":1}];
    // When value is set it should be parsed, and model will be updated
    builder.convert(data).then(function (result) {
        t.ok(result.getErrorSummary().indexOf("sphere")!==-1,'Errors for mixed value');
        t.ok(result.getObject(), 'Result exists in spite of errors');
        t.end();
    }).catch(printError(t));
});

test('metadata tests for selection', function (t) {
    var sphere = {"origin":[0,0,0],"primitive":"sphere","radius":1,"id":"ABCD"};
    var block = {"origin":[0,0,0],"dimensions":[1,2,3],"axis":[0,0,1],"reference":[0,1,0],
    "primitive":"block","id":"1234"};
    var data = [sphere,block];
    // When value is set it should be parsed, and model will be updated
    builder2.convert(data).then(function (result) {
        var map = result.getObjectMap();
        t.deepEqual(map.ABCD.userData.data, sphere, "Has JSON data for sphere");
        t.equal(map.ABCD.userData.id, sphere.id, "Has id");
        t.equal(map.ABCD.userData.primitive, sphere.primitive, "Has primitive");
        t.deepEqual(map["1234"].userData.data, block, "Has JSON for block");
        t.end();
    }).catch(printError(t));
});

test('Mesh with color and normal', function (t) {
    var data = {
      "vertices": [ [-1,1,2], [1,1,2], [1,-1,2], [-1,-1,2]],
      "color": [ [0,1,0], [1,1,1], [0,0,1], [1,0,0]],
      "normal": [ [[1,1,1], [1,1,1], [1,1,1], [1,1,1]]],
      "faces": [[0,1,2,3]],
      "primitive":"mesh",
      "id": "3DF1D7DC-61C7-43D1-857D-F6CA76E5862A"
    };
    // When value is set it should be parsed, and model will be updated
    builder.convert(data).then(function (result) {
        t.ok(result.getErrorSummary()==='','No errors');
        var obj = result.getObject();
        var colors = Array.from(obj.children[0].geometry.attributes.color.array);
        // Colors get triangulated and flattened and maintain winding order
        t.deepEqual(colors, [0,1,0, 1,1,1, 0,0,1, 0,1,0, 0,0,1, 1,0,0]);
        t.end();
    }).catch(printError(t));
});
