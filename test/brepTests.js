'use strict';

var test = require('tape');
var THREE = require('three');
var GeometryBuilder = require('../build/index-test.common.js').GeometryBuilder;

var builder = new GeometryBuilder('parasolid','ibl','token');

var printError = require('./printError.js').init('brep');

// List of xhr requests made per test
var requests = [];

// Three.js image loader tries to create an image element and add a listener
// so we have to stub that out.
global.document = global;
global.createElement = function () {
    return {
        addEventListener: function (name, cb) {
            cb();
        }
    }
};

// Mock out xhr for brep async tessellation request
global.fluxFetchStub = function (url, opts) {
    return new Promise(function (resolve, reject) {
        opts.resolve = resolve;
        opts.reject = reject;
        requests.push(new FetchStub(url, opts));
    });
}

function FetchStub(url, opts) {
    this.method = opts.method;
    this.url = url;
    this.requestBody = opts.body;
    this.resolve = opts.resolve;
    this.reject = opts.reject;
    this.status = 102;
};

FetchStub.prototype.respond = function (status, responseBody) {
    this.status = status;
    if (this.status === 200) {
        this.body = Promise.resolve(responseBody);
        this.resolve(this);
    } else {
        this.body = Promise.resolve(responseBody);
        this.resolve(this);
    }
};

test('should make requests for brep', function (t) {
    requests = [];
    // When value is set it should be parsed, and model will be updated
    builder.convert({"content":"some base64 encoded stuff","format":"x_b","primitive":"brep"}).then(function(result) {
        // Result was of type stl, but the vertices will be empty since it was fake
        t.equal(result.object.children[0].type,'Mesh','Should create mesh');
        t.end();
    }).catch(printError(t));
        // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should make a request');
        var fakeXhr = requests[0];
        t.ok(fakeXhr.url.indexOf('parasolid')!==-1,'Should call parasolid');
        t.ok(JSON.stringify(fakeXhr.requestBody).indexOf('brep')!==-1,'Should contain brep');

        var body = '{"Output":{"Results":{"type":"PARASOLID/ResultSet","value":{"result0":{"attributes":{"materialProperties":{"color":"gold","wireframe":false}},"faces":[[0,1,2]],"primitive":"mesh","units":{"vertices":"meters"},"vertices":[[-30,0,-10],[-29.0,-2.4,-9.9],[-29.0,-0.1,-9.9]]}}}},"Errors":null}';
        fakeXhr.respond(200, body);
    });
});

test('should handle server errors', function (t) {
    requests = [];
    // When value is set it should be parsed, and model will be updated
    builder.convert({"content":"some base64 encoded stuff","format":"x_b","primitive":"brep"}).then(function (result) {
            t.ok(result.primStatus.invalidKeySummary().indexOf("ERROR")!==-1, 'Should handle an error');
            t.end();
        }).catch(printError(t));
        // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should have a result');
        var fakeXhr = requests[0];
        var body ='{"Output":{},"Errors":{"7d986a8b64":{"Name":"Block Worker Sent Error Packet.","ElementIds":[],"Message":"ERROR\\n at Inputs/0/Value/Entities/result0\\n","Severity":"critical"}}}';
        fakeXhr.respond(200, body);
    });
});

test('should handle errored servers', function (t) {
    requests = [];
    // When value is set it should be parsed, and model will be updated
    builder.convert({"content":"some base64 encoded stuff","format":"x_b","primitive":"brep"}).then(function (result) {
        t.ok(Object.keys(result.primStatus.errors).length > 0, 'Should have at least 1 error');
        t.ok(typeof(result.primStatus.invalidKeySummary())==='string','Summary should be a string');
        t.ok(result.primStatus.invalidKeySummary().toLowerCase().indexOf('server')!==-1,'Should describe server error');
        t.end();
    }).catch(printError(t));
    // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should have a result');
        var fakeXhr = requests[0];
        fakeXhr.respond(504,'It should have a server error!');
    });
});

var stlResponse = {"Output":{"Results":{"type":"PARASOLID/ResultSet","value":{"result0":{"attributes":{"materialProperties":{"color":[1,0,0],"wireframe":false}},"faces":[[0,1,2]],"primitive":"mesh","units":{"vertices":"meters"},"vertices":[[-30,0,-10],[-29.0,-2.4,-9.9],[-29.0,-0.1,-9.9]]}}}},"Errors":null};
var stlQuery = {"attributes":{"materialProperties":{"color":"red","wireframe":false}},"content":"some base64 encoded stuff","format":"x_b","primitive":"brep"}

test('render breps with materials', function (t) {
    requests = [];
    // When value is set it should be parsed, and model will be updated
    builder.convert(stlQuery).then(function(result) {
        var mesh = result.object.children[0];
        t.equal(mesh.type,'Mesh','Should create mesh');
        t.equal(mesh.geometry.attributes.position.array.length,9,'Should have 3 points');
        var c = mesh.geometry.attributes.color.array;
        t.deepEqual([c[0],c[1],c[2]],[1,0,0],'Should have red color');
        t.end();
    }).catch(printError(t));
        // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should make a request');
        var fakeXhr = requests[0];
        t.ok(fakeXhr.url.indexOf('parasolid')!==-1,'Should call parasolid');

        t.ok(JSON.stringify(fakeXhr.requestBody).indexOf('brep')!==-1,'Should contain brep');

        var body = JSON.stringify(stlResponse);
        fakeXhr.respond(200, body);
    });
});