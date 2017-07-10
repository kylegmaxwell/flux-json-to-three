/**
 * @author arodic / http://akirodic.com/
 * @param label text to be displayed
 * @param options.size height of text quad in world usnits
 * @param options.resolution height of text texture in pixels
 * @param options.color text color
 * @param options.align text alignment ('left' | 'right' | 'center')
 */
'use strict';
import * as THREE from 'three';
import * as compatibility from '../compatibility.js';
import * as constants from '../constants.js';

export default function TextHelper ( label, options ) {

    options = options || {};
    options.size = options.size || 4;
    options.resolution = options.resolution || 128;
    options.color = options.color || 'white';
    options.align = options.align || 'center';

    var canvas = compatibility.createCanvas();
    var aspect = 1;
    if (canvas) {
        var ctx = canvas.getContext( '2d' );
        ctx.font = options.resolution + 'px sans-serif';

        aspect = ctx.measureText(label).width / options.resolution;

        canvas.width = options.resolution * aspect;
        canvas.height = options.resolution;

        ctx.font = options.resolution + 'px sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText( label, options.resolution * aspect / 2, options.resolution / 2 );
    }

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.premultiplyAlpha = true;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    var material = new THREE.MeshBasicMaterial( { map: texture, transparent: true, color: options.color, side: THREE.DoubleSide } );
    material.blendSrc = THREE.OneFactor;
    material.blending = THREE.CustomBlending;
    material.depthWrite = false;

    var indices = new Uint16Array( [ 0, 1, 2,  0, 2, 3 ] );
    var vertices = new Float32Array( [ - 0.5, - 0.5, 0,   0.5, - 0.5, 0,   0.5, 0.5, 0,   - 0.5, 0.5, 0 ] );
    var colors = new Float32Array( [ 1,1,1,   1,1,1,   1,1,1,   1,1,1 ] );
    var uvs = new Float32Array( [ 0, 0,   1, 0,   1, 1,   0, 1 ] );

    var geometry = new THREE.BufferGeometry();
    geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

    THREE.Mesh.call( this, geometry, material );

    this.type = constants.TEXT_PRIMITIVE;

    if (options.align == 'left') {

        this.position.x = - options.size * aspect / 2;

    } else if (options.align == 'right') {

        this.position.x = options.size * aspect / 2;

    }

    this.scale.set( options.size * aspect, options.size, 1 );
    this.updateMatrix();
    this.geometry.applyMatrix(this.matrix);

    this.scale.set( 1, 1, 1 );
    this.position.set( 0, 0, 0 );
    this.updateMatrix();

}

TextHelper.prototype = Object.create( THREE.Mesh.prototype );
TextHelper.prototype.constructor = TextHelper;
