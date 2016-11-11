/**
 * set of helpers to make primitives
 */

'use strict';

import * as THREE from 'three';
import * as wirePrimitives from './primitives/wirePrimitives.js';
import * as sheetPrimitives from './primitives/sheetPrimitives.js';
import * as solidPrimitives from './primitives/solidPrimitives.js';
import * as otherPrimitives from './primitives/primitives.js';
import * as constants from './constants.js';
import * as materials from './utils/materials.js';
import FluxGeometryError from './geometryError.js';

// Map from primitive name to material type
var _primToMaterial = null;

// Map from primitive name to creation function
var _primToFunc = null;

/**
 * Create mappings from primitives to related data and cache for easy reuse
 */
function _makePrimMaps() {
    if (_primToMaterial) return;
    _primToMaterial = {
        point: constants.MATERIAL_TYPES.POINT
    };
    _primToFunc = {};
    var key;
    for (key in wirePrimitives) {
        _primToMaterial[key] = constants.MATERIAL_TYPES.LINE;
        _primToFunc[key] = wirePrimitives[key];
    }
    for (key in sheetPrimitives) {
        _primToMaterial[key] = constants.MATERIAL_TYPES.SURFACE;
        _primToFunc[key] = sheetPrimitives[key];
    }
    for (key in solidPrimitives) {
        _primToMaterial[key] = constants.MATERIAL_TYPES.SURFACE;
        _primToFunc[key] = solidPrimitives[key];
    }
    for (key in otherPrimitives) {
        _primToMaterial[key] = constants.MATERIAL_TYPES.SURFACE;
        _primToFunc[key] = otherPrimitives[key];
    }
}

/**
 * Determine what function can be used to construct this primitive
 * @param  {String}     primitive   The name of the entity type
 * @return {Function}               Construction function
 */
function _resolvePrimFunc (primitive) {
    _makePrimMaps();
    return _primToFunc[primitive];
}

/**
 * Determine the material type that would be used for a given primitive
 * @param {String} primitive The name of the entity type
 * @returns {constants.MATERIAL_TYPES} A function to convert a prim to geometry and a material type
 */
export function resolveMaterialType (primitive) {
    _makePrimMaps();
    return _primToMaterial[primitive];
}

var RIGHT = new THREE.Vector3(1, 0, 0);
var IN    = new THREE.Vector3(0, 1, 0);
var UP    = new THREE.Vector3(0, 0, 1);

/**
 * Get the point size from a given entity
 * @param {Array} prims Array of point data
 * @returns {Number} Point size
 * @private
 */
function _getPointSize(prims) {
    var size = constants.DEFAULT_MATERIAL_PROPERTIES.point.pointSize;
    // Just use the first point for now, can't set size per point.
    var prim = prims[0];
    if (!prim) return;
    var materialProperties = prim.materialProperties || (prim.attributes && prim.attributes.materialProperties);
    var legacyName = constants.LEGACY_POINT_PROPERTIES.pointSize;
    if (materialProperties && (materialProperties[legacyName] != null || materialProperties.pointSize != null)) {
        if (materialProperties.pointSize != null) {
            size = materialProperties.pointSize;
        } else {
            size = materialProperties[legacyName];
        }
    }
    return size;
}

/**
 * Create the point cloud mesh for all the input primitives
 * @param {Object}          prims       List of point primitive objects
 * @param {GeometryResults} geomResult  Results object for errors and geometry
 */
export function createPoints (prims, geomResult) {
    var positions = new Float32Array(prims.length*3);
    var colors = new Float32Array(prims.length*3);
    for (var i=0;i<prims.length;i++) {
        var prim = prims[i];
        positions[i*3] = prim.point[0];
        positions[i*3+1] = prim.point[1];
        positions[i*3+2] = prim.point[2]||0;
        // Get color or default color
        var color = materials._convertColor(materials._getEntityData(prim, 'color', constants.DEFAULT_MATERIAL_PROPERTIES.point.color));
        colors[i*3] = color.r;
        colors[i*3+1] = color.g;
        colors[i*3+2] = color.b;
    }
    var geometry = new THREE.BufferGeometry();

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

    // First create a point cloud with world space size
    var materialProperties = {
        size: _getPointSize(prims),// user can set world space size
        sizeAttenuation: true,
        vertexColors: THREE.VertexColors
    };
    var material = new THREE.PointsMaterial(materialProperties);
    var mesh = new THREE.Points( geometry, material );

    // Second create a point cloud with pixel size, to ensure they always render at least a few pixels
    var materialProperties2 = {
        size: constants.POINT_PIXEL_SIZE, //pixels
        sizeAttenuation: false,
        vertexColors: THREE.VertexColors
    };
    var material2 = new THREE.PointsMaterial(materialProperties2);
    var mesh2 = new THREE.Points( geometry, material2 );

    var obj = new THREE.Object3D();
    obj.add(mesh);
    obj.add(mesh2);

    geomResult.primStatus.appendValid('point');
    geomResult.object.add(obj);
}

