'use strict';
require('./globals.js');

var test = require('tape-catch');
var THREE = require('three');
var width = 200, height = width;
var gl = require('gl')(width, height);
var PNG = require('pngjs').PNG;
var Datauri = require('datauri');
var index = require('../build/index-test.common.js');
var SceneBuilder = index.SceneBuilder;
var builder = new SceneBuilder('parasolid','ibl');
var fixtures = [ 'mesh', 'sphere'];

/**
 * Get the lighting rig used to render the images
 * @return {THREE.Object3D}  Object containing lights
 */
function getLighting() {
    var lighting = new THREE.Object3D();
    lighting.name = 'Lights';

    var keyLight = new THREE.DirectionalLight();
    keyLight.position.set(60, 80, 50);
    keyLight.intensity = 2.95;
    lighting.add(keyLight);

    var backLight = new THREE.DirectionalLight();
    backLight.position.set(-250, 50, -200);
    backLight.intensity = 1.7;
    lighting.add(backLight);

    var fillLight = new THREE.DirectionalLight();
    fillLight.position.set(-500, -500, 0);
    fillLight.intensity = 0.9;
    lighting.add(fillLight);

    return lighting;
}

/**
 * A fixed camera for rendering always from the same view
 * @return {THREE.Camera}  The positioned camera
 */
function getCamera() {
    var camera = new THREE.PerspectiveCamera( 75, width/height, 0.1, 1000 );
    // Hard coded view for sphere-surface
    camera.position.set(41.68026434272226, 16.630155636702536, 21.619202327713296);
    camera.rotation.set(-0.6556956361792811, 0.990180631834331, 2.314549157036545);
    return camera;
}

/**
 * Extract png data from a data uri string
 * @param  {String} string  Data uri string containing base64 png
 * @return {Promise}        Promise to return PNG
 */
function parsePng(string) {
    var regex = /^data:.+\/(.+);base64,(.*)$/;
    var matches = string.match(regex);
    var ext = matches[1];
    var data = matches[2];
    var buffer = new Buffer(data, 'base64');
    if (ext !== 'png') {
        throw new Error('Expected png data, but got '+ext);
    }
    return new Promise(function(resolve, reject) {
        new PNG({ filterType:4 }).parse( buffer, function(error, data) {
            if (error != null) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Get color values from PNG data into a vector
 * @param  {Buffer} data RGBA pixel buffer
 * @param  {Number} idx  Starting index for the color
 * @param  {THREE.Vector4} vec  Container for color
 */
function dataToVec(data, idx, vec) {
    vec.set(data[idx], data[idx+1], data[idx+2], data[idx+3]);
    vec.multiplyScalar(1.0/255.0);
}

/**
 * Set color values from vector into PNG buffer
 * @param  {Buffer} data RGBA pixel buffer
 * @param  {Number} idx  Starting index for the color
 * @param  {THREE.Vector4} vec  Color vector
 */
function vecToData(data, idx, vec) {
    vec.multiplyScalar(255.0).floor();
    data[idx] = vec.x;
    data[idx+1] = vec.y;
    data[idx+2] = vec.z;
    data[idx+3] = vec.w;
}

// Static variables to save on memory allocation
var eColor = new THREE.Vector4();
var aColor = new THREE.Vector4();
var tmpColor = new THREE.Vector4();

/**
 * Compare two image objects for approximate equivalence
 * @param  {Tape} t        The global test object
 * @param  {PNG} expected  The expected result for the image
 * @param  {PNG} actual    The actual generated PNG
 */
function comparePng(t, expected, actual) {
    t.equal(expected.height, actual.height, 'Height should match');
    t.equal(expected.width, actual.width, 'Width should match');
    var badPixels = [];
    var png = new PNG({width: width, height: height});
    for (var y = 0; y < expected.height; y++) {
       for (var x = 0; x < expected.width; x++) {
            var idx = (expected.width * y + x) << 2;
            dataToVec(expected.data, idx, eColor);
            dataToVec(actual.data, idx, aColor);
            // Check if the pixels are different
            tmpColor.copy(eColor).sub(aColor);
            if (tmpColor.length() > 0.01) {
                badPixels.push([x, y]);
                tmpColor.set(1,0,1,1);
                vecToData(png.data, idx, tmpColor);
            } else {
                vecToData(png.data, idx, aColor);
            }
       }
   }
   t.equal(badPixels.length, 0, 'No bad pixels');

   if (badPixels.length > 0) {
       console.log('Image comparison failed:');
       console.log(pngToStr(png));
       console.log('Actual image:');
       console.log(pngToStr(actual));
   }
}

/**
 * Convert a PNG object to a base64 data uri
 * @param  {PNG} png    Image object
 * @return {String}     Encoded image
 */
function pngToStr(png) {
    var datauri = new Datauri();
    var buf = PNG.sync.write(png);
    datauri.format('.png', buf);
    return datauri.content;
}

/**
 * Extract the pixels from the global gl object's frame buffer and store them in memory as a png
 * @param  {PNG} png Destination image
 */
function glToPng(png) {
    var pixels = new Uint8Array(4 * width * height);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // The GL y is reversed from the PNG y so mirror accordingly.
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            for (var i = 0; i < 4; i++) {
                png.data[4*(x + y*width) + i] = pixels[4*(x + (height-y-1)*width) + i];
            }
        }
    }
}

/**
 * Create a simple scene containing the object to render
 * @param  {THREE.Object3D} obj The object of interest
 * @return {THREE.Scene}     New scene
 */
function createScene(obj) {
    var scene = new THREE.Scene();
    var lighting = getLighting();
    scene.add(lighting);
    scene.add(obj);
    return scene;
}

/**
 * Create a renderer with a fake canvas that returns the headless gl context
 * @return {THREE.WebGLRenderer}  Object to create images from scenes
 */
function createRenderer() {
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
        canvas: {
            getContext: function() {
                return gl;
            }
        }
    });
    renderer.setClearColor(0xFAFAFA);
    renderer.physicallyCorrectLights = true;
    return renderer;
}

test( 'Render headless', function ( t ) {
    console.log('GL exists?',gl!=null, gl.VERSION);
    var renderer = createRenderer();
    t.ok(renderer,'Made a renderer');
    var promises = [];
    fixtures.forEach(function(fixture) {
        promises.push(new Promise(function (resolve, reject) {
            parsePng(require('./data/'+fixture+'Image.json')).then(function(expected) {
                builder.convert(require('./data/'+fixture+'.json')).then(function (result) {
                    try{
                        var scene = createScene(result.getObject());
                        var camera = getCamera();
                        renderer.render(scene, camera);
                        var png = new PNG({width: width, height: height});
                        glToPng(png);
                        comparePng(t, expected, png);
                        resolve();
                    }catch(err) {
                        console.log(err);
                        reject();
                    }
                });
            });
        }));
    });
    Promise.all(promises).then(function () {
       t.end();
    });
});
