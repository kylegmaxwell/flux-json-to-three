// code forked from here
// https://github.com/mrdoob/three.js/blob/master/examples/js/curves/NURBSCurve.js
/**
 * @author renej
 * NURBS curve object
 *
 * Derives from Curve, overriding getPoint and getTangent.
 *
 * Implementation is based on (x, y [, z=0 [, w=1]]) control points with w=weight.
 *
 **/
'use strict';

import * as THREE from 'three';
import * as NURBSUtils from './NURBSUtils.js';

/**************************************************************
 *	NURBS curve
 *	knots Array of reals
 *	controlPoints Array of Vector(2|3|4)
 **************************************************************/

export default function NURBSCurve ( degree, knots, controlPoints ) {

	this.degree = degree;
	this.knots = knots;
	this.controlPoints = [];
	for (var i = 0; i < controlPoints.length; ++ i) { // ensure Vector4 for control points
		var point = controlPoints[i];
		this.controlPoints[i] = new THREE.Vector4(point.x, point.y, point.z, point.w);
	}
	// Closed curves force their first span to be a single point. Since a
	// span consists of a number of knots equal to the degree, we must skip
	// the first knots to avoid extrapolation artifacts for parametric values
	// outside the domain of the curve. iMin and iMax are integer Numbers that
	// store the beginning and ending index which contain the renderable
	// domain of the curve.
	this.iMin = 0;
	this.iMax = this.knots.length-1;
	if (this.isClosed()) {
		this.iMin = this.degree;
		this.iMax = this.knots.length-1-this.degree;
	}
}


NURBSCurve.prototype = Object.create( THREE.Curve.prototype );
NURBSCurve.prototype.constructor = NURBSCurve;

NURBSCurve.prototype.isClosed = function ( ) {
	var start = this._getPointByParameter(this.knots[this.degree]);
	var end = this._getPointByParameter(this.knots[this.knots.length-1-this.degree]);
	start.sub(end);
	var TOLERANCE = 0.000001;
	return start.length() < TOLERANCE;
};

NURBSCurve.prototype.getPoint = function ( t ) {
	var u = this.knots[this.iMin] + t * (this.knots[this.iMax] - this.knots[this.iMin]); // linear mapping t->u
	return this._getPointByParameter(u);
};

NURBSCurve.prototype._getPointByParameter = function ( u ) {

	// following results in (wx, wy, wz, w) homogeneous point
	var hpoint = NURBSUtils.calcBSplinePoint(this.degree, this.knots, this.controlPoints, u);

	if (hpoint.w != 1.0) { // project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
		hpoint.divideScalar(hpoint.w);
	}

	return new THREE.Vector3(hpoint.x, hpoint.y, hpoint.z);
};


NURBSCurve.prototype.getTangent = function ( t ) {

	var u = this.knots[0] + t * (this.knots[this.knots.length - 1] - this.knots[0]);
	var ders = NURBSUtils.calcNURBSDerivatives(this.degree, this.knots, this.controlPoints, u, 1);
	var tangent = ders[1].clone();
	tangent.normalize();

	return tangent;
};