/**
 * Creates the ParaSolid Object
 *
 * @function createPrimitive
 * @return { THREE.Mesh } The created mesh
 * @throws FluxGeometryError if unsupported geometry is found
 *
 * @param { Object } data The data to create the object with
 */
export function createPrimitive (data) {
    var materialType = resolveMaterialType(data.primitive);
    var materialProperties = _findMaterialProperties(data);
    var material = materials.create(materialType, materialProperties);

    var primFunction = _resolvePrimFunc(data.primitive);
    if (!primFunction) return;

    var mesh = primFunction(data, material);

    if ( mesh ) {
        return cleanupMesh(mesh, data, materialProperties);
    }

    throw new FluxGeometryError('Unsupported geometry type: ' + data.primitive);
}

/**
 * Move the color from a material to a geometry.
 *
 * This allows meshes of different colors to be merged together.
 * Then the meshes can share a single material with per vertex color.
 *
 * @precondition The color object on the material should not be shared with other materials.
 * @param {THREE.Geometry|THREE.BufferGeometry} mesh The mesh containing geometry and material to manipulate
 * @private
 */
function _moveMaterialColorToGeom(mesh) {
    var geom = mesh.geometry;
    var color = mesh.material.color;
    var color2 = color.clone();
    if (geom) {
        if (geom.type.indexOf('BufferGeometry') !== -1) {
            // Set the color as a buffer attribute
            var attrLen = geom.attributes.position.array.length;
            var colors = [];
            for (var i=0;i<attrLen;i+=3) {
                colors.push(color.r);
                colors.push(color.g);
                colors.push(color.b);
            }
            geom.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array(colors), 3 ) );
        } else if (geom.faces.length > 0) {
            // Set the color per face
            for (var f=0;f<geom.faces.length;f++) {
                geom.faces[f].color = color2;
            }
        } else {
            // Lines have a colors array since they don't have faces
            for (var c=0;c<geom.vertices.length;c++) {
                geom.colors[c] = color2;
            }
            geom.colorsNeedUpdate = true;
        }
        // Reset the color since it is now on the points.
        // In three.js color is multiplicative, so:
        // color = material color * vertex color
        // Hence after setting it on the mesh, it must be reset on the material.
        color.r = 1;
        color.g = 1;
        color.b = 1;
    }
}

/**
 * Do some post processing to the mesh to prep it for Flux
 * @param {THREE.Object3D} mesh Geometry and material object
 * @param {Object} data The entity object
 * @returns {THREE.Mesh} The processed mesh
 */
export function cleanupMesh(mesh, data) {
    // Text helper is ignored, due to it's own special materials.
    if (mesh.type !== "textHelper") {
        // Convert all geometry in the object tree
        mesh.traverse(function (child) {
            // Only convert the color for objects with material
            if (child.material) {
                _moveMaterialColorToGeom(child);
            }
        });
    }

    if (!data) {
        return;
    }

    if ( data.origin ) {
        _applyOrigin( mesh, data.origin );
    }

    var reference = data.reference;
    var axis = data.axis || data.direction || data.normal;
    if (reference || axis) {
        var axisVec = UP.clone();
        if ( axis ) {
            axisVec.set(axis[0], axis[1], axis[2]);
            axisVec.normalize();
        }

        var referenceVec = RIGHT.clone();
        if (reference) {
            referenceVec.set(reference[0], reference[1], reference[2]);
            referenceVec.normalize();
        } else if (referenceVec.distanceToSquared(axisVec) < constants.TOLERANCE) {
            referenceVec = IN.clone();
        }
        mesh.up = referenceVec.cross(axisVec);

        mesh.lookAt( mesh.position.clone().add(axisVec));
    }

    if (data.attributes && data.attributes.tag) {
        mesh.userData.tag = data.attributes.tag;
    }

    return mesh;
}

/**
 * Helper method to find the material properties on the data
 *
 * @function _findMaterialProperties
 * @private
 *
 * @return { Object } The material properties
 *
 * @param { Object } data The data used to construct the primitive
 */
function _findMaterialProperties ( data ) {
    if ( data.attributes && data.attributes.materialProperties ) return data.attributes.materialProperties;
    else if ( data.materialProperties ) return data.materialProperties;
    else return {
        side: THREE.DoubleSide
    };
}

/**
 * A helper to apply an origin to a mesh
 *
 * @function _applyOrigin
 * @private
 *
 * @param { THREE.Mesh } mesh The mesh to receive the origin
 * @param { Array } origin The vector representing the origin
 */
function _applyOrigin ( mesh, origin ) {
    mesh.position.set(
        origin[ 0 ],
        origin[ 1 ],
        origin[ 2 ] ? origin[ 2 ] : 0
    );
}
