

'use strict'

import test from 'tape';
import createObject from '../index.js'
import * as fixtures from './fixtures.js';

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
