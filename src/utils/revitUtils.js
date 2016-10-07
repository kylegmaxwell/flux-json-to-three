/**
 * set of helpers fpr revit elements
 */

'use strict';

/**
* Helper function to extract mesh from geometry
* from a revitElement object.
*
* @function extractGeom
*
* @param { object } data The revitElement object to extract geometry.
*
* @return { Array.<object> } An array of mesh objects.
*/
export function extractGeom (data) {
    // TODO(Jaydeep) check data against Revit Schema here.
    if (data.geometryParameters && data.geometryParameters.geometry) {
        var meshData = data.geometryParameters.geometry;
        if (data.attributes && data.attributes.materialProperties) {
            if (meshData.constructor === Array) {
                for(var i=0; i < meshData.length; ++i) {
                    if (!meshData[i].attributes) {
                        meshData[i].attributes = {};
                    }
                    meshData[i].attributes.materialProperties = data.attributes.materialProperties;
                }
            }
        }
        return meshData;
    }
    return data;
}
