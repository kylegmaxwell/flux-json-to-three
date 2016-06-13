/**
 * Container class for 3D geometry and errors.
 */
'use strict';

import THREE from 'three';
import FluxGeometryError from './geometryError.js';
import StatusMap from './statusMap.js';
import SceneResults from './sceneResults.js';

//---- Class Definition

/**
 * Data model for each call to convertScene.
 * Data is stored in its own class definition because it is unique
 * per chain of promises.
 */
export default function SceneBuilderData() {
    // Container for all geometry results
    this.object = new THREE.Object3D();

    // Map from primitive name to error string or empty string when no error
    this.primStatus = new StatusMap();

    // List of layers
    this._layerPrims = [];

    // Map from id to scene element JSON object
    this._sceneDataMap = {};

    // Map from id to Promise for geometry reuse
    this._scenePromiseMap = {};

    // Map from id to THREE.Object3D
    this._sceneObjectMap = {};
}

/**
 * Get a map from id to three.js object data
 * Allows lookup of geometry that has already been built for rendering.
 * @return {Object} JavaScript Object used as a key value map
 */
SceneBuilderData.prototype.getObjectMap = function() {
    return this._sceneObjectMap;
};

/**
 * Add the JSON data for a layer
 * This is a cache used to remember all the layer primitives in a scene
 * @param {Object} element JSON data for layer
 */
SceneBuilderData.prototype.addLayer = function(element) {
    this._layerPrims.push(element);
};

/**
 * Return the list of layers for processing
 * @return {Array} Array of layer JSON objects
 */
SceneBuilderData.prototype.getLayers = function() {
    return this._layerPrims;
};

/**
 * Store a pointer to an entity JSON in the id map
 * @param {Object} element Element JSON data
 */
SceneBuilderData.prototype.setEntityData = function(element) {
    if (element.id) {
        this._sceneDataMap[element.id] = element;
    }
};

/**
 * Find an entity by its id
 * @param  {String} id The key to look by
 * @return {Object}    Flux JSON Entity
 */
SceneBuilderData.prototype.getEntityData = function(id) {
    if (typeof id === 'string') {
        var entity = this._sceneDataMap[id];
        if (entity != null) {
            return entity;
        }
        throw new FluxGeometryError('Reference to non existing id in scene:',id);
    } else {
        if (id == null) {
            throw new FluxGeometryError('No entity or referenced id specified');
        }
        return id; // entire entities can be used in lieu of id
    }
};

/**
 * Store a three.js object in an id map for reuse
 * @param  {String} entityId    The unique identifier
 * @param  {THREE.Object3D} entity   The object to store
 */
SceneBuilderData.prototype.cacheObject = function(entityId, entity) {
    this._sceneObjectMap[entityId] = entity;
};

/**
 * Store a promise for geometry reuse.
 * This allows geometry instances to share results before those results
 * are asynchronously computed.
 * @param  {String} entityId      The unique identifier
 * @param  {Promise} entityPromise Promise for GeometryResults
 */
SceneBuilderData.prototype.cachePromise = function(entityId, entityPromise) {
    this._scenePromiseMap[entityId] = entityPromise;
};

/**
 * Lookup an existing promise if its element has already started being converted
 * @param  {String} entityId The unique identifier
 * @return {Promise}          Promise for GeometryResults
 */
SceneBuilderData.prototype.getCachedPromise = function(entityId) {
    return this._scenePromiseMap[entityId];
};

/**
 * Merge these layers with those from another query
 * @param  {SceneBuilderData} result The other one
 */
SceneBuilderData.prototype.mergeLayers = function(result) {
    if (!result) return;
    this.object.add(result.object);
    this.object.updateMatrixWorld(true);

    this.primStatus.merge(result.primStatus);
};

/**
 * Merge these results with those form another query
 * @param  {SceneBuilderData} result The other one
 */
SceneBuilderData.prototype.mergeInstances = function(result) {
    if (!result) return;
    var _this = this;
    for (var i=0;i<result.object.children.length; i++) {
        var child = result.object.children[i];
        if (child.type === "Mesh" || child.type ==="Line") {
            // Build a completely new object containing new meshes, since three.js
            // does not allow multiple parents for the same object
            var func = THREE[child.type];
            var obj = new func(child.geometry, child.material);
            obj.applyMatrix(child.matrixWorld);
            _this.object.add(obj);
        } else {
            // You can not instance other wacky things like text objects
            _this.object.add(child);
        }
    }
    // Update the matrix on this object and its new children
    this.object.updateMatrixWorld(true);

    this.primStatus.merge(result.primStatus);
};

/**
 * Return an object containing just the user facing results of the geometry construction
 * @return {SceneResults} The user info
 */
SceneBuilderData.prototype.getResults = function() {
    return new SceneResults(this);
};

/**
 * Combine this data object with the constructed geometry of another.
 * Merges other into this.
 * @param  {SceneBuilderData} other The other scene data container
 */
SceneBuilderData.prototype.mergeCache = function(other) {
    this._sceneObjectMap = other._sceneObjectMap;
};
