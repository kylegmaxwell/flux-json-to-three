// code forked from here
// https://github.com/mrdoob/three.js/blob/master/examples/js/curves/NURBSSurface.js
/**
 * @author renej
 * NURBS surface object
 *
 * Implementation is based on (x, y [, z=0 [, w=1]]) control points with w=weight.
 *
 **/
'use strict';

import * as THREE from 'three';
import * as NURBSUtils from './NURBSUtils.js';


/**************************************************************
 *	NURBS surface
 *	knots2 Arrays of reals
 *	controlPoints array^2 of Vector(2|3|4)
 **************************************************************/

export default function NURBSSurface ( degree1, degree2, knots1, knots2 , controlPoints ) {
	this.degree1 = degree1;
	this.degree2 = degree2;
	this.knots1 = knots1;
	this.knots2 = knots2;
	this.controlPoints = [];

	var len1 = knots1.length - degree1 - 1;
	var len2 = knots2.length - degree2 - 1;

	// ensure Vector4 for control points
	for (var i = 0; i < len1; ++ i) {
		this.controlPoints[i] = [];
		for (var j = 0; j < len2; ++ j) {
			var point = controlPoints[i][j];
			this.controlPoints[i][j] = new THREE.Vector4(point.x, point.y, point.z, point.w);
		}
	}
	// Closed surfaces force their first span to be a single point. Since a
	// span consists of a number of knots equal to the degree, we must skip
	// the first knots to avoid extrapolation artifacts for parametric values
	// outside the domain of the curve. iMin and iMax are integer Numbers that
	// store the beginning and ending index which contain the renderable
	// domain of the curve.
	this.iMin1 = 0;
	this.iMax1 = this.knots1.length-1;
	if (this.isClosed(this.knots1, this.degree1)) {
		this.iMin1 = this.degree1;
		this.iMax1 = this.knots1.length-1-this.degree1;
	}
	this.iMin2 = 0;
	this.iMax2 = this.knots2.length-1;
	if (this.isClosed(this.knots2, this.degree2)) {
		this.iMin2 = this.degree2;
		this.iMax2 = this.knots2.length-1-this.degree2;
	}
}

NURBSSurface.prototype.isClosed = function ( knots, degree ) {
	var start1 = this._getPointByParameters(knots[degree][0]);
	var end1 = this._getPointByParameters(knots[knots.length-1-degree][0]);
	start1.sub(end1);
	var TOLERANCE = 0.000001;
	return start1.length() < TOLERANCE;
},

NURBSSurface.prototype.getPoint = function ( t1, t2 ) {
	var u = this.knots1[this.iMin1] + t1 * (this.knots1[this.iMax1] - this.knots1[this.iMin1]); // linear mapping t1->u
	var v = this.knots2[this.iMin2] + t2 * (this.knots2[this.iMax2] - this.knots2[this.iMin2]); // linear mapping t2->u
	return this._getPointByParameters(u, v);
};
NURBSSurface.prototype._getPointByParameters = function ( u, v ) {
	return NURBSUtils.calcSurfacePoint(this.degree1, this.degree2, this.knots1, this.knots2, this.controlPoints, u, v);
};
