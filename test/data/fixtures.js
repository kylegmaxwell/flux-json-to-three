'use strict';

// Each element in the tests array generates a test of one geometric primitive type
// "input" is the Flux JSON object representation
// "result" contains the expected type of the THREE.js object created
exports.tests = [
    {
        "input": {"origin":[0,0,0],"primitive":"sphere","radius":10},
        "result": {"type": "Mesh"},
    },
    {
        "input": {"origin":[0,0,0],"dimensions":[1,2,3],"axis":[0,0,1],"reference":[0,1,0],
            "primitive":"block"},
        "result": {"type": "Mesh"},
    },
    {
        "input": {"origin":[0,0,0],"primitive":"circle","radius":10},
        "result": {"type": "Line"},
    },
    {
        "input": {"axis":[1,1,1],"majorRadius":4,"minorRadius":1.1,
            "origin":[1,1,1],"primitive":"ellipse"},
        "result": {"type": "Line"},
    },
    {
        "input": {"origin":[0,0,0],"dimensions": [2,2], "primitive": "rectangle"},
        "result": {"type": "Line"},
    },
    {
        "input": {"origin":[5,5,0],"normal":[0,0,1],"primitive":"plane"},
        "result": {"type": "Mesh"},
    },
    {
        "input": {"point":[0,0,0],"primitive":"point"},
        "result": {"type":"Object3D"},
    },
    {
        "input": {"coords": [2,2,0], "primitive": "vector"},
        "result": {"type": "Line"},
    },
    {
        "input": {"end":[2,2,2],"primitive":"line","start":[1,1,1]},
        "result": {"type": "Line"},
    },
    {
        "input": {"controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],"degree":3,
            "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"},
        "result": {"type": "Line"},
    },
    {
        "input": {"curves":[{"controlPoints":[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],"degree":3,
            "knots":[0,0,0,1,2,3,3,3],"primitive":"curve"},{"degree":3,"knots":[0,0,0,0,14.1,14.1,14.1,14.1],
            "controlPoints":[[0,0,0],[-3.3,-3.3,0],[-6.6,-6.6,0],[-10,-10,0]],"primitive":"curve"},
            {"start":[1,0,0],"middle":[0,1,0],"end":[-1,0,0],"primitive":"arc"}],"primitive":"polycurve"},
        "result": {"type": "Line"},
        },
    {
        "input": {"start":[1,0,0],"middle":[0,1,0],"end":[-1,0,0],"primitive":"arc"},
        "result": {"type": "Line"},
    },
    { // test degenerate arc
        "input": {"start":[0,0,0],"middle":[1,1,0],"end":[0,0,0],"primitive":"arc"},
        "result": {"type": "Line"},
    },
    {
        "input": {"vertices": [[-1,0,0],[0,1,2],[1,0,0],[0,-1,2]],"faces":[[0,3,1],[1,3,2]],
            "primitive":"mesh"},
        "result": {"type": "Mesh"},
    },
    {
        "input": {"points":[[0,0,5],[1,0,5],[2,2,5],[0,1,5]],"primitive":"polyline"}, // TODO
        "result": {"type": "Line"},
    },
    {
        "input": {"controlPoints":[[[-8,8,0],[8,8,0]],[[-8,-8,0],[8,-8,0]]],
            "primitive":"surface","uDegree":1,"uKnots":[0,0,1,1],"vDegree":1,"vKnots":[0,0,1,1]},
        "result": {"type": "Mesh"},
    },
    {
        "input": {"surfaces":[{"controlPoints":[[[-8,8,0],[8,8,0]],[[-8,-8,0],[8,-8,0]]],
            "primitive":"surface","uDegree":1,"uKnots":[0,0,1,1],"vDegree":1,"vKnots":[0,0,1,1]},
            {"controlPoints":[[[-20,8,9],[-8,8,0]],[[-20,-8,9],[-8,-8,0]]], "primitive":"surface",
            "uDegree":1,"uKnots":[0,0,1,1],"vDegree":1,"vKnots":[0,0,1,1]}
            ],"primitive":"polysurface"},
        "result": {"type": "Mesh"},
    },
    {
        "input": {"align":[0,0,0],"direction":[0,-1,100],"origin":[0,-7,1],
            "primitive":"text","size":8,"color":"black","text":"Text!"},
        "result": {"type": "textHelper"},
    },
    {
        "input": {"info": "Not supported", "primitive": "test"},
        "result": null
    },
    {

        "input": {"primitive":"revitElement","fluxId":"Id-1",
            "familyInfo":{"category":"Walls","family":"WallFamily-1",
            "type":"WallType-1","placementType":"Invalid"},
            "geometryParameters":{
                "profile":[
                    {"units":{"end":"feet","start":"feet"},"end":[20.31,17.82,0],"primitive":"line","start":[-63.18,17.82,0]}],
                    "level":"Level-1","structural":true,"flipped":true,
                    "geometry": [
                        {
                            "faces": [[0,1,2]],
                            "vertices": [
                                [185.93365522966155,-48.9867499393609, 11.3234889800848443e-23],
                                [185.93365522966155,-48.9867499393609,37.401574803149416],
                                [185.93365522966155,-76.09632999185438,37.401574803149416]
                            ],
                            "primitive": "mesh",
                            "units": {}
                        }
                    ]
                },
            "instanceParameters":{},"typeParameters":{},"customParameters":{}},
        "result": {"type": "Mesh"},
    }
];
