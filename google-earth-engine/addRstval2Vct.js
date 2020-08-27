/*
This script add the raster value of a binary raster file to a vector file.
-> Only works with binary raster files!
  Input:
    table        = vector polygon file to add the raster value
    table2       = boundary box of table


  Parameter:
    export_name  = name of the exported grid file
    format       = export format

    attribute (51) = set attribute and new column names


  Output:
    grid          = input vector file with added raster value


Author: Mario Blersch, 02.08.2020, mario.blersch@posteo.de
*/


// rename table to grid
var grid = table;

// rename table2 to extent
var extent = table2;                       // the extent is the bounadry box of the input file

// set raster file
var image = ee.ImageCollection('users/mattia80/WSF2015_v1').mosaic();        // import WSF-2015 layer

//
var export_name = "rvalAdded2Vct";
var format = "GeoJSON";


// add raster value to vector feature
var addStats = function(feature){
  var roiGeom = feature.geometry();                                      // set region of interest (roi)
  var image_clip = image.clip(roiGeom);                                  // clip image to roi

  // Reduce the region. The region parameter is the Feature geometry.
  var maxDictionary = image_clip.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: feature.geometry(),
    scale: 10,
    maxPixels: 1e9
  });                    // get maximal value of the band
  var valWSF = maxDictionary.get("b1");                     // get WSF value from data dictionary
  var grid_new = feature.set({wsf_in: valWSF});
  return grid_new;
};                // add raster value to vector feature

var gridRvalueAdded = grid.map(addStats);                                       // add raster value to all vector features
var gridRvalueAdded_fltr = gridRvalueAdded.filter(ee.Filter.gt("wsf_in", 1));   // get all vector features -> here: wsf_in == 1


print('Feature with added raster value', gridRvalueAdded.limit(15));                     // print vector features
print('Filteres features with added raster value', gridRvalueAdded_fltr.limit(15));      // print filtered vector features


// Export the FeatureCollection to a JSON file.
Export.table.toDrive({
  collection: gridRvalueAdded,
  description: export_name,
  fileFormat: format
});


// Visualize the raster file and the vector file with added value
Map.centerObject(grid.first(), 14);
Map.addLayer(image, {palette: '#000000'}, 'WSF2015 v1');
Map.addLayer(grid, {color: 'FF0000'}, 'grid layer');
