'use strict';

// Three.js image loader tries to create an image element and add a listener
// so we have to stub that out.
global.document = global;

// Stub createElement for THREE.ImageLoader
global.createElement = function () {
    var el = {
        addEventListener: function (name, cb) {
            cb();
        },
        // Imitate <img> tag src and onload properties
        set onload (loadFn) {
            this.loadFn = loadFn;
        },
        set src (x) {
            if (this.loadFn) {
                this.loadFn();
            }
        }
    };
    return el;
};
global.createElementNS = global.createElement;

global.URL = {
    revokeObjectURL: function () {}
};

// Stub XHR for THREE.ImageLoader
global.XMLHttpRequest = function () {
    return {
        addEventListener: function (a, cb) {this.cb = cb;},
        open: function () {},
        send: function () {this.cb();},
        overrideMimeType: function () {}
    };
};

global.self = global;
