/**
 * set of helpers to make wire primitives
 */

'use strict';

/*
 * imports
 */
import {
Vector3
} from 'three';

export const HALF_PI = Math.PI * 0.5;
export const TOLERANCE = 0.000001;
export const DEFAULT_ROTATION = new Vector3( HALF_PI, HALF_PI, 0 );
export const PLANE_DEFAULTS = {
        WIDTH: 10000,
        HEIGHT: 10000,
        WIDTH_SEGMENTS: 100,
        HEIGHT_SEGMENTS: 100
    };
