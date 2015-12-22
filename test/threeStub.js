/*
 * Stubbed functions for three.js
 */

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

THREE.Euler = function () {
    this.order = '';
};
THREE.Euler.prototype.set = function () { return this; };

THREE.Object3D = function () {
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.add = function () {};
    this.type = 'Object3D';
};

THREE.Mesh = function () {

    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();

    this.updateMatrix = function () {};
    this.lookAt = function () {};
    this.geometry = {
        applyMatrix: function () {}
    };
    this.type = 'Mesh';
};

THREE.BufferGeometry = function () {
    this.addAttribute = function () {},
    this.computeBoundingBox = function () {}
};

THREE.Points = function () {
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.type = 'Points';
};

THREE.ArrowHelper = function () {
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.type = 'Object3D';
};

THREE.Line = function () {
    this.position = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.type = 'Line';
};

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

THREE.Shape = function () {
    this.moveTo = function () {};
    this.holes = [];
};

THREE.Geometry = function () {
    this.vertices = [];
    this.faces = [];
    this.computeBoundingSphere = function () {};
    this.computeFaceNormals = function () {};
};

THREE.ParametricGeometry = function () {
    this.computeBoundingSphere = function () {};
    this.computeFaceNormals = function () {};
};

THREE.ShapeGeometry = function () {
    this.vertices = [];
    this.computeBoundingSphere = function () {};
    this.computeFaceNormals = function () {};
};

THREE.CylinderGeometry = function () {};
THREE.SphereBufferGeometry = function () {};
THREE.TorusGeometry = function () {};
THREE.BoxGeometry = function () {};
THREE.CircleGeometry = function () {};
THREE.PlaneBufferGeometry = function () {};
THREE.MeshPhongMaterial = function() {};
THREE.PointsMaterial = function() {};
THREE.LineBasicMaterial = function() {};
THREE.Face3 = function () {};
THREE.Vector4 = function () {};
THREE.Face3 = function () {};
THREE.BufferAttribute = function () {};
THREE.NURBSSurface = function () {};