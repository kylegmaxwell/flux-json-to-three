'use strict';

var test = require('tape');
var THREE = require('three/three.js');
var GeometryBuilder = require('../build/index-test.common.js').GeometryBuilder;

var builder = new GeometryBuilder('parasolid','ibl');

// List of xhr requests made per test
var requests = [];

// Mock out xhr for brep async tessellation request
global.XMLHttpRequest = function () {
    this.method='';
    this.url='';
    this.requestBody='';
};
XMLHttpRequest.prototype.open = function (method, url) {
    this.method = method;
    this.url = url;
};
XMLHttpRequest.prototype.setRequestHeader = function () {};
XMLHttpRequest.prototype.send = function (data) {
    this.requestBody = data;
    requests.push(this);
};
XMLHttpRequest.prototype.respond = function (status, headers, body) {
    this.status = status;
    this.readyState = 4;
    this.responseText = body;
    this.onreadystatechange();
};


test('should make requests for brep', function (t) {
    requests = [];
    // When value is set it should be parsed, and model will be updated
    builder.convert({"content":"some base64 encoded stuff","format":"x_b","primitive":"brep"}).then(function(result) {
        // Result was of type stl, but the vertices will be empty since it was fake
        t.equal(result.mesh.children[0].type,'Mesh','Should create mesh');
        t.end();
    });
        // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should make a request');
        var fakeXhr = requests[0];
        t.ok(fakeXhr.url.indexOf('parasolid')!==-1,'Should call parasolid');

        t.ok(fakeXhr.requestBody.indexOf('brep')!==-1,'Should contain brep');

        var headers = "HTTP/1.1 200 OK";
        var body = '{"Output":{"Results":{"type":"PARASOLID/ResultSet","value":{"result0":{"content":"","format":"stl","primitive":"brep"}}}},"Errors":null}';
        fakeXhr.respond(200, headers, body);
    });
});

test('should handle server errors', function (t) {
    requests = [];
    // When value is set it should be parsed, and model will be updated
    builder.convert({"content":"some base64 encoded stuff","format":"x_b","primitive":"brep"}).then(function (result) {
            t.ok(result.primStatus.invalidKeySummary().indexOf("ERROR")!==-1, 'Should handle an error');
            t.end();
        });
        // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should have a result');
        var fakeXhr = requests[0];
        var headers = "HTTP/1.1 200 OK";
        var body ='{"Output":{},"Errors":{"7d986a8b64":{"Name":"Block Worker Sent Error Packet.","ElementIds":[],"Message":"ERROR\\n at Inputs/0/Value/Entities/result0\\n","Severity":"critical"}}}';
        fakeXhr.respond(200, headers, body);
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
    });
    // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should have a result');
        var fakeXhr = requests[0];
        var headers = "HTTP/1.1 504 Gateway Timeout";
        fakeXhr.respond(504, headers,'It should have a server error!');
    });
});

var stlB64 = "c29saWQgMQogZmFjZXQgbm9ybWFsIDAuMjgyMTk2ICAtMC45NTg1IC0wLjA0MDU0MzMKICBvdXRlciBsb29wCiAgIHZlcnRleCAgNjQyNTYuNyAgODQ4Mi4zNiAgMTMyMDguOAogICB2ZXJ0ZXggIDY0NzU5LjMgIDg2NDQuNDYgIDEyODc0LjcKICAgdmVydGV4ICA2NDgwOC40ICA4NjE4LjI3ICAxMzgzNS41CiAgZW5kbG9vcAogZW5kZmFjZXQ=";
var stlResponse = {"Output":{"Results":{"type":"PARASOLID/ResultSet","value":{"result0":{
    "attributes":{"materialProperties":{"color":"red","wireframe":false}},
    "content":stlB64,
    "format":"stl","primitive":"brep"}}}},"Errors":null};
var stlQuery = {"attributes":{"materialProperties":{"color":"red","wireframe":false}},"content":"some base64 encoded stuff","format":"x_b","primitive":"brep"}

test('render breps with materials', function (t) {
    requests = [];
    // When value is set it should be parsed, and model will be updated
    builder.convert(stlQuery).then(function(result) {
        var mesh = result.mesh.children[0];
        t.equal(mesh.type,'Mesh','Should create mesh');
        t.equal(mesh.geometry.attributes.position.array.length,9,'Should have 3 points');
        var c = mesh.geometry.attributes.color.array;
        t.deepEqual([c[0],c[1],c[2]],[1,0,0],'Should have red color');
        t.end();
    });
        // Wait for async convert internals
    setTimeout(function() {
        t.equal(requests.length,1,'Should make a request');
        var fakeXhr = requests[0];
        t.ok(fakeXhr.url.indexOf('parasolid')!==-1,'Should call parasolid');

        t.ok(fakeXhr.requestBody.indexOf('brep')!==-1,'Should contain brep');

        var headers = "HTTP/1.1 200 OK";
        var body = JSON.stringify(stlResponse);
        fakeXhr.respond(200, headers, body);
    });
});