'use strict';

import test from 'tape';
import * as index from '../index.js';
import * as fixtures from './fixtures.js';
import * as fixturesUnits from './fixturesUnits.js';
import FluxGeometryError from '../src/geometryError.js';
import normalizeUnits from '../src/unitConverter.js';

test( 'Error handling', function ( t ) {
    var hasError = false;
    try {
        throw new FluxGeometryError();
    } catch (e) {
        t.equal(e.name, 'FluxGeometryError', 'Errors should be named FluxGeometryError.')
        hasError = true;
    }

    t.equal(hasError, true, 'Should throw errors when appropriate.')
    t.end();
});

test( 'Geometry translation', function ( t ) {
    var key,
        input,
        obj;
    var root = new index.GeometryResults();

    for ( key in fixtures ) {
        input = fixtures[ key ].input;
        index.createObject( input, root );

        if ( fixtures[ key ].result ) {
            t.ok( root.mesh, 'createObject should create a mesh for parasolid data of ' + key  );

            t.equal( root.mesh.children[root.mesh.children.length-1].type,
                    fixtures[ key ].result.type,
                    'The mesh should be of type ' +
                    fixtures[ key ].result.type + ' for data ' + key );
        } else {
            t.ok( !root.invalidPrims.validKey(input.primitive) , 'if the data is invalid, createObject' +
                                                       ' should return it as part of' +
                                                       ' the set of invalid primitives' );
        }
    }
    t.end();
});

test( 'Geometry with attributes', function ( t ) {
    var root = new index.GeometryResults();
    var data = {"attributes":{ "foo": 123 },
    "origin": [0,0,0],"primitive": "sphere","radius": 10};
    index.createObject(data, root);
    t.ok(root.mesh.children[0], 'createobject should create a mesh despite attributes');
    t.end();
});

test( 'Schema for geometry', function ( t ) {
    var root = new index.GeometryResults();
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
    var matchesSchema = root.checkSchema(data);
    t.ok(matchesSchema, "Should match schema");
    t.end();
});

test( 'Invalid schema for polycurve', function ( t ) {
    var root = new index.GeometryResults();
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
    var matchesSchema = root.checkSchema(data);
    t.ok(!matchesSchema, "Should not match schema");
    t.ok(root.invalidPrims.invalidKeySummary().indexOf('units') !== -1, "Should contain message about units");
    t.end();
});

test( 'Units translation', function ( t ) {
    var root = new index.GeometryResults();
    Object.keys(fixturesUnits).forEach(function (key) {
        var entity = fixturesUnits[key].start;
        entity = JSON.parse(JSON.stringify(entity));
        var succeedStr = fixturesUnits[key].succeed ? 'pass' : 'fail';
        var hasException = false;
        try {
            var matchesSchema = root.checkSchema(entity);
            t.ok(matchesSchema, "Should match schema");
            var entityNormalized = normalizeUnits(entity);
            t.deepEqual(entityNormalized, fixturesUnits[key].end, 'Convert '+key+' to meters.');
        } catch (err) {
            hasException = true;
            t.equal(err.constructor, FluxGeometryError);
            if (fixturesUnits[key].succeed) {
                console.error(err.message);
            }
        }
        t.equal(!hasException, fixturesUnits[key].succeed, 'Unit normalization should '+succeedStr+' for '+key+'.');
    });
    t.end();
});
