'use strict';

var test = require('tape-catch');
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

test('should create a scene with instanced points', function (t) {
    builder.convert(_getScene('pointScene')).then(function (result) {
        var obj = result.getObject();
        t.ok(obj,'Object exists '+result.getErrorSummary());
        t.equal(obj.children.length,1,'One layer');
        t.equal(obj.children[0].children.length,3,'Three instances');
        // Check if geometry exists - layer / instance / points
        t.ok(obj.children[0].children[0].children[0],'Instance 1 geometry exists '+result.getErrorSummary());
        t.ok(obj.children[0].children[1].children[0],'Instance 2 geometry exists '+result.getErrorSummary());
        t.ok(obj.children[0].children[2].children[0],'Instance 3 geometry exists '+result.getErrorSummary());
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
            // layer / instance / mesh / geometry
            t.equal(obj.children[0].children[0].children[0].geometry.attributes.position.count,
                count*2,'Two spheres');
            t.end();
        }).catch(printError(t));
    }).catch(printError(t));
});

test('should create a scene with curves, meshes and instances', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(_getScene('scene')).then(function (result) {
        var scene = result.getObject();
        t.ok(scene,'Scene exists: '+result.getErrorSummary());
        t.equal(scene.children.length, 2, 'Two layers');
        var types = '';
        scene.traverse(function (child) {
            types += child.type;
        });
        t.ok(types.indexOf('Line')!==-1,'Has a line');
        t.ok(types.indexOf('Mesh')!==-1,'Has a mesh');

        var plants = result._getObjectById('plants');
        // layer / instance / mesh / geometry
        var id = plants.children[0].children[0].geometry.id;
        for (var i=0;i<plants.children.length;i++) {
            t.equal(plants.children[i].children[0].geometry.id, id, 'Should share same geometry');
        }
        t.equal(result.getErrorSummary(),'','No errors');
        t.end();
    }).catch(printError(t));
});

