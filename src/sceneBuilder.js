/**
 * Entry point for creating scenes.
 */
'use strict';

import * as THREE from 'three';
import SceneBuilderData from './sceneBuilderData.js';
import * as print from './utils/debugPrint.js';
import GeometryBuilder from './geometryBuilder.js';
import {scene} from 'flux-modelingjs';
import * as constants from './constants.js';
import * as sceneEdit from './sceneEdit.js';
import * as materials from './utils/materials.js';

/**
 * Class to convert a Flux JSON scene to a three.js object hierarchy
 * @param {String} tessUrl  The url for the brep tessellation service
 * @param {String} token    The current flux auth token
 */
export default function SceneBuilder(tessUrl, token) {
    this._geometryBuilder = new GeometryBuilder(tessUrl, token);
    this._allowMerge = true;
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
 * Set whether geometry with same material is allowed to merge.
 * This affects performance when rendering many surfaces.
 * Too many Sheet or Solid primitives, leads to many draw calls if allowMerge is false.
 * Alternatively selection logic does not work well with merging allowed. This is because
 * selection applies to the entire merged mesh, and not the original primitive.
 * @param  {Boolean} allowMerge Whether any merging can happen
 */
SceneBuilder.prototype.setAllowMerge = function(allowMerge) {
    this._allowMerge = allowMerge;
};
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
    var dataClean = scene.prep(data, sceneBuilderData.primStatus);
    var _this = this;
    return materials.prepIBL(dataClean).then(function () {
        // Render as a scene if possible
        if (scene.isScene(dataClean)) {
            if (_checkScene(dataClean, sceneBuilderData.primStatus)) {
                return _this._convertScene(dataClean, sceneBuilderData).then(function() {
                    return sceneBuilderData.getResults();
                });
            } else { // it is a scene but the scene is invalid

                // Render the entities as if there is no scene
                return _this._createEntity(dataClean).then(function (results) {
                    // Remove errors from entities, since the scene errors are more relevant
                    results.primStatus.clear();
                    results.primStatus.merge(sceneBuilderData.primStatus);
                    return results.getResults();
                });
            }
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
                elementPromises.push(Promise.resolve(null));
            } else if (element.primitive === scene.SCENE_PRIMITIVES.texture) {
                elementPromises.push( new Promise(function(resolve, reject) {
                    var textureLoader = new THREE.TextureLoader();
                    textureLoader.load(element.image, function (texture){
                        resolve(texture);
                    }, undefined, function (err) {
                        reject(err);
                    });
                }));
            } else if (element.primitive === scene.SCENE_PRIMITIVES.geometry) {
                elementPromises.push(this._createEntity(element.entities));
            } else if (element.primitive === scene.SCENE_PRIMITIVES.camera) {
                elementPromises.push(this._createCamera(element));
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
        for (i=0;i<results.length;i++) {
            var result = results[i];
            if (!result) continue;
            if (result.object) {
                var object = result.object;
                object.name = entities[i].primitive+':'+entities[i].id;
                object.userData.id = entities[i].id;
                object.userData.primitive = entities[i].primitive;
                object.userData.data = entities[i];
                sceneBuilderData.cacheObject(object.userData.id, object);
            } else {
                sceneBuilderData.cacheObject(entities[i].id, result);
            }
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
 * @param  {SceneBuilderData} sceneBuilderData The container
 * @return {THREE.Object3d}       The new instance
 */
function _rebuildChild(child, sceneBuilderData) {
    // Build a completely new object containing new meshes, since three.js
    // does not allow multiple parents for the same object
    var func = THREE[child.type];
    var obj = new func(child.geometry, child.material.clone());
    child.updateMatrixWorld();
    // These transforms are always rigid so applyMatrix is ok
    obj.applyMatrix(child.matrix);//TODO UNIT TEST (only want local transform, not parent)
    for (var p in child.userData) {
        obj.userData[p] = child.userData[p];
    }
    obj.name = child.name;
    sceneBuilderData.cacheObject(obj.userData.id, obj);
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
 * Get a THREE.Matrix4 from an array of 16 values
 * @param  {Array.<Number>} matrix Array data
 * @return {THREE.Matrix4}        Matrix object
 */
function _getMatrix(matrix) {
    var mat = new THREE.Matrix4();
    for (var i = 0; i < matrix.length; i++) {
        mat.elements[i] = matrix[i];
    }
    mat.transpose();
    return mat;
}

/**
 * Apply a transform matrix to a 3D Object
 * @param  {Array.<Number>} matrix Array of 16 values representing a 4x4 transform
 * @param  {THREE.Object3D} object The object to update
 */
function _applyTransform(matrix, object) {
    if (matrix) {
        var mat = _getMatrix(matrix);
        // Can not use applyMatrix, because the matrix from the JSON might have shear
        // which would be removed by three.js converting to translate, rotate and scale
        object.matrixAutoUpdate = false;
        object.matrix.copy(mat);
        object.updateMatrixWorld(true);
    }
}

// Singleton local variables used as temporary storage
var position = new THREE.Vector3();
var quaternion = new THREE.Quaternion();
var scale = new THREE.Vector3();

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
    var textureId;
    var inst;
    if (materialData.colorMap != null) {
        var materialChildData = sceneBuilderData.getEntityData(materialData.colorMap);
        var textureData;
        if (materialChildData.primitive === scene.SCENE_PRIMITIVES.instance) {
            inst = materialChildData;
            textureData = sceneBuilderData.getEntityData(materialChildData.entity);
        } else {
            textureData = materialChildData;
        }
        textureId = textureData.id;
    }
    // get the material object
    var material = sceneBuilderData.getObjectMap()[materialId];
    if (material == null) {
        material = materials.create(constants.MATERIAL_TYPES.ALL, materialData);
        if (textureId != null) {
            material.surface.map = sceneBuilderData.getObjectMap()[textureId];
            material.surface.map.wrapS = THREE.RepeatWrapping;
            material.surface.map.wrapT = THREE.RepeatWrapping;
            if (inst) {
                _getMatrix(inst.matrix).decompose ( position, quaternion, scale );
                material.surface.map.offset.set(position.x, position.y);
                material.surface.map.repeat.set(scale.x, scale.y);
            }
        }
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
    var objMap = sceneBuilderData.getObjectMap();
    _applyTransform(data.matrix, obj);
    var childId = data.entity;
    var child = objMap[childId];
    var childData = sceneBuilderData.getEntityData(childId);
    if (childData == null || childData.primitive === scene.SCENE_PRIMITIVES.texture) {
        return;
    }
    if (childData.primitive === scene.SCENE_PRIMITIVES.camera) {
        obj.add(child);
    } else {
        // Extract the geometry from the previous result into the new instance
        child.traverse(function (c) {
            if (c.type === "Mesh" || c.type ==="Line") {
                var newChild = _rebuildChild(c, sceneBuilderData);
                obj.add(newChild);
            }
        });
        // material is applied after linking
    }
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
 * Extract only the geometry entities to render for scenes that are invalid due to errors
 * @param  {Object} entity Flux JSON data.
 * @return {Array}        Flux JSON data list of geometry entities.
 */
function _removeScene(entity) {
    // entity is already a flat array after prep
    for (var i=0;i<entity.length;i++) {
        var e = entity[i];
        if (e != null && e.primitive != null && e.primitive.constructor === String) {
            if (e.primitive in scene.SCENE_PRIMITIVES) {
                entity[i] = null;
            }
        }
    }
    return entity;
}

/**
 * Calculate the field of view in degrees from focal length
 * Implementation based on http://www.bdimitrov.de/kmp/technology/fov.html
 * @param  {Number} focalLength Length in mm (must be > 0)
 * @return {Number}             Field of view (how wide the camera can see in degrees)
 */
function _calcFov(focalLength) {
    return (2 * Math.atan(constants.CAMERA_DEFAULTS.SENSOR_DIAGONAL / (2 * focalLength)) * 180 / Math.PI);
}

/**
 * Create a camera from its JSON description
 * @param  {Object} entityData Flux JSON parameters
 * @return {Promise}            Promise for a THREE.Camera
 */
SceneBuilder.prototype._createCamera = function(entityData) {
    var camera, near, far;
    if (entityData.type === 'perspective') {
        var fov = constants.CAMERA_DEFAULTS.PERSP.FOV;
        if (entityData.focalLength) {
            fov = _calcFov(entityData.focalLength);
        }
        near = constants.CAMERA_DEFAULTS.PERSP.NEAR;
        if (entityData.nearClip) {
            near = entityData.nearClip;
        }
        far = constants.CAMERA_DEFAULTS.PERSP.FAR;
        if (entityData.farClip) {
            far = entityData.farClip;
        }
        var aspect = constants.CAMERA_DEFAULTS.PERSP.ASPECT;
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.up = new THREE.Vector3( 0, 0, 1 ); // Flux is Z up
    } else {
        near = constants.CAMERA_DEFAULTS.ORTHO.NEAR;
        if (entityData.nearClip) {
            near = entityData.nearClip;
        }
        far = constants.CAMERA_DEFAULTS.ORTHO.FAR;
        if (entityData.farClip) {
            far = entityData.farClip;
        }
        camera = new THREE.OrthographicCamera(100, -100, 100, -100, near, far);
    }
    camera.name = entityData.primitive+':'+entityData.id;
    camera.userData.id = entityData.id;
    camera.userData.primitive = entityData.primitive;
    camera.userData.data = entityData;
    return Promise.resolve(camera);
};

/**
 * Create the geometry and convert the results to scene results
 * @param  {Object} entityData  The geometry to convert
 * @return {Promise}            Promise to return SceneBuilderData
 */
SceneBuilder.prototype._createEntity = function(entityData) {
    var dataClean = _removeScene(entityData);
    return this._geometryBuilder.convert(dataClean, this._allowMerge).then(function(geometryResults) {
        var sceneBuilderData = new SceneBuilderData();
        sceneBuilderData.object = geometryResults.object;
        // Cache the constructed objects into the scene map
        geometryResults.object.traverse(function (child) {
            if (child.userData.id != null) {
                sceneBuilderData.cacheObject(child.userData.id, child);
            }
        });
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
