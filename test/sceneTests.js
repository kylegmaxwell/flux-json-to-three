'use strict';

var test = require('tape');
var THREE = require('three');

var index = require('../build/index-test.common.js');
var SceneBuilder = index.SceneBuilder;
var GeometryBuilder = index.GeometryBuilder;
var builder = new SceneBuilder(new GeometryBuilder());
var printError = require('./printError.js').init('scene');


/**
 * Get a scene at a predefined location
 *
 * @param  {String} name The file name without extension
 * @return {Object}      The module containing a Flux JSON scene
 */
function _getScene(name) {
    return require('./data/scene/'+name+'.json');
}

test('should create a scene with instanced geometry', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(_getScene('basicScene')).then(function (result) {
        var obj = result.getObject();
        t.ok(obj,'Object exists '+result.getErrorSummary());
        t.equal(obj.children.length,1,'One layer');
        t.equal(obj.children[0].children.length,3,'Three instances');
        t.end();
    }).catch(printError(t));
});

test('should create a scene with geometry elements', function (t) {
    // When value is set it should be parsed, and model will be updated
    var sphere = {"origin":[0,0,0],"primitive":"sphere","radius":10};
    builder.convert(sphere).then(function (result) {
        var obj = result.getObject().children[0];
        var count = obj.geometry.attributes.position.count;
        builder.convert(_getScene('entitiesScene')).then(function (result) {
            obj = result.getObject();
            t.ok(obj,'Object exists '+result.getErrorSummary());
            t.equal(obj.children.length,1,'One layer');
            t.equal(obj.children[0].children.length,1,'Merged spheres');
            t.equal(obj.children[0].children[0].geometry.attributes.position.count,count*2,'Two spheres');
            t.end();
        }).catch(printError(t));
    }).catch(printError(t));
});

test('should create a scene with curves, meshes and instances', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(_getScene('scene')).then(function (result) {
        var scene = result.getObject();
        t.ok(scene,'Scene exists: '+result.getErrorSummary());
        t.equal(scene.children.length, 2, 'Two layers')
        var types = ''
        scene.traverse(function (child) {
            types += child.type;
        });
        t.ok(types.indexOf('Line')!==-1,'Has a line')
        t.ok(types.indexOf('Mesh')!==-1,'Has a mesh')

        var plants = result._getObjectById('plants');
        var id = plants.children[0].geometry.id;
        for (var i=0;i<plants.children.length;i++) {
            t.equal(plants.children[i].geometry.id, id, 'Should share same geometry');
        }
        t.equal(result.getErrorSummary(),'','No errors');
        t.end();
    }).catch(printError(t));
});

test('should have an error message for bad entities', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(_getScene('badEntityScene')).then(function (result) {
        var scene = result.getObject();
        t.ok(scene,'Object exist');
        t.equal(scene.children.length, 1, 'One layer')
        var summary = result.getErrorSummary();
        t.ok(summary.indexOf('sphere:ball')!==-1,'Report error entity');
        t.ok(summary.indexOf('origin')!==-1,'Report error property');
        t.end();
    }).catch(printError(t));
});

test('should have an error message for bad layers', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(_getScene('badLayerScene')).then(function (result) {
        var scene = result.getObject();
        t.ok(!scene,'Object not exist');
        var summary = result.getErrorSummary();
        t.ok(summary.indexOf('ID')!==-1,'Message contains (ID): ('+summary+')');
        t.end();
    }).catch(printError(t));
});

test('layer manipulation', function (t) {
    builder.convert(_getScene('scene')).then(function (result1) {
        var scene = result1.getObject();
        t.ok(scene,'Object exist 1');
        result1.setElementVisible('concrete', false);
        builder.convert(_getScene('basicScene')).then(function (result) {
            t.ok(result.getObject(),'Object exist 2');
            result1.setElementColor('red'); // Expect that this has no effect, but does not error
            result.setElementVisible('concrete',true);
            t.end();
        }).catch(printError(t));
    }).catch(printError(t));
});

test('set twice', function (t) {
    builder.convert(_getScene('scene')).then(function (result1) {
        var scene = result1.getObject();
        t.ok(scene,'Object exist 1');
        builder.convert(_getScene('scene')).then(function (result) {
            t.ok(result.getObject(),'Object exist 2');
            t.end();
        }).catch(printError(t));
    }).catch(printError(t));
});