test('should have an error message for bad entities', function (t) {
    // When value is set it should be parsed, and model will be updated
    builder.convert(_getScene('badEntityScene')).then(function (result) {
        var scene = result.getObject();
        t.ok(!scene,'Object not exist');
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
        t.ok(scene,'Object exist');
        var summary = result.getErrorSummary();
        t.ok(summary.indexOf('plants')!==-1,'Message contains id (plants): ('+summary+')');
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

test('Valid group', function (t) {
    builder.convert(_getScene('validGroup')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist: '+errors);
        t.equal(errors,'','No errors');
        t.end();
    }).catch(printError(t));
});

test('Should not allow cyclic references in groups', function (t) {
    builder.convert(_getScene('cyclicGroup')).then(function (result) {
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

var TOLERANCE = 0.000001;
test('Sphere with origin', function (t) {
    builder.convert(_getScene('sphereOriginScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist '+errors);
        // layer / instance / mesh / geometry
        var mesh = scene.children[0].children[0].children[0];
        var pos = mesh.geometry.attributes.position.array;
        var tmpV = new THREE.Vector3(0,0,0);
        var expectedV = new THREE.Vector3(-50.48976135253906,19.15716552734375,0);
        for (var i=0;i<pos.length;i+=3) {
            tmpV.x += pos[i];
            tmpV.y += pos[i+1];
            tmpV.z += pos[i+2];
        }
        tmpV.multiplyScalar(3.0/pos.length);
        mesh.updateMatrixWorld(true);
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
        var mesh = scene.children[0].children[0].children[0];
        var pos = mesh.geometry.attributes.position.array;
        var tmpV = new THREE.Vector3(0,0,0);
        var expectedV = new THREE.Vector3(-50.48976135253906,19.15716552734375,0);
        for (var i=0;i<pos.length;i+=3) {
            tmpV.x += pos[i];
            tmpV.y += pos[i+1];
            tmpV.z += pos[i+2];
        }
        tmpV.multiplyScalar(3.0/pos.length);
        mesh.updateMatrixWorld(true);
        tmpV.applyMatrix4(mesh.matrixWorld);
        t.ok(tmpV.sub(expectedV).length() < TOLERANCE, 'Center should have expected value');
        t.end();
    }).catch(printError(t));
});

test('Layer with visible', function (t) {
    builder.convert(_getScene('layerVisibleScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist '+errors);
        // order is not guaranteed, so assert that at least one must be hidden
        var hidden = scene.children[0].visible === false || scene.children[1].visible === false;
        t.equal(hidden, true, 'Layer should not be visible');
        t.end();
    }).catch(printError(t));
});

var materialScenes = [{
        scene: 'materialScene',
        results: [[1,0,0]]
    },{
        scene: 'materialPolyCurveScene',
        results: [[1,0,0]]
    },{
        scene: 'materialGroupScene',
        results: [[0,1,0]]
    },{
        scene: 'materialNesting',
        // TODO(Kyle) This depends on order, but it is not guaranteed
        results: [[0,1,0],[1,0,1]]
    }
];
materialScenes.forEach(function (sceneData) {
    test('Scene material '+sceneData.scene, function (t) {
        var sceneJson = _getScene(sceneData.scene);
        builder.convert(sceneJson).then(function (result) {
            var scene = result.getObject();
            var errors = result.getErrorSummary();
            t.ok(scene,'Object exist '+errors);
            var colors = [];
            var i;
            for (i=0;i<sceneData.results.length;i++) {
                colors.push(0);
            }
            scene.traverse(function (child) {
                if (child.material) {
                    var c1 = child.material.color.toArray();
                    // for each result check if that color is present
                    for (i=0;i<sceneData.results.length;i++) {
                        var c2 = sceneData.results[i];
                        if (c1[0]===c2[0]&&c1[1]===c2[1]&&c1[2]===c2[2]) {
                            colors[i]++;
                        }
                    }
                }
            });
            // expect all colors present
            for (i=0;i<sceneData.results.length;i++) {
                t.ok(colors[i]>0,'Color '+sceneData.results[i]+' must be found');
            }
            t.end();
        }).catch(printError(t));
    });
});

test('Layer with color', function (t) {
    builder.convert(_getScene('colorLine')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist '+errors);
        var layer = scene.children[0];
        t.deepEqual(layer.children[0].children[0].material.color.toArray(),
            [1,0.5,0], 'Should have orange color material');
        var color = layer.children[0].children[0].geometry.attributes.color.array;
        var white = true;
        for (var i=0;i<color.length;i++) {
            if (color[i] !== 1) {
                white = false;
            }
        }
        t.ok(white,'Color is reset');
        t.end();
    }).catch(printError(t));
});

test('dvp scene', function (t) {
    builder.convert(_getScene('dvpScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist');
        t.equal('',errors, 'No errors');
        t.end();
    }).catch(printError(t));
});

test('Non rigid transform', function (t) {
    builder.convert(_getScene('nonRigidBox')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist');
        t.equal('',errors, 'No errors');
        var instance = scene.children[0].children[0];
        t.deepEqual(instance.matrix.elements, Float32Array.from([
            1, 0, 0, 0,
            0, 2.5762698650360107, -0.5232527852058411, 0,
            0, 1.581878423690796, 0.8521774411201477, 0,
            -21.286401748657227, 14.147518157958984, 20.4000244140625, 1
        ]),'Should not corrupt matrix');
        t.end();
    }).catch(printError(t));
});

test('texture scene', function (t) {
    builder.convert(_getScene('textureScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist');
        t.equal('',errors, 'No errors');
        // scene > layer > instance > mesh > material > map
        t.ok(scene.children[0].children[0].children[0].material.map, 'Material has map');
        t.end();
    }).catch(printError(t));
});

test('sketchup scene', function (t) {
    builder.convert(_getScene('sketchupScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist');
        t.equal('',errors, 'No errors');
        // scene > layer > instance > mesh > material > map
        t.ok(scene.children[0].children[0].children[0].material.map, 'Material has map');
        t.equal(scene.children[0].children[0].children[0].material.map.wrapS,THREE.RepeatWrapping, 'Material is set to repeat');
        t.end();
    }).catch(printError(t));
});

test('mesh scene', function (t) {
    builder.convert(_getScene('textureMeshScene')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist');
        t.equal('',errors, 'No errors');
        // scene > layer > instance > mesh > material > map
        t.ok(scene.children[0].children[0].children[0].material.map, 'Material has map');
        t.equal(scene.children[0].children[0].children[0].material.map.repeat.x, 2, 'Material has scale');
        t.equal(scene.children[0].children[0].children[0].material.map.offset.x, 0.5, 'Material has offset');
        t.end();
    }).catch(printError(t));
});

test('scene with camera', function (t) {
    builder.convert(_getScene('cameraLightBox')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist');
        t.equal('',errors, 'No errors');
        var camera;
        scene.traverse(function (child) {
            if (child.userData.primitive === 'camera') {
                camera = child;
            }
        });
        t.ok(camera != null, 'Scene has camera');
        t.equal(camera.type, 'PerspectiveCamera', 'Camera is a camera');
        t.end();
    }).catch(printError(t));
});

test('geometryList with texture', function (t) {
    builder.convert(_getScene('tree')).then(function (result) {
        var scene = result.getObject();
        var errors = result.getErrorSummary();
        t.ok(scene,'Object exist');
        t.equal('',errors, 'No errors');
        var meshCount = 0;
        scene.traverse(function (child) {
            if (child.userData.primitive === 'mesh') {
                t.ok(child.geometry.attributes.uv, 'it has uv');
                meshCount++;
            }
        });
        // Make sure traverse found something to test
        t.ok(meshCount > 0, 'Scene has mesh');
        t.end();
    }).catch(printError(t));
});
