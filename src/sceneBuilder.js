/**
 * Entry point for creating scenes.
 */
'use strict';

import THREE from 'three';
import SceneBuilderData from './sceneBuilderData.js';
import * as print from './utils/debugPrint.js';
import GeometryBuilder from './geometryBuilder.js';
import {scene} from 'flux-modelingjs';
import * as constants from './constants.js';
import * as sceneEdit from './sceneEdit.js';
import {default as cleanElement, cleanEntities} from './utils/entityPrep.js';
import * as materials from './utils/materials.js';

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
    var _this = this;
    return materials.prepIBL(dataClean).then(function () {
        // Render as a scene if possible
        if (scene.isScene(dataClean) && _checkScene(dataClean, sceneBuilderData.primStatus)) {
            return _this._convertScene(dataClean, sceneBuilderData).then(function() {
                return sceneBuilderData.getResults();
            });
        }
        // Render the entities if there is no scene
        return _this._createEntity(dataClean).then(function (results) {
            results.primStatus.merge(sceneBuilderData.primStatus);
            return results.getResults();
        });

    });
};

/**
 * Convert the scene data into a THREE.Object3D
 * @param  {Array} entities                        JSON Object with scene parameters
 * @param  {SceneBuilderData} sceneBuilderData  Container for result and per query storage
 * @return {Promise}                            Promise for SceneBuilderData
 */
SceneBuilder.prototype._convertScene = function(entities, sceneBuilderData) {
    var elementPromises = [];
    var i;
    // Create a promise for the Object3D result of creating each element in the scene
    for (i=0;i<entities.length;i++) {
        var element = entities[i];
        if (element == null) continue;
        sceneBuilderData.setEntityData(element);
        if (element.primitive && element.primitive === scene.SCENE_PRIMITIVES.layer) {
            sceneBuilderData.addLayer(element);
        }
        if (element.id) {
            if (element.primitive === scene.SCENE_PRIMITIVES.material) {
                // skip, create on demand (but put a placeholder)
                elementPromises.push(Promise.resolve({"object":null}));
            } else if (element.primitive === scene.SCENE_PRIMITIVES.geometry) {
                elementPromises.push(this._createEntity(element.entities));
            } else if (element.primitive in scene.SCENE_PRIMITIVES) {
                elementPromises.push(Promise.resolve(new SceneBuilderData()));
            } else {
                elementPromises.push(this._createEntity(element));
            }
        }
    }
    var _this = this;
    // Attach user data to correlate each object with it's data and then link up the scene graph
    return Promise.all(elementPromises).then(function (results) {
        var objects = results.map(function (item) { return item.object; });
        for (i=0;i<objects.length;i++) {
            if (!objects[i]) continue;
            objects[i].name = entities[i].primitive+':'+entities[i].id;
            objects[i].userData.id = entities[i].id;
            objects[i].userData.primitive = entities[i].primitive;
            objects[i].userData.data = entities[i];
            sceneBuilderData.cacheObject(objects[i].userData.id, objects[i]);
        }
        _this._linkElements(entities, sceneBuilderData);
        return Promise.resolve(sceneBuilderData);
    });

};


/**
 * Create the parenting relationships of the final scene render tree
 * @param  {Object} data             Flux JSON
 * @param  {SceneBuilderData} sceneBuilderData Result
 */
SceneBuilder.prototype._linkElements = function(data, sceneBuilderData) {
    var objMap = sceneBuilderData.getObjectMap();
    var object = sceneBuilderData.object;
    for (var i=0;i<data.length;i++) {
        var entity = data[i];
        if (entity == null || typeof entity !== 'object' || entity.id == null) continue;
        var obj = objMap[entity.id];
        if (entity.primitive === scene.SCENE_PRIMITIVES.layer) {
            this._createLayer(entity, obj, sceneBuilderData);
            object.add(obj);
        } else if (entity.primitive === scene.SCENE_PRIMITIVES.group) {
            this._createGroup(entity, obj, sceneBuilderData);
        } else if (entity.primitive === scene.SCENE_PRIMITIVES.instance) {
            this._createInstance(entity, obj, sceneBuilderData);
        }
    }
    _applyLayerColors(object);
    _applyMaterials(object, sceneBuilderData);
};

/**
 * Apply the layer color onto their children's materials
 * @param  {THREE.Object3D} object Root object containing layers
 */
function _applyLayerColors(object) {
    for (var i=0;i<object.children.length;i++) {
        var child = object.children[i];
        if (child.userData.data.color) {
            sceneEdit.setObjectColor(child, child.userData.data.color);
        }
    }
}

