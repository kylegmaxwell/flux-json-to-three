'use strict';

/**
 * All the functions in this module wrap functionality that differs
 * between browsers and tests, so that other code can see a consistent
 * interface and reliance on globals is isolated.
 */

import fluxFetchReal from '@flux/flux-fetch';

/**
 * Wrapper around flux fetch, which assumes a stub when running tests.
 * @param  {String} url     Resource to request via HTTP
 * @param  {Object} options Collection of key value parameters
 * @return {Promise}         Promise to return headers object
 */
export function fluxFetch(url, options) {
    var xhrPromise;
    if ('${ENVIRONMENT}' === 'BROWSER') {
        xhrPromise = fluxFetchReal(url, options);
    }
    if ('${ENVIRONMENT}' === 'TEST') {
        xhrPromise = fluxFetchStub(url, options); // eslint-disable-line no-undef
    }
    return xhrPromise;
}

/**
 * Convert base64 data to binary (which is usually a binary encoded string)
 * @param  {String} str64 Base 64 encoded data
 * @return {String}       Decoded result
 */
export function atob(str64) {
    var strAscii;
    if ('${ENVIRONMENT}' === 'BROWSER') {
        strAscii = window.atob(str64);
    }
    if ('${ENVIRONMENT}' === 'TEST') {
        // This implementation only works in node.js
        strAscii = new Buffer(str64, 'base64').toString('binary');
    }
    return strAscii;
}

/**
 * Create a canvas element if possible
 * @return {DOMElement} The canvas or null
 */
export function createCanvas() {
    var canvas = null;
    if ('${ENVIRONMENT}' === 'BROWSER') {
        canvas = document.createElement( 'canvas' );
    }
    return canvas;
}
