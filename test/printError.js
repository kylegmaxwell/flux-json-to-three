'use strict';

/**
 * Generate a callback for failed promises that prints errors.
 * Prints the error stack and ends the tape test.
 * @param  {Tape} t Tape test manager object
 * @param  {String} name Name of the failed test
 * @return {Function}   Callback function taking an Error argument
 */
function _printError(t, name) {
    return function (err) {
        console.log(err.stack);
        t.error('An error was thrown in '+name+' test.');
        t.end();
    };
}

/**
 * Build a function that prints errors with a pre fixed message
 * @param  {String} name The name of the test suite to add to the message
 * @return {Function}      Function that returns an error handling function
 */
function init(name) {
    return function (t) {
        return _printError(t, name);
    };
}

module.exports = {
    init:init
};
