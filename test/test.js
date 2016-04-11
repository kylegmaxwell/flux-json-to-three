'use strict';

import test from 'tape';
import * as index from '../index.js';
import * as fixtures from './fixtures.js';
import FluxGeometryError from '../src/geometryError.js';

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
    "origin": [0,0,0],"primitive": "sphere","radius": 10}
    index.createObject(data, root);
    t.ok(root.mesh.children[0], 'createobject should create a mesh despite attributes');
    t.end();
});
