/**
 * Module for reuse of vector objects to reduce garbage collection.
 * This is an optimization to improve runtime of the code.
 *
 * @author Kyle Maxwell <kyle@flux.io>
 * @version 0.0.1
 */

'use strict';

/*
 * Imports
 */
import { Vector3 } from 'three';



/**
 * The VectorManager class. It is an ObjectPool
 * for three js vectors. When the vectors are done
 * being used, they should be cleared
 *
 * @class VectorManager
 */
export default function VectorManager () {
    this._vectorData = [];
    this._vectorCount = 0;
}



/**
 * Allocate a new vector with new or existing object.
 * The returned vector may have junk in its values
 *
 * @method alloc
 *
 * @return { THREE.Vector3 } The vector
 */
VectorManager.prototype.alloc = function alloc () {
    var result;

    if ( this._vectorCount < this._vectorData.length ) result = this._vectorData[ this._vectorCount ];
    else {
        result = new Vector3();
        this._vectorData.push( result );
    }

    this._vectorCount += 1;

    return result;
};



/**
 * Deallocate all vectors and begin reallocating from the pool
 *
 * @method clear
 * @return { VectorManager } this
 */
VectorManager.prototype.clear = function clear () {
    this._vectorCount = 0;
    return this;
};



/**
 * Allocate a new vector with the same values as an existing one
 *
 * @method clone
 * @return { Three.Vector3 } The newly allocated vector
 *
 * @param { Three.Vector3 } v The vector to copy
 */
VectorManager.prototype.clone = function clone ( v ) {
    return this.alloc().clone( v );
};