/**
 * Apply materials to groups and their children
 * @param  {THREE.Object3D} object           Root object containing scene
 * @param  {SceneBuilderData} sceneBuilderData The container
 */
function _applyMaterials(object, sceneBuilderData) {
    object.traverse(function (child) {
        var data = child.userData.data;
        if (data && data.material) {
            _assignMaterial(data.material, child, sceneBuilderData);
        }
    });
}


/**
 * Rebuild geometry container because Object3D can only be referenced by one object at a time
 * @param  {THREE.Object3D} child Object3D with type Mesh or Line
 * @return {THREE.Object3d}       The new instance
 */
function _rebuildChild(child) {
    // Build a completely new object containing new meshes, since three.js
    // does not allow multiple parents for the same object
    var func = THREE[child.type];
    var obj = new func(child.geometry, child.material.clone());
    child.updateMatrixWorld();
    // These transforms are always rigid so applyMatrix is ok
    obj.applyMatrix(child.matrixWorld);
    for (var p in child.userData) {
        obj.userData[p] = child.userData[p];
    }
    return obj;
}

/**
 * Create a layer in three.js from the given data
 * @param  {Object} data                        JSON Object with layer parameters
 * @param  {THREE.Object3D} obj                 Geometry container object
 * @param  {SceneBuilderData} sceneBuilderData  Container for result and per query storage
 */
SceneBuilder.prototype._createLayer = function(data, obj, sceneBuilderData) {
    var objMap = sceneBuilderData.getObjectMap();
    for (var c=0;c<data.elements.length;c++) {
        var childId = data.elements[c];
        obj.add(objMap[childId]);
    }
    if (data.visible != null) {
        obj.visible = !!data.visible;
    }
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
        // Can not use applyMatrix, because the matrix from the JSON might have shear
        // which would be removed by three.js converting to translate, rotate and scale
        object.matrixAutoUpdate = false;
        object.matrix.copy(mat);
        object.updateMatrixWorld(true);
    }
}

/**
 * Assign the material with the given id to an object in the scene
 * @param  {String} materialId       The material's id
 * @param  {THREE.Object3D} object   The object with a material
 * @param  {SceneBuilderData} sceneBuilderData Cache for json and objects
 */
function _assignMaterial(materialId, object, sceneBuilderData) {
    if (materialId == null) {
        return;
    }
    // get the material json
    var materialData = sceneBuilderData.getEntityData(materialId);

    // get the material object
    var material = sceneBuilderData.getObjectMap()[materialId];
    if (material == null) {
        material = materials.create(constants.MATERIAL_TYPES.ALL, materialData);
        sceneBuilderData.cacheObject(materialId, material);
    }
    // Recursively override material
    // Does not need to reset vertex colors since scene materials dont have vertex
    // color enabled, as scene elements are created after the merging in geometry builder
    sceneEdit.setObjectMaterial(object, material);
}

/**
 * Instances are special and reuse their entities
 * @param  {Object} data                     JSON data for group
 * @param  {THREE.Object3D} obj   The object with a material
 * @param  {SceneBuilderData} sceneBuilderData  Container for results and errors
 */
SceneBuilder.prototype._createInstance = function(data, obj, sceneBuilderData) {
    // debugger
    var objMap = sceneBuilderData.getObjectMap();
    _applyTransform(data.matrix, obj);
    var childId = data.entity;
    var child = objMap[childId];
    // Extract the geometry from the previous result into the new instance
    child.traverse(function (c) {
        if (c.type === "Mesh" || c.type ==="Line") {
            obj.add(_rebuildChild(c));
        }
    });
    // material is applied after linking
};

/**
 * Create an group collection of elements with a transform
 * @param  {Object} data                     JSON data for group
 * @param  {THREE.Object3D} obj   The object with a material
 * @param  {SceneBuilderData} sceneBuilderData  Container for results and errors
 */
SceneBuilder.prototype._createGroup = function(data, obj, sceneBuilderData) {
    var objMap = sceneBuilderData.getObjectMap();
    _applyTransform(data.matrix, obj);
    for (var c=0;c<data.children.length;c++) {
        var childId = data.children[c];
        obj.add(objMap[childId]);
    }
    // material is handled after linking
};

/**
 * Create the geometry and convert the results to scene results
 * @param  {Object} entityData  The geometry to convert
 * @return {Promise}            Promise to return SceneBuilderData
 */
SceneBuilder.prototype._createEntity = function(entityData) {
    var dataClean = cleanEntities(entityData);
    return this._geometryBuilder.convert(dataClean).then(function(geometryResults) {
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
