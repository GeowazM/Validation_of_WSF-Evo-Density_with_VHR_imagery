/*
This script create a grid with a specific heigth and width length and copy the attributes of the input vector file.
  Input:
    table        = vector polygon file


  Parameter:
    export_name  = name of the exported grid file
    format       = export format

    dx  = heigth of the grid (in degree)
    dy = width of the grid (in degree)

    attributes (40:61) = set attributes and new column names


  Output:
    grid          = gridded input polygons

Author: Mario Blersch, 27.08.2020, mario.blersch@posteo.de
*/


// rename table
var polygons = table;

// export labeling
var export_name = "wv2-2010";
var format = "GeoJSON";



// import grid creation module
var g = require('users/gena/packages:grid');                        // import functions for grid creation
                                                                    // Source: https://gee-community.github.io/GEE-Dev-Docs/staging/staging.html
                                                                    // Script: https://code.earthengine.google.com/ff50a3e4745b1e732b1b7ac8a12623b6


// Create grid for all features
var createGrid = function(feature){
    var dx = 0.03;                                                  // grid heigth
    var dy = 0.03;                                                  // grid width
    var grid = ee.FeatureCollection(g.generateGridForGeometry(feature.bounds(), dx, dy));          // generate grid for one feature via bbox & heigth/width

    var year = feature.get("date");                                 // Get attributes                 -> adapt required attributes to copy
    var kg = feature.get("Koeppen-Ge");
    var oid = feature.get("OBJECTID");
    var fid = feature.get("TARGET_FID");
    var noSeg = feature.get("noSegments");
    var ua = feature.get("urban_area");
    var segKm = feature.get("seg_pr_km2");
    var ratio_UaS = feature.get("ratio_UaS");
    var reg = feature.get("UNSD_M49_1");


    var loop = function(grid_feature){
      var gr = grid_feature.set({date:year});                        // write attributes into grid    -> adapt attribute for different vector file
      var gri = gr.set({klima:kg});
      var gridd = gri.set({objectID:oid});
      var gridN = gridd.set({featureID:fid});
      var gridNe = gridN.set({noSegments:noSeg});
      var gridNew = gridNe.set({urban_area:ua});
      var gridNewN = gridNew.set({seg_pr_km2:segKm});
      var gridNewNe = gridNewN.set({ratio_UrbSeg:ratio_UaS});
      var gridNewNew = gridNewNe.set({world_region:reg});
      return gridNewNew;
    };


    var newGrid = grid.map(loop);

    return newGrid;
};


var grid = polygons.map(createGrid);                                // create grid for each feature (polygon) in featureCollection (polygons)
var gridflat = grid.flatten();                                      // create a simpler featureCollection

// Print some feature of original file and new grid file
print('Polygons', polygons.limit(15));
print('Generated grids', gridflat.limit(15));

// Print total number of feature for original file and new grid file
print('Total number of polygons', polygons.size());
print('Total number of created grids', gridflat.size());

// Visualize original and new grid file on the map
Map.addLayer(polygons, {}, '2010');
Map.addLayer(gridflat, {}, 'Generated grids');                  // show created grid on the map


// Export the FeatureCollection
Export.table.toDrive({
  collection: gridflat,
  description: export_name,
  fileFormat: format
});
