/**
 * Container class for 3D geometry and errors.
 */
'use strict';

import setObjectColor from './sceneEdit.js';

/**
 * Data model for each call to convertScene.
 * Data is stored in its own class definition because it is unique
 * per chain of promises.
 * @param {SceneBuilderData} sceneBuilderData The full source data
 */
export default function SceneResults(sceneBuilderData) {
    // Container for all geometry results
    this._object = sceneBuilderData.object;

    // Map from primitive name to error string or empty string when no error
    this._status = sceneBuilderData.primStatus;

    this._sceneObjectMap = sceneBuilderData.getObjectMap();
}

/**
 * Determine if there is any geometry in the mesh object
 * @return {Boolean} True when empty
 */
SceneResults.prototype._objectIsEmpty = function () {
    return this._object == null || this._object.children.length === 0;
};

/**
 * Get a layer object that allows manipulating its properties
 * @param  {String} id The unique identifier for the scene element
 * @return {THREE.Object3D}    The layer to render
 */
SceneResults.prototype._getObjectById = function (id) {
    var layer = this._sceneObjectMap[id];
    if (layer) {
        return layer;
    }
    return null;
};

/**
 * Set whether this scene element renders or not
 * @param  {String} id The unique identifier for the scene element
 * @param  {Boolean} visible Whether to render
 */
SceneResults.prototype.setElementVisible = function (id, visible) {
    var object = this._getObjectById(id);
    if (object) {
        object.visible = visible;
    }
};

/**
 * Set the scene element override color
 * Note: This is a destructive operation, it will blow away the point colors on the meshes
 * If we want to fix this the color can be cached in another attribute and then restored
 * @param  {String} id The unique identifier for the scene element
 * @param  {String|THREE.Color} color The color to apply
 */
SceneResults.prototype.setElementColor = function (id, color) {
    var object = this._getObjectById(id);
    if (object) {
        setObjectColor(object, color);
    }
};

/**
 * Get the mesh or null if it's empty.
 * @return {Object3D} The mesh container or null
 */
SceneResults.prototype.getObject = function () {
    if (this._objectIsEmpty()) {
        return null;
    } else {
        return this._object;
    }
};

/**
 * Whether there is any renderable geometry in the scene
 * @return {Boolean} True when it will render empty
 */
SceneResults.prototype.isEmpty = function () {
    return this.getObject() == null;
};

/**
 * Get a summary string of all the geometry errors
 * @return {String} Error message
 */
SceneResults.prototype.getErrorSummary = function () {
    return this._status.invalidKeySummary();
};
