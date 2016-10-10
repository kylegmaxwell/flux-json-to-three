'use strict';

var test = require('tape');
var index = require('../build/index-test.common.js');
var FluxGeometryError = index.FluxGeometryError;
var fixturesUnits = require('../build/fixturesUnits.common.js');

test( 'Units translation', function ( t ) {
    Object.keys(fixturesUnits).forEach(function (key) {
        console.log('Fixture: '+key);
        var entity = index.cleanElement(fixturesUnits[key].start);
        var succeedStr = fixturesUnits[key].succeed ? 'pass' : 'fail';
        var hasException = false;
        try {
            t.deepEqual(entity, fixturesUnits[key].end, 'Convert '+key+' to meters.');
        } catch (err) {
            hasException = true;
            console.log(err.message);
            console.log(err.stack);
            t.equal(err.constructor, FluxGeometryError);
            if (fixturesUnits[key].succeed) {
                console.error(err.message);
            }
        }
        t.equal(!hasException, fixturesUnits[key].succeed, 'Unit normalization should '+succeedStr+' for '+key+'.');
    });
    t.end();
});
