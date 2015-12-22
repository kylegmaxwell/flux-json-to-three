/*
 * A set of fixtures for the parasolid util tests
 */

export var cone = {
    "input": {
        "direction":[1,1,1],
        "height":10,
        "origin":[0,0,0],
        "primitive":"cone",
        "radius":10,
        "semi-angle":10
    },
    "result": {
        "type": "Mesh"
    }
};

export var cylinder = {
    "input": {
        "axis":[10,20,30],
        "height":40,
        "origin":[0,0,0],
        "primitive":"cylinder",
        "radius":10
    },
    "result": {
        "type": "Mesh"
    }
};

export var sphere = {
    "input": {
        "origin":[0,0,0],
        "primitive":"sphere",
        "radius":10
    },
    "result": {
        "type": "Mesh"
    }
};

export var torus = {
    "input": {
        "origin": [0,0,0],
        "majorRadius": 5,
        "minorRadius":3,
        "axis":[0,0,1],
        "primitive":"torus"
    },
    "result": {
        "type": "Mesh"
    }
};

export var block = {
    "input": {
        "origin":[0,0,0],
        "dimensions":[1,2,3],
        "axis":[0,0,1],
        "reference":[0,1,0],
        "primitive":"block"
    },
    "result": {
        "type": "Mesh"
    }
};


export var circle = {
     "input": {
         "origin":[0,0,0],
         "primitive":"circle",
         "radius":10
     },
     "result": {
         "type": "Mesh"
     }
};

export var rectangle = {
    "input": {
        "dimensions": [2,2],
        "primitive": "rectangle"
    },
    "result": {
        "type": "Mesh"
    }
};

export var plane = {
    "input": {
        "origin":[5,5,0],
        "normal":[0,0,1],
        "primitive":"plane"
    },
    "result": {
        "type": "Mesh"
    }
};

export var point = {
    "input": {
        "point":[0,0,0],
        "primitive":"point"
    },
    "result": {
        "type":"Points"
    }
};

export var vector = {
    "input": {
        "coords": [2,2,0],
        "primitive": "vector"
    },
    "result": {
        "type": "Object3D"
    }
};

export var line = {
    "input": {
        "end":[2,2,2],
        "primitive":"line",
        "start":[1,1,1]
    },
    "result": {
        "type": "Line"
    }
};

export var curve = {
    "input": {
        "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],
        "degree":3,
        "knots":[0,0,0,1,2,3,3,3],
        "primitive":"curve"
    },
    "result": {
        "type": "Line"
    }
};

export var polycurve = {
    "input": {
        "curves":[{
            "controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],
            "degree":3,"knots":[0,0,0,1,2,3,3,3],
            "primitive":"curve"
        }, {
            "degree":3,
            "knots":[0,0,0,0,14.1,14.1,14.1,14.1],
            "controlPoints":[[0,0,0],[-3.3,-3.3,0],[-6.6,-6.6,0],[-10,-10,0]],
            "primitive":"curve"
        }],
        "primitive":"polycurve"
    },
    "result": {
        "type": "Object3D"
    }
};

export var arc = {
    "input": {
        "start":[1,0,0],
        "middle":[0,1,0],
        "end":[-1,0,0],
        "primitive":"arc"
    },
    "result": {
        "type": "Line"
    }
};

export var degenerateArc = { // test degenerate arc
    "input": {
        "start":[0,0,0],
        "middle":[1,1,0],
        "end":[0,0,0],
        "primitive":"arc"
    },
    "result": {
        "type": "Line"
    }
};

export var mesh = {
    "input": {
         "vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],
         "faces":[[0,3,1],[1,3,2]],
         "primitive":"mesh"
    },
    "result": {
        "type": "Mesh"
    }
};

export var polygonSet = {
    "input": {
        "polygons":[
            {"boundary":[[15,0,15], [0,13.0,0],[0,-13.0,0]],
            "holes":[[[10,0,10],[2,9.0,2],[2,-9.0,2]]]}
        ],
        "primitive":"polygonSet"
    },
    "result": {
        "type": "Mesh"
    },
};

export var polyline = {
    "input": {
        "points":[[0,0,5],[1,0,5],[2,2,5],[0,1,5]],
        "primitive":"polyline"
    },
    "result": {
        "type": "Line"
    }
};

export var surface = {
    "input": {
        "controlPoints":[[[-8,8,0],[8,8,0]],[[-8,-8,0],[8,-8,0]]],
        "primitive":"surface",
        "uDegree":1,
        "uKnots":[0,0,1,1],
        "vDegree":1,
        "vKnots":[0,0,1,1]
    },
    "result": {
        "type": "Mesh"
    }
};

export var polysurface = {
    "input": {
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
    "result": {
        "type": "Object3D"
    }
};

export var text = {
    "input": {
        "align":[0,0,0],
        "direction":[0,-1,100],
        "origin":[0,-7,1],
        "primitive":"text",
        "size":8,
        "text":"Text!"
    },
    "result": {
        "type": "textHelper"
    }
};

export var invalid = {
    "input": {
        "info": "Not supported",
        "primitive": "test"
    },
    "result": null
};

