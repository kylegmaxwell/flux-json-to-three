/**
 * Container class for 3D geometry and errors.
 */
'use strict';

import * as THREE from 'three';
import FluxGeometryError from './geometryError.js';
import SceneResults from './sceneResults.js';
import {scene} from 'flux-modelingjs';
var StatusMap = scene.StatusMap;

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
        // TODO(Kyle): Right now schema validation removes primitives that fail the
        // schema check, so it can lead to missing references. Thiw allows rendering
        // of partially valid scenes. At some point I would like to change the way
        //  the scene is parsed so that we can walk up the graph and remove those references.
        // throw new FluxGeometryError('Reference to non existing id in scene:',id);
        return null;
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
 * Return an object containing just the user facing results of the geometry construction
 * @return {SceneResults} The user info
 */
SceneBuilderData.prototype.getResults = function() {
    return new SceneResults(this);
};
