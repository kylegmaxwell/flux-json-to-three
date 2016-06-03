'use strict';

var test = require('tape');
var THREE = require('three/three.js');
var index = require('../build/index-test.common.js');
var GeometryResults = index.GeometryResults;

var fixturesUnits = require('../build/fixturesUnits.common.js');


test( 'Units translation', function ( t ) {
    var root = new GeometryResults();
    Object.keys(fixturesUnits).forEach(function (key) {
        var entity = fixturesUnits[key].start;
        entity = JSON.parse(JSON.stringify(entity));
        var succeedStr = fixturesUnits[key].succeed ? 'pass' : 'fail';
        var hasException = false;
        try {
            var matchesSchema = root.checkSchema(entity);
            t.ok(matchesSchema, "Should match schema");
            var entityNormalized = index.normalizeUnits(entity);
            t.deepEqual(entityNormalized, fixturesUnits[key].end, 'Convert '+key+' to meters.');
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
