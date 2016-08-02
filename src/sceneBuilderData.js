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
 * Merge in the layers from another scene
 * @param  {SceneBuilderData} other Other data containing a finished scene
 */
SceneBuilderData.prototype.mergeScenes = function(other) {
    if (!other) return;

    var children = other.object.children;
    if (children.length>0) {
        while(children.length>0) {
            this.object.add(children[children.length-1]);
        }
    }
    this._finishMerge(other);
};

/**
 * Merge these layers with those from another query
 * @param  {SceneBuilderData} other The other one containing a layer
 */
SceneBuilderData.prototype.mergeLayers = function(other) {
    if (!other) return;
    this.object.add(other.object);
    this._finishMerge(other);
};

/**
 * Merge these results with those form another query
 * @param  {SceneBuilderData} other The other one containing an instance
 */
SceneBuilderData.prototype.mergeInstances = function(other) {
    if (!other) return;
    var _this = this;
    for (var i=0;i<other.object.children.length; i++) {
        var child = other.object.children[i];
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
    this._finishMerge(other);
};

/**
 * Common merge functionality that needs to be done after merging different object types
 * @param  {SceneBuilderData} other The other builder instance
 */
SceneBuilderData.prototype._finishMerge = function(other) {
    // Update the matrix on this object and its new children
    this.object.updateMatrixWorld(true);

    this.primStatus.merge(other.primStatus);
    this._mergeCache(other);
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
SceneBuilderData.prototype._mergeCache = function(other) {
    for (var key in other._sceneObjectMap) {
        this._sceneObjectMap[key] = other._sceneObjectMap[key];
    }
};
