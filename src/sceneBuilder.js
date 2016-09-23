/**
 * Entry point for creating scenes.
 */
'use strict';

import THREE from 'three';
import SceneBuilderData from './sceneBuilderData.js';
import * as print from './debugPrint.js';
import GeometryBuilder from './geometryBuilder.js';
import {scene} from 'flux-modelingjs';
import * as constants from './constants.js';
import setObjectColor from './sceneEdit.js';
import cleanElement from './utils/entityPrep.js';

/**
 * Class to convert a Flux JSON scene to a three.js object hierarchy
 * @param {String} tessUrl  The url for the brep tessellation service
 * @param {String} token    The current flux auth token
 */
export default function SceneBuilder(tessUrl, token) {
    this._geometryBuilder = new GeometryBuilder(tessUrl, token);
}

/**
 * Check whether the given scene is valid and add message
 * @param  {Object} data        Flux JSON to check and modify
 * @param  {StatusMap} primStatus Container for error messages
 * @return {Boolean}      True for valid
 */
function _checkScene(data, primStatus) {
    var sceneValidator = new scene.Validator();
    var sceneValid = sceneValidator.validateJSON(data);
    if (!sceneValid.getResult()) {
        primStatus.appendError('scene', sceneValid.getMessage());
        return false;
    }
    return true;
}

/**
 * Convert JSON data to a tree of three.js geometry
 * Conversion is asynchronous, so results are returned in promises.
 * @param  {Object} data JSON data containing scene
 * @return {Promise}      Promise to return a SceneResults object
 */
SceneBuilder.prototype.convert = function(data) {
    var sceneBuilderData = new SceneBuilderData();
    // Make sure data is JSON for an element of some sort
    if (!data || !(data.constructor === Array || data.primitive)) {
        return Promise.resolve(sceneBuilderData.getResults());
    }
    var dataClean = cleanElement(data, sceneBuilderData.primStatus);
    var builderPromise;
    if (scene.Validator.isScene(dataClean) && _checkScene(dataClean, sceneBuilderData.primStatus)) {
        builderPromise = this._convertScene(dataClean, sceneBuilderData);
    } else {
        builderPromise = this._createEntity(dataClean);
    }
    return builderPromise.then(function(newBuilderData) {
        sceneBuilderData.mergeScenes(newBuilderData);
        return sceneBuilderData.getResults();
    });
};

/**
 * Convert the scene data into a THREE.Object3D
 * @param  {Array} entities                        JSON Object with scene parameters
 * @param  {SceneBuilderData} sceneBuilderData  Container for result and per query storage
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._convertScene = function(entities, sceneBuilderData) {
    var array = entities;
    for (var i=0;i<array.length;i++) {
        var element = array[i];
        if (element == null) continue;
        sceneBuilderData.setEntityData(element);
        if (element.primitive && element.primitive === constants.SCENE_PRIMITIVES.layer) {
            sceneBuilderData.addLayer(element);
        }
        // Currently JSON data that is unreferenced by layers will be ignored
    }

    return this._createLayers(entities, sceneBuilderData);
};

/**
 * Create a all the layers in the scene as unique instances of THREE.Object3D
 * @param  {Object} data                        JSON Object with layer parameters
 * @param  {SceneBuilderData} sceneBuilderData  Container for result and per query storage
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._createLayers = function(data, sceneBuilderData) {
    var promises = [];
    var layers = sceneBuilderData.getLayers();
    for (var l=0;l<layers.length;l++) {
        var layer = layers[l];
        promises.push(this._createLayer(layer, sceneBuilderData));
    }
    return Promise.all(promises).then(function (results) {
        if (results.length===0) return sceneBuilderData;
        var combo = new SceneBuilderData();
        for (var r=0;r<results.length;r++) {
            combo.mergeLayers(results[r]);
        }
        return combo;
    });
};

/**
 * Create a layer in three.js from the given data
 * @param  {Object} data                        JSON Object with layer parameters
 * @param  {SceneBuilderData} sceneBuilderData  Container for result and per query storage
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._createLayer = function(data, sceneBuilderData) {
    var promises = [];
    for (var c=0;c<data.elements.length;c++) {
        var child = data.elements[c];
        promises.push(this._createSceneElement(child, sceneBuilderData));
    }
    var layerPromise = Promise.all(promises).then(function (results) { // merge elements
        if (results.length===0) return sceneBuilderData;
        var combo = new SceneBuilderData();
        for (var r=0;r<results.length;r++) {
            combo.mergeInstances(results[r]);
        }
        return combo;
    }).then(function(result) { // apply layer overrides
        setObjectColor(result.object, data.color);
        if (data.visible != null) {
            result.object.visible = !!data.visible;
        }
        return result;
    });
    return layerPromise.then(function(result) {
        // cache the layer
        var id = data.id;
        if (id) {
            sceneBuilderData.cacheObject(id, result.object);
        }
        return result;
    });
};

/**
 * Create any scene element
 * @param  {Object} elementId                   JSON Object with element parameters
 * @param  {SceneBuilderData} sceneBuilderData  Container for result and per query storage
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._createSceneElement = function(elementId, sceneBuilderData) {
    var element = sceneBuilderData.getEntityData(elementId);
    // There might be a missing link if the element was removed due to an invalid schema
    if (!element) {
        return Promise.resolve(sceneBuilderData);
    }
    if (element.primitive === constants.SCENE_PRIMITIVES.instance) {
        return this._createInstance(element, sceneBuilderData);
    } else if (element.primitive === constants.SCENE_PRIMITIVES.group) {
        return this._createGroup(element, sceneBuilderData);
    } else if (element.primitive === constants.SCENE_PRIMITIVES.geometry) {
        return this._createGeometryContainer(element);
    } else { // entity
        return this._createEntityFromData(element, sceneBuilderData);
    }
};

/**
 * Create any scene geometry.
 * This is used to store arrays of entities with an associated id.
 * @param  {Object} element                   JSON Object with geometry parameters
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._createGeometryContainer = function(element) {
    return this._createEntity(element.entity);
};

/**
 * Apply a transform matrix to a 3D Object
 * @param  {Array.<Number>} matrix Array of 16 values representing a 4x4 transform
 * @param  {THREE.Object3D} object The object to update
 */
