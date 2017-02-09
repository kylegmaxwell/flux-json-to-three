/**
 * Extra functions to work with BufferGeometry
 */

'use strict';

import * as THREE from 'three';
import FluxGeometryError from '../geometryError.js';
import computeNormals from './normals.js';

/**
 * Merge a list of buffer geometries into a new one.
 * The old two will be disposed, so they can be garbage collected.
 * @param  {Array.<THREE.Object3D>} meshes A list of meshes containing geometry to merge
 * @return {THREE.BufferGeometry}       The merged result.
 */
export function mergeBufferGeom(meshes) {
    var i, m, geom2;
    var geometry = new THREE.BufferGeometry();
    var geom1 = meshes[0].geometry;

    // Split all indexed geometry so we don't need it anymore
    for (m=0;m<meshes.length;m++) {
        geom2 = meshes[m].geometry;
        if (geom2.index) {
            // throw new FluxGeometryError('Not expecting indexed geometry.');
            meshes[m].geometry = geom2.toNonIndexed();
        }
        geom2 = meshes[m].geometry;
        if (!geom2.attributes.normal) {
            meshes[m].geometry = computeNormals(geom2);
        }
    }

    // for each attribute
    for ( var key in geom1.attributes ) {
        // Don't care about other stuff
        if (key !== 'color' && key !== 'position' && key !== 'normal' && key !== 'uv') continue;

        var data = [];
        // for each geometry
        for (m=0;m<meshes.length;m++) {
            geom2 = meshes[m].geometry;
            if (!geom2.attributes[key]) {
                throw new FluxGeometryError('Mismatched geometry attributes: '+key);
            }

            var attributeArray2 = geom2.attributes[key].array;
            for ( i = 0; i < attributeArray2.length; i ++ ) {
                data.push(attributeArray2[i]);
            }
        } // end for each geom
        geometry.addAttribute(key, new THREE.BufferAttribute(new Float32Array(data), geom1.attributes[key].itemSize));
    } // end for each attr

    for (m=0;m<meshes.length;m++) {
        meshes[m].geometry.dispose();
    }

    return geometry;
}

/**
 * Make sure that the buffer geometry has an index array and it is of the right type
 * @param  {THREE.BufferGeometry} geom The geometry to check
 */
function _ensureIndex(geom) {
    var i;
    if (!geom.index) {
        var pos = geom.attributes.position.array;
        var index = [];
        for (i=0;i<pos.length/3;i++) {
            index.push(i);
        }
        geom.setIndex(new THREE.BufferAttribute(new Uint32Array(index), 1));
    } else if (!(geom.index.array.constructor instanceof Uint32Array)) {
        geom.index.array = Uint32Array.from(geom.index.array);
    }
}


/**
 * Checks for duplicate vertices with hashmap.
 * Faces with duplicate vertices are rewired to point to the first instance.
 * This is a fork of THREE.Geometry.mergeVertices that has been adapted to work on buffer geometry.
 * @param  {THREE.BufferGeometry} geom Geometry to clean
 */
export function mergeVertices(geom) {
    _ensureIndex(geom);
    var verticesMap = {}; // Hashmap for looking up vertices by position coordinates (and making sure they are unique)
    var changes = {};
    var vx, vy, vz, key;
    var precisionPoints = 4; // number of decimal points, e.g. 4 for epsilon of 0.0001
    var precision = Math.pow( 10, precisionPoints );
    var i, il, j;

    var pos = geom.attributes.position.array;
    var index = geom.index.array;

    // for each vertex
    for ( i = 0, il = pos.length; i < il; i += 3) {
        vx = pos[i];
        vy = pos[i+1];
        vz = pos[i+2];
        key = Math.round( vx * precision ) + '_' + Math.round( vy * precision ) + '_' + Math.round( vz * precision );
        if ( verticesMap[ key ] === undefined ) {
            verticesMap[ key ] = i;
        } else {
            j = verticesMap[key];
            changes[i] = j;
        }
    }
    // Re-index faces to uses the first possible index when points overlap.
    // Could cause degenerate faces.
    for ( i = 0, il = index.length; i < il; i++) {
        var idx = index[i]*3;
        if (changes[idx]!=null) {
            index[i] = Math.floor(changes[idx]/3);
        }
    }

}
