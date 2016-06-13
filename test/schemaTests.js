'use strict';

var test = require('tape');
var THREE = require('three/three.js');
var index = require('../build/index-test.common.js');
var GeometryResults = index.GeometryResults;

test( 'Schema for geometry', function ( t ) {
    var results = new GeometryResults();
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
    var matchesSchema = index.checkSchema(data, results.primStatus);
    t.ok(matchesSchema, "Should match schema");
    t.end();
});

test( 'Invalid schema for polycurve', function ( t ) {
    var results = new GeometryResults();
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
    var matchesSchema = index.checkSchema(data, results.primStatus);
    t.ok(!matchesSchema, "Should not match schema");
    t.ok(results.primStatus.invalidKeySummary().indexOf('units') !== -1, "Should contain message about units");
    t.end();
});
