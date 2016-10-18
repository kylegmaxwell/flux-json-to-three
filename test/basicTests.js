'use strict';

var test = require('tape-catch');
var THREE = require('three');
var index = require('../build/index-test.common.js');
var FluxGeometryError = index.FluxGeometryError;

test('Test three', function (t) {
    t.ok(true, 'Can run a test');
    var vec = new THREE.Vector3(1,2,3);
    t.equal(vec.x,1,'Vector x');
    t.equal(vec.lengthSq(),1+4+9, 'Vector length');

    var camera = new THREE.PerspectiveCamera( 45, 1.0, 1, 1000 );
    t.equal(camera.far, 1000, 'Camera far');

    t.end();
});

test( 'Error handling', function ( t ) {
    var hasError = false;
    try {
        throw new FluxGeometryError();
    } catch (e) {
        t.equal(e.name, 'FluxGeometryError', 'Errors should be named FluxGeometryError.');
        hasError = true;
    }

    t.equal(hasError, true, 'Should throw errors when appropriate.');
    t.end();
});
