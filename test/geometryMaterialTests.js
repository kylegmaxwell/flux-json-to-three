'use strict';

var test = require('tape-catch');
var index = require('../build/index-test.common.js');
var SceneBuilder = index.SceneBuilder;
var builder = new SceneBuilder('parasolid','ibl');
var THREE = require('three');

var printError = require('./printError.js').init('geometry material');

test('should merge multi colored objects', function (t) {
    var coloredPanels = [{"attributes":{"materialProperties":{"color":"red"}},"vertices":
        [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
        {"attributes":{"materialProperties":{"color":"blue"}},"vertices": [[-1,0,0],
        [0,1,0],[1,0,0],[0,-1,0]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"}];
    // When value is set it should be parsed, and model will be updated
    builder.convert(coloredPanels).then(function (result) {
        t.ok(result.getObject(),'Create a mesh');
        t.equal(result.getObject().children.length,1,'One child');
        var color = result.getObject().children[0].geometry.attributes.color.array;
        t.ok(color,'Color exists');

        // Check for red
        t.equal(color[0],1,'Color component r');
        t.equal(color[1],0,'Color component g');
        t.equal(color[2],0,'Color component b');

        // Check for blue
        t.equal(color[color.length-3],0,'Last color component r');
        t.equal(color[color.length-2],0,'Last color component g');
        t.equal(color[color.length-1],1,'Last color component b');

        t.end();
    }).catch(printError(t));
});

test('should not share attributes between material types', function (t) {
    var lineAndSurface= [{"origin":[0,0,0],"primitive":"circle","radius":10},
        {"vertices": [[-1,0,0],[0,1,0],[1,0,0],[0,-1,0]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"} ];
    // When value is set it should be parsed, and model will be updated
    builder.convert(lineAndSurface).then(function (result) {
        t.ok(result.getObject(),'Object exists');
        t.equal(result.getObject().children.length,2,'Two children');
        var children = result.getObject().children;
        // ordering is not guaranteed
        // Default line color is blue
        // Default mesh color is white
        // Thus we expect them to not be equal
        var color0 =  children[0].material.color;
        var color1 = children[1].material.color;
        // color should be white on material since its per vertex
        t.equal(color0.r,1,'color0 r');
        t.equal(color0.g,1,'color0 g');
        t.equal(color0.b,1,'color0 b');

        t.equal(color1.r,1,'color1 r');
        t.equal(color1.g,1,'color1 g');
        t.equal(color1.b,1,'color1 b');

        var vertColor0 =  children[0].geometry.attributes.color.array;
        var vertColor1 =  children[1].geometry.attributes.color.array;

        t.notEqual(vertColor0[0],vertColor1[0],'Color not same r');
        t.notEqual(vertColor0[1],vertColor1[1],'Color not same g');
        t.notEqual(vertColor0[2],vertColor1[2],'Color not same b');

        t.end();
    }).catch(printError(t));
});

test('should not merge objects with different opacity', function (t) {
        var twoPanels = [{"attributes":{"materialProperties":{"opacity":1}},"vertices":
        [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
        {"attributes":{"materialProperties":{"opacity":0.5}},"vertices": [[-1,0,0],
        [0,1,0],[1,0,0],[0,-1,0]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"} ];
    // When value is set it should be parsed, and model will be updated
    builder.convert(twoPanels).then(function (result) {
        t.ok(result.getObject(),'Object exists');
        t.equal(result.getObject().children.length,2,'Two children');
        var children = result.getObject().children;
        // ordering is not guaranteed
        // Thus we just check if opacity is not the same, since 0.5 !== 1
        t.notEqual(children[0].material.opacity,children[1].material.opacity,'Different opacity');
        t.end();
    }).catch(printError(t));
});

test('should set reflectivity when roughness is set', function (t) {
    var reflectivePanels = {"faces":[[0,3,1],[1,3,2]],"attributes":{"materialProperties":
        {"color": [0,1,1],"opacity":1,"roughness":0.1}},"primitive":"mesh",
        "vertices":[[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]]};
    // When value is set it should be parsed, and model will be updated
    builder.convert(reflectivePanels).then(function (result) {
        t.ok(result.getObject(),'Object exists');
        var mesh = result.getObject().children[0];
        t.notEqual(mesh.material.reflectivity,0,'Material nonzero reflectivity');
        t.end();
    }).catch(printError(t));
});

test('should pass through line properties', function (t) {
    var line = {"attributes":{"materialProperties":{"linewidth":5}},"end":[2,2,2],"primitive":"line","start":[1,1,1]};
    // When value is set it should be parsed, and model will be updated
    builder.convert(line).then(function (result) {
        t.ok(result.getObject(),'Object exists');
        var mesh = result.getObject().children[0];
        t.equal(mesh.material.linewidth,5,'Linewidth 5');
        t.end();
    }).catch(printError(t));
});

test('should pass through point color', function (t) {
    var point = {"attributes":{"materialProperties":{"color":[0.25,1,0.639],"size":4}},"point":[0,0,8.35],"primitive":"point"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(point).then(function (result) {
        t.ok(result.getObject(),'Object exists');
        var mesh = result.getObject().children[0].children[0];
        // Material is white
        t.equal(mesh.material.color.r,1,'Red is 1');
        // Point color is not white
        t.equal(mesh.geometry.attributes.color.array[0],0.25,'Red value');
        t.end();
    }).catch(function(err) {
        console.log(err);
        t.fail("Error caught");
        t.end();
    }).catch(printError(t));
});

test('should color lines', function (t) {
    var line = {"attributes":{"materialProperties":{"color":[0.25,1,0.639],"size":4}},
        "curves":[{"controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],"degree":3,
        "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"},{"degree":3,"knots":[0,0,0,0,14.1,14.1,14.1,14.1],
        "controlPoints":[[0,0,0],[-3.3,-3.3,0],[-6.6,-6.6,0],[-10,-10,0]],"primitive":"curve"},
        {"start":[1,0,0],"middle":[0,1,0],"end":[-1,0,0],"primitive":"arc"}],"primitive":"polycurve"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(line).then(function (result) {
        var meshes = result.getObject().children[0].children;
        for (var i=0;i<meshes.length;i++) {
            var mesh = meshes[i];
            // Material is white
            t.equal(mesh.material.color.r,1,'Red value 1');
            // Point color is not white
            if (mesh.geometry.colors) {
                t.equal(mesh.geometry.colors[0].r,0.25,'Red value');
            } else {
                t.equal(mesh.geometry.attributes.color.array[0],0.25,'Red value again');
            }
        }
        // This is important because when the line is converted to buffer
        // geometry the attribute needs to be populated from the colors array.
        // I'm not sure, but it seems that the renderer does this automatically.
        t.end();
    }).catch(printError(t));
});

test('should not modify text material', function (t) {
    var text = {"materialProperties":{"color":"red","size":4},
        "align":[0,0,0],"direction":[0,-1,100],"origin":[0,-7,1],
        "primitive":"text","size":8,"text":"Text!"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(text).then(function (result) {
        var material = result.getObject().children[0].material;
        t.equal(material.color.r,1,'Red value');
        t.equal(material.color.g,0,'Green value');
        t.end();
    }).catch(printError(t));
});

test('should allow color on object itself (legacy)', function (t) {
    var text = {"align":[0,0,0],"direction":[0,-1,100],"origin":[0,-7,1],
        "primitive":"text","size":8,"color":"black","text":"Text!"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(text).then(function (result) {
        var material = result.getObject().children[0].material;
        t.equal(material.color.r,0,'Red value');
        t.end();
    }).catch(printError(t));
});

test('should allow color as an array', function (t) {
    var text = {"materialProperties":{"color":[0.25,1,0.639],"size":4},
        "align":[0,0,0],"direction":[0,-1,100],"origin":[0,-7,1],
        "primitive":"text","size":8,"text":"Text!"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(text).then(function (result) {
        var material = result.getObject().children[0].material;
        t.equal(material.color.r,0.25,'Red value');
        t.end();
    }).catch(printError(t));
});

test('should not allow color as a number', function (t) {
    var circle = {"materialProperties":{"color":0.25},"origin":[0,0,0],"primitive":"sphere","radius":10};
    // When value is set it should be parsed, and model will be updated
    builder.convert(circle).then(function (result) {
        var summary = result.getErrorSummary();
        t.ok(result.getObject(),'Create a mesh '+summary);
        t.ok(summary.indexOf('color')!==-1,'Should have error about color');
        t.end();
    }).catch(printError(t));
});

test('should not merge different material parameters with the same value', function (t) {
    var panels = [{"attributes":{"materialProperties":{"reflectivity":1}},"vertices":
        [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
        {"attributes":{"materialProperties":{"glossiness":1}},"vertices": [[-1,0,0],
        [0,1,0],[1,0,0],[0,-1,0]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"}];
    builder.convert(panels).then(function (result) {
        t.ok(result.getObject(),'Create a mesh');
        t.equal(result.getObject().children.length,2,'Two children');
        t.end();
    }).catch(printError(t));
});

test('should not merge material parameters with falsy value', function (t) {
    // transparency of 1 leads to opacity 0, which is falsy
    var panels = [{"attributes":{"materialProperties":{"transparency":1}},"vertices":
        [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"},
        {"attributes":{"materialProperties":{}},"vertices": [[-1,0,0],
        [0,1,0],[1,0,0],[0,-1,0]],"faces":[[0,3,1],[1,3,2]],"primitive":"mesh"}];
    builder.convert(panels).then(function (result) {
        t.ok(result.getObject(),'Create a mesh');
        t.equal(result.getObject().children.length,2,'Two children');
        t.end();
    }).catch(printError(t));
});


test('should default to double sided', function (t) {
    var mesh = {"vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]], "primitive":"mesh"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(mesh).then(function (result) {
        var summary = result.getErrorSummary();
        var obj = result.getObject();
        t.ok(obj,'Create a mesh '+summary);
        t.equal(THREE.DoubleSide, obj.children[0].material.side, 'Default to double side');
        t.end();
    }).catch(printError(t));
});

test('should be able to set side to front', function (t) {
    var sphere = {"materialProperties":{"side":THREE.FrontSide},
        "origin":[0,0,0],"primitive":"sphere","radius":10};
    // When value is set it should be parsed, and model will be updated
    builder.convert(sphere).then(function (result) {
        var summary = result.getErrorSummary();
        var obj = result.getObject();
        t.ok(obj,'Create a mesh '+summary);
        t.equal(obj.children[0].material.side, THREE.FrontSide, 'Set to zero');
        t.end();
    }).catch(printError(t));
});

test('Solid objects should render front side only', function (t) {
    var sphere = {"origin":[0,0,0],"primitive":"sphere","radius":10};
    // When value is set it should be parsed, and model will be updated
    builder.convert(sphere).then(function (result) {
        var summary = result.getErrorSummary();
        var obj = result.getObject();
        t.ok(obj,'Create a mesh '+summary);
        t.equal(THREE.FrontSide, obj.children[0].material.side, 'Is front side');
        t.end();
    }).catch(printError(t));
});

test('Solid flagged objects should render front side only', function (t) {
    var mesh = {"isSolid":true,"vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"};
    // When value is set it should be parsed, and model will be updated
    builder.convert(mesh).then(function (result) {
        var summary = result.getErrorSummary();
        var obj = result.getObject();
        t.ok(obj,'Create a mesh '+summary);
        t.equal(THREE.FrontSide, obj.children[0].material.side, 'Is double side');
        t.end();
    }).catch(printError(t));
});

test('Test material creation', function (t) {
    var data = {
        color: 'black',
        emissionColor: 'yellow',
        side:THREE.DoubleSide
    };
    var material = index.createMaterial(index.MATERIAL_TYPES.SURFACE, data);
    t.ok(material.isMaterial,'Made a material');
    t.deepEqual(material.color, { r: 0, g: 0, b: 0 }, "Color is black");
    t.deepEqual(material.emissive, { r: 1, g: 1, b: 0 }, "Emissive is yellow");
    t.end();
});