function _applyTransform(matrix, object) {
    if (matrix) {
        var mat = new THREE.Matrix4();
        for (var i = 0; i < matrix.length; i++) {
            mat.elements[i] = matrix[i];
        }
        mat.transpose();
        object.applyMatrix(mat);
        object.updateMatrixWorld(true);
    }
}

/**
 * Instances are special and reuse their entities
 * @param  {Object} element                     JSON data for group
 * @param  {SceneBuilderData} sceneBuilderData  Container for results and errors
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._createInstance = function(element, sceneBuilderData) {
    return this._createSceneElement(element.entity, sceneBuilderData).then(function (results) {
        var instanceResults = new SceneBuilderData();
        _applyTransform(element.matrix, instanceResults.object);
        instanceResults.mergeInstances(results);
        return instanceResults;
    }).catch(function (err) {
        print.log(err);
    });
};
/**
 * Create an group collection of elements with a transform
 * @param  {Object} element                     JSON data for group
 * @param  {SceneBuilderData} sceneBuilderData  Container for results and errors
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._createGroup = function(element, sceneBuilderData) {
    var promises = [];
    for (var c=0;c<element.children.length;c++) {
        var child = element.children[c];
        promises.push(this._createSceneElement(child, sceneBuilderData));
    }
    var groupPromise = Promise.all(promises).then(function (results) { // merge elements
        if (results.length===0) return sceneBuilderData;
        var combo = new SceneBuilderData();
        _applyTransform(element.matrix, combo.object);
        for (var r=0;r<results.length;r++) {
            combo.mergeInstances(results[r]);
        }
        return combo;
    });
    return groupPromise.then(function(result) {
        // cache the layer
        var id = element.id;
        if (id) {
            sceneBuilderData.cacheObject(id, result.object);
        }
        return result;
    });
};

/**
 * Leaf node of scene that calls into geometry builder to create entities.
 * @param  {Object} entityData                  JSON data for entity description
 * @param  {SceneBuilderData} sceneBuilderData  Container for results and errors.
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._createEntityFromData = function(entityData, sceneBuilderData) {
    var entityId = entityData.id;
    if (entityId) {
        var cachedResults = sceneBuilderData.getCachedPromise(entityId);
        if (cachedResults) {
            return Promise.resolve(cachedResults);
        } else {
            var convertPromise = this._createEntity(entityData);
            sceneBuilderData.cachePromise(entityId, convertPromise);
            return convertPromise;
        }
    }
    return this._createEntity(entityData);
};

/**
 * Create the geometry and convert the results to scene results
 * @param  {Object} entityData  The geometry to convert
 * @return {Promise}            Promise to return SceneBuilderData
 */
SceneBuilder.prototype._createEntity = function(entityData) {
    return this._geometryBuilder.convert(entityData).then(function(geometryResults) {
        var sceneBuilderData = new SceneBuilderData();
        sceneBuilderData.object = geometryResults.object;
        sceneBuilderData.primStatus = geometryResults.primStatus;
        return sceneBuilderData;
    }).catch(function (err) {
        // Make sure syntax errors are available to the developer
        print.warn(err);
        return err;
    });
};

/**
 * Set the url of the tessellation service.
 * This is required for rendering of breps.
 * @param {String} newUrl The url of the tessellation server
 */
SceneBuilder.prototype.setTessUrl = function(newUrl) {
    this._geometryBuilder.setTessUrl(newUrl);
};
