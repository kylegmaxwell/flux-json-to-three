'use strict';

/* eslint-disable no-constant-condition */

/**
 * All the functions in this module wrap functionality that differs
 * between browsers and tests, so that other code can see a consistent
 * interface and reliance on globals is isolated.
 */

import fluxFetchReal from 'flux-fetch';

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