test('Set garbage', function (t) {
    builder.convert(_getScene('scene')).then(function (result1) {
        var scene = result1.getObject();
        t.ok(scene,'Object exist 1');
        // This is the scene objects, not data hence it should not work to generate anything
        builder.convert(scene).then(function (result) {
            t.ok(result.getObject()===null,'Junk in null out');
            t.end();
        }).catch(printError(t));
    }).catch(printError(t));
});

test('Valid assembly', function (t) {
    builder.convert(_getScene('validAssembly')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist: '+errors);
        t.equal(errors,'','No errors');
        t.end();
    }).catch(printError(t));
});

test('Should not allow cyclic references in assemblies', function (t) {
    builder.convert(_getScene('cyclicAssembly')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(!scene,'Object null');
        t.ok(errors.indexOf('Cycle')!==-1, 'Cycle not allowed: '+errors);
        t.end();
    }).catch(printError(t));
});

test('Should not allow instances of instances', function (t) {
    builder.convert(_getScene('cyclicInstance')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(!scene,'Object not exist');
        t.ok(errors.indexOf('instance')!==-1, 'Error message contents: '+errors);
        t.end();
    }).catch(printError(t));
});

test('Partially valid scene', function (t) {
    builder.convert(_getScene('partiallyValidScene')).then(function (result) {
        var scene = result.getObject();
        t.ok(scene,'Object exists');
        var errors = result.getErrorSummary();
        var id = 'sphere:ball2';
        t.ok(errors.indexOf(id)!==-1, 'Should have id ('+id+') in: ('+errors+')');
        var layer = result._getObjectById('plants');
        t.equal(layer.children.length,2,'Two instances');
        t.end();
    }).catch(printError(t));
});

test('Max scene with nulls', function (t) {
    builder.convert(_getScene('maxPanels')).then(function (result) {
        var scene = result.getObject();
        t.ok(scene,'Object exists');
        var errors = result.getErrorSummary();
        t.equal(errors,'','No errors');
        t.end();
    }).catch(printError(t));
});

test('mixedValidScenes', function (t) {
    builder.convert(_getScene('mixedValidScenes')).then(function (result) {
        var scene = result.getObject();
        t.ok(scene,'Object exists');
        var errors = result.getErrorSummary();
        t.ok(errors.indexOf('scene')!==-1,'Has issues');
        t.end();
    }).catch(printError(t));
});

var TOLERANCE = 0.000001;
test('Sphere with origin', function (t) {
    builder.convert(_getScene('sphereOriginScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist '+errors);
        var mesh = scene.children[0].children[0];
        var pos = mesh.geometry.attributes.position.array;
        var center = [0,0,0];
        var tmpV = new THREE.Vector3(0,0,0);
        var expectedV = new THREE.Vector3(-50.48976135253906,19.15716552734375,0);
        for (var i=0;i<pos.length;i+=3) {
            tmpV.x += pos[i];
            tmpV.y += pos[i+1];
            tmpV.z += pos[i+2];
        }
        tmpV.multiplyScalar(3.0/pos.length);
        tmpV.applyMatrix4(mesh.matrixWorld);
        t.ok(tmpV.sub(expectedV).length() < TOLERANCE, 'Center should have expected value');
        t.end();
    }).catch(printError(t));
});

test('Sphere with matrix', function (t) {
    builder.convert(_getScene('sphereMatrixScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist '+errors);
        var mesh = scene.children[0].children[0];
        var pos = mesh.geometry.attributes.position.array;
        var center = [0,0,0];
        var tmpV = new THREE.Vector3(0,0,0);
        var expectedV = new THREE.Vector3(-50.48976135253906,19.15716552734375,0);
        for (var i=0;i<pos.length;i+=3) {
            tmpV.x += pos[i];
            tmpV.y += pos[i+1];
            tmpV.z += pos[i+2];
        }
        tmpV.multiplyScalar(3.0/pos.length);
        tmpV.applyMatrix4(mesh.matrixWorld);
        t.ok(tmpV.sub(expectedV).length() < TOLERANCE, 'Center should have expected value');
        t.end();
    }).catch(printError(t));
});
