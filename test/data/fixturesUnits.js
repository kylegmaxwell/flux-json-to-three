/*
 * A set of fixtures for the parasolid util tests
 */
'use strict';

export var cone = {
    "start": {
        "units":{
            "origin": "km",
            "height": "cm",
            "radius": "in",
            "semiAngle": "m"
        },
        "height":10,
        "origin":[0,0,0],
        "primitive":"cone",
        "radius":10,
        "semiAngle":10
    },
    "end": {
        "units":{
            "origin": "meters",
            "height": "meters",
            "radius": "meters",
            "semiAngle": "meters"
        },
        "height":0.1,
        "origin":[0,0,0],
        "primitive":"cone",
        "radius":0.254,
        "semiAngle":10
    },
    "succeed":true
};

export var caseSensitiveUnitKeys = {
    "start": {
        "units":{
            "ORIGIN": "km",
            "height": "cm",
            "radius": "in",
            "semiAngle": "m"
        },
        "height":10,
        "origin":[0,0,0],
        "primitive":"cone",
        "radius":10,
        "semiAngle":10
    },
    "end": {
        "units":{
            "ORIGIN": "km", // should ignore unmatched units (case sensitive)
            "height": "meters",
            "radius": "meters",
            "semiAngle": "meters"
        },
        "height":0.1,
        "origin":[0,0,0],
        "primitive":"cone",
        "radius":0.254,
        "semiAngle":10
    },
    "succeed":true
};

export var sphere = {
    "start": {
        "height": 10,
        "origin": [0,0,0],
        "primitive": "sphere",
        "radius": 60,
        "units": {
            "origin": "m",
            "radius": "shrekles"
        }
    },
    "end": {
        "height": 10,
        "origin": [0,0,0],
        "primitive": "sphere",
        "radius": 1.8288,
        "units": {
            "origin": "meters",
            "radius": "meters"
        }
    },
    "succeed":true
};

export var caseSensitiveMeasure = {
    "start": {
        "height": 10,
        "origin": [0,0,0],
        "primitive": "sphere",
        "radius": 60,
        "units": {
            "radius": "Mm"
        }
    },
    "end": {
        "height": 10,
        "origin": [0,0,0],
        "primitive": "sphere",
        "radius": 60000000,
        "units": {
            "radius": "meters"
        }
    },
    "succeed":true
};

export var polyline = {
    "start": {
        "units":{
            "points":"foot"
        },
        "points":[[0,0,5],[1,0,5],[2,2,5],[0,1,5]],
        "primitive":"polyline"
    },
    "end": {
        "units":{
            "points":"meters"
        },
        "points":[[0,0,1.524],[0.3048,0,1.524],[0.6096,0.6096,1.524],[0,0.3048,1.524]],
        "primitive":"polyline"
    },
    "succeed":true
};

// Aggregate entity with units at top level
export var polysurface = {
    "start": {
        "units":{
            "surfaces/0/controlPoints":"cm"
        },
        "surfaces":[{
            "controlPoints":[[[-8,8,0],[8,8,0]],[[-8,-8,0],[8,-8,0]]],
            "primitive":"surface",
            "uDegree":1,
            "uKnots":[0,0,1,1],
            "vDegree":1,
            "vKnots":[0,0,1,1]
        }, {
            "controlPoints":[[[-20,8,9],[-8,8,0]],[[-20,-8,9],[-8,-8,0]]],
            "primitive":"surface",
            "uDegree":1,
            "uKnots":[0,0,1,1],
            "vDegree":1,
            "vKnots":[0,0,1,1]
        }],
        "primitive":"polysurface"
    },
    "end": {
        "units":{
            "surfaces/0/controlPoints":"meters"
        },
        "surfaces":[{
            "controlPoints":[[[-0.08,0.08,0],[0.08,0.08,0]],[[-0.08,-0.08,0],[0.08,-0.08,0]]],
            "primitive":"surface",
            "uDegree":1,
            "uKnots":[0,0,1,1],
            "vDegree":1,
            "vKnots":[0,0,1,1]
        }, {
            "controlPoints":[[[-20,8,9],[-8,8,0]],[[-20,-8,9],[-8,-8,0]]],
            "primitive":"surface",
            "uDegree":1,
            "uKnots":[0,0,1,1],
            "vDegree":1,
            "vKnots":[0,0,1,1]
        }],
        "primitive":"polysurface"
    },
    "succeed":true
};

// Aggregate entity with units on each child
var polycurve = {
    "start": {
        "curves":[
            { // curve 1
                "units":{
                    "controlPoints":"cm"
                },
                "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],"degree":3,
                "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"
            },
            { // curve 2
                "units":{
                    "start":"km"
                },
                "start":[1,0,0],"middle":[0,1,0],"end":[-1,0,0],"primitive":"arc"
            }
        ],"primitive":"polycurve"
    },
    "end": {
        "curves":[
            { // curve 1
                "units":{
                    "controlPoints":"meters"
                },
                "controlPoints":[[0,0,0],[0.01,0,0],[0.01,0.01,0],[0,0.01,0]],"degree":3,
                "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"
            },
            { // curve 2
                "units":{
                    "start":"meters"
                },
                "start":[1000,0,0],"middle":[0,1,0],"end":[-1,0,0],"primitive":"arc"
            }
        ],"primitive":"polycurve"
    },
    "succeed":true
};

// Test children of aggregate entity
export var polycurve0 = {
    "start": polycurve.start.curves[0],
    "end": polycurve.end.curves[0],
    "succeed": polycurve.succeed
};

export var polycurve1 = {
    "start": polycurve.start.curves[1],
    "end": polycurve.end.curves[1],
    "succeed": polycurve.succeed
};

export var mesh = {
    "start": {
        "units":{
            "vertices":"um"
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "units":{
            "vertices":"meters"
        },
        "vertices": [[-0.000001,0,0],[0,0.000001,0.000002],[0.000001,0,0],[0,-0.000001,0.000002]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};

export var badUnitsPath1 = {
    "start": {
        "units":{
            "vertices/x":"mmmm"
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "units":{
            "vertices/x":"mmmm"
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};

export var badUnitsPath2 = {
    "start": {
        "units":{
            "stuff/thing":"um"
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "units":{
            "stuff/thing":"um"
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};

export var badUnitsType = {
    "start": {
        "units":{
            "vertices":"not a unit"
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "units":{
            "vertices":"not a unit"
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};

export var noUnits = {
    "start": {
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};

export var noSpecificUnits = {
    "start": {
        "units":{
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "units":{
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};

export var nonLengthUnits = {
    "start": {
        "units":{
            "attributes/energy":"kwh"
        },
        "attributes":{
            "energy":5
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "units":{
            "attributes/energy":"meters"
        },
        "attributes":{
            "energy":5
        },
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};

export var nullUnits = {
    "start": {
        "units":null,
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "end": {
        "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
        "faces":[[0,3,1],[1,3,2]], "primitive":"mesh"
    },
    "succeed":true
};