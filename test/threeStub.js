/*
 * Stubbed functions for three.js
 */
'use strict';
var THREE = { REVISION: 'stub' };

THREE.DoubleSide=null;

THREE.Vector3 = function () {};
THREE.Vector3.prototype.copy = function () { return this; };
THREE.Vector3.prototype.clone = function () { return this; };
THREE.Vector3.prototype.add = function () { return this; };
THREE.Vector3.prototype.set = function () { return this; };
THREE.Vector3.prototype.length = function () { return 1; };
THREE.Vector3.prototype.normalize = function () { return this; };
THREE.Vector3.prototype.sub = function () { return this; };
THREE.Vector3.prototype.dot = function () { return 0.0; };
THREE.Vector3.prototype.multiplyScalar = function () { return this; };
THREE.Vector3.prototype.crossVectors = function () { return this; };
THREE.Vector3.prototype.angleTo = function () { return 0.1; };
THREE.Vector3.prototype.applyAxisAngle = function () { return 0.1; };
THREE.Vector3.prototype.distanceToSquared = function () { return 0.1; };

THREE.Euler = function () {
    this.order = '';
};
THREE.Euler.prototype.set = function () { return this; };

THREE.Shape = function () {
    this.moveTo = function () {};
    this.holes = [];
};
THREE.Face3 = function (a, b, c) {
    this.a=0;
    this.b=0;
    this.c=0;
    this.normal = new THREE.Vector3();
    this.vertexNormals = [];
};

THREE.Color = function () {
    this.r = 0;
    this.g = 0;
    this.b = 0;
};
THREE.Color.prototype.clone = function () { return this; };
THREE.Color.prototype.set = function () { return this; };
THREE.Color.prototype.setRGB = function () { return this; };
THREE.Color.prototype.multiplyScalar = function () { return this; };

THREE.Material = function() {
    this.color = new THREE.Color();
};
THREE.Material.prototype.clone = function () { return this; };

THREE.MeshPhongMaterial = function() {
    THREE.Material.call(this);
};
THREE.MeshPhongMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.MeshPhongMaterial.prototype.constructor = THREE.MeshPhongMaterial;

THREE.PointsMaterial = function() {
    THREE.Material.call(this);
};
THREE.PointsMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.PointsMaterial.prototype.constructor = THREE.PointsMaterial;

THREE.LineBasicMaterial = function() {
    THREE.Material.call(this);
};
THREE.LineBasicMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.LineBasicMaterial.prototype.constructor = THREE.LineBasicMaterial;

THREE.Vector4 = function () {};
THREE.BufferAttribute = function () {};
THREE.NURBSSurface = function () {
    this.getPoint = function () {};
};

//----Buffer Geometry
THREE.BufferGeometry = function () {
    this.addAttribute = function () {};
    this.computeBoundingBox = function () {};
    this.fromGeometry = function () {
        return this;
    };
    this.dispose = function() {};
    this.type = 'BufferGeometry';
};
THREE.SphereBufferGeometry = function () {};
THREE.SphereBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.SphereBufferGeometry.prototype.constructor = THREE.SphereBufferGeometry;

THREE.PlaneBufferGeometry = function () {};
THREE.PlaneBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.PlaneBufferGeometry.prototype.constructor = THREE.PlaneBufferGeometry;

//----Geometry
THREE.Geometry = function () {
    this.vertices = [];
    this.faces = [];
    this.computeBoundingSphere = function () {};
    this.computeFaceNormals = function () {};
    this.computeVertexNormals = function () {};
    this.applyMatrix = function () {};
    this.dispose = function() {};
    this.type = 'Geometry';
};

THREE.ParametricGeometry = function () {
    THREE.Geometry.call(this);
    this.computeBoundingSphere = function () {};
    this.computeFaceNormals = function () {};
};
THREE.ParametricGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.ParametricGeometry.prototype.constructor = THREE.ParametricGeometry;

THREE.ShapeGeometry = function () {
    THREE.Geometry.call(this);
    this.vertices = [];
    this.computeBoundingSphere = function () {};
    this.computeFaceNormals = function () {};
};
THREE.ShapeGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.ShapeGeometry.prototype.constructor = THREE.ShapeGeometry;

THREE.CylinderGeometry = function () {
    THREE.Geometry.call(this);
};
THREE.CylinderGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.CylinderGeometry.prototype.constructor = THREE.CylinderGeometry;

THREE.TorusGeometry = function () {
    THREE.Geometry.call(this);
};
THREE.TorusGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.TorusGeometry.prototype.constructor = THREE.TorusGeometry;

THREE.BoxGeometry = function () {
    THREE.Geometry.call(this);
};
THREE.BoxGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.BoxGeometry.prototype.constructor = THREE.BoxGeometry;

THREE.CircleGeometry = function () {
    THREE.Geometry.call(this);
};
THREE.CircleGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.CircleGeometry.prototype.constructor = THREE.CircleGeometry;


//----Object3D

THREE.Object3D = function () {
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.children = [];
    this.type = 'Object3D';
};
THREE.Object3D.prototype.add = function (x) { this.children.push(x); };
THREE.Object3D.prototype.updateMatrixWorld = function () {};
THREE.Object3D.prototype.traverse = function () {};

THREE.Mesh = function () {
    THREE.Object3D.call(this);
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();

    this.updateMatrix = function () {};
    this.updateMatrixWorld = function () {};
    this.lookAt = function () {};
    this.geometry = new THREE.Geometry();
    this.material = new THREE.Material();
    this.type = 'Mesh';
};
THREE.Mesh.prototype = Object.create(THREE.Object3D.prototype);
THREE.Mesh.prototype.constructor = THREE.Mesh;

THREE.Points = function () {
    THREE.Mesh.call(this);
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.type = 'Points';
};
THREE.Points.prototype = Object.create(THREE.Mesh.prototype);
THREE.Points.prototype.constructor = THREE.Points;

THREE.ArrowHelper = function () {
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.type = 'Object3D';
};
THREE.ArrowHelper.prototype = Object.create(THREE.Object3D.prototype);
THREE.ArrowHelper.prototype.constructor = THREE.ArrowHelper;

THREE.Line = function () {
    THREE.Mesh.call(this);
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.type = 'Line';
};
THREE.Line.prototype = Object.create(THREE.Mesh.prototype);
THREE.Line.prototype.constructor = THREE.Line;

THREE.NURBSCurve = function () {
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.getPoints = function () {};
};

THREE.TextHelper = function () {

    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();

    this.lookAt = function () {};
    this.type = 'textHelper';
};
THREE.TextHelper.prototype = Object.create(THREE.Object3D.prototype);
THREE.TextHelper.prototype.constructor = THREE.TextHelper;
