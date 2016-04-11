/**
 * Custom error class for geometry related issues.
 */
'use strict';

export default function ErrorMap() {
    // Container for all errors
    // Map from string to list of strings
    this.errors = {};
}

// Static variable to initialize key with no error
ErrorMap.NO_ERROR = '';

/**
 * Clear / initialize all temporary arrays
 */
ErrorMap.prototype.clear = function () {
    this.errors = {};
};

/**
 * Add a new error to the map.
 * If the error is ErrorMap.NO_ERROR the entry will be added, but the list will
 * be empty, which allows the user to get a list of valid keys if needed.
 * @param {String} key The name of the error
 * @param {String} newError The error message
 */
ErrorMap.prototype.appendError = function (key, newError) {
    // Make sure the entry exists so we can track what keys are valid
    if (!this.errors[key]) {
        this.errors[key] = [];
    }
    // Add the error if it exists and is not a duplicate
    if (newError && this.errors[key].indexOf(newError) === -1) {
        this.errors[key].push(newError);
    }
};

/**
 * Determine if key is valid
 * @param {String} key Where to look in the map
 * @returns {boolean} True if the key is valid, meaning no errors
 */
ErrorMap.prototype.validKey = function (key) {
    return !this.errors[key] || this.errors[key].length === 0;
};

/**
 * Determine if the key is invalid
 * @param {String} key The entry to look for
 * @returns {boolean} True if the key is NOT valid, meaning has an error
 */
ErrorMap.prototype.invalidKey = function (key) {
    return !this.validKey(key);
};

/**
 * Create a human readable summary of all the errors.
 * @returns {string} The summary
 */
ErrorMap.prototype.invalidKeySummary = function () {
    var _this = this;
    var errors = Object.keys(this.errors).reduce(function (prev, key) {
        if (_this.invalidKey(key)) {
            prev.push(key+' ('+_this.errors[key].join(', ')+')');
        }
        return prev;
    },[]);
    return errors.join(', ');
};