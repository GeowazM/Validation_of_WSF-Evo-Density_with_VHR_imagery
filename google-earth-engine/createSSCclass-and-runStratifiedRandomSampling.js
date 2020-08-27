/*
This script uses reclassify the normalized SSC index values SSC class scheme after Palacios-Lopez et al. (2019), join the climate zone after Kottek et al. (2006) and apply a stratified random sampling.
  Input:
    table        = vector polygon file with normalized SSC index
    geometry     = polygon cover the area of table
    kg           = vecor file for stratification
    noSamples    = number of samples per stratification -> here: SSC class & climate zone

  Parameter:
    stratified_low_label     = name for the sampled files within SSC class low
    stratified_medium_label  = name for the sampled files within SSC class medium
    stratified_high_label    = name for the sampled files within SSC class high
    exportFileFormat  = export format

    attributes   = set attributes and new column names in the functions


  Output:
    vector file for SSC class low     = result of the stratified random sampling
    vector file for SSC class medium  = result of the stratified random sampling
    vector file for SSC class high    = result of the stratified random sampling

Author: Mario Blersch, 02.05.2020, mario.blersch@posteo.de
*/

// table rename to ssc
var ssc = table;

// Label export files
var stratified_low_label = 'ikonos_2007_grid_003_sscIndex2_sel_sampling_low';
var stratified_medium_label = 'ikonos_2007_grid_003_sscIndex2_sel_sampling_medium';
var stratified_high_label = 'ikonos_2007_grid_003_sscIndex2_sel_sampling_high';

var exportFileFormat = "GeoJSON";


var noSamples = 2;



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Structure of the script:

0.  Functions
1.  Spatial Join                              -> ausgelagert (Skript: 03_spatial_join)
2.  Reclass SSC Index                         (after Palacios et al. (2019), Paper: https://elib.dlr.de/130168/)
3.  SSC class                                 -> For classes "low" (I), "medium" (II) & "high" (III), respectivly
    a) Set SSC class value
    b) Segregate grids                        via Koeppen-Geiger
    c) Set climate zone value
    d) Merge climate zone
    e) Sample wihtin the SSC class            via Koeppen-Geiger
    f) Export sample

*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////





////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// 0. Functions //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
// functions to reclassify (reorder) climate zones
var classBW = function(feature){
  return feature.set({klima_2:1}); // 1 = BW
};
var classCf = function(feature){
  return feature.set({klima_2:2}); // 2 = Cf
};
var classCs = function(feature){
  return feature.set({klima_2:3}); // 3 = Cs
};
var classCw = function(feature){
  return feature.set({klima_2:4}); // 4 = Cw
};
var classD = function(feature){
  return feature.set({klima_2:5});  // 5 = D
};
var classA = function(feature){
  return feature.set({klima_2:6});  // 6 = A
};

// Functions to set SSC class values into the (filtered) featureCollections -> Source: Palacios et al. (2019) [Paper: https://elib.dlr.de/130168/]
var sscClassLow = function(feature){
  return feature.set({gee_ssc_class:1});             // low
};
var sscClassMedium = function(feature){
  return feature.set({gee_ssc_class:2});             // medium
};
var sscClassHigh = function(feature){
  return feature.set({gee_ssc_class:3});             // high
};



////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// 1. Spatial Join ////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
var mappedGrid = kg.map(function(feat){                                   // map over all the grids
  feat = ee.Feature(feat);
  var name = feat.get('DN');
  var zonesFilt = table.filterBounds(feat.geometry()).map(function(zone){
    return ee.Feature(zone).set('klima', name);
  });
  return zonesFilt;
}).flatten();


var ssc = mappedGrid;                                                   // rename variable for further analysis



/////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////  2. Reclass SSC Index ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
//// Filter featureCollection to burn class value                           -> Source: Palacios et al. (2019) [Paper: https://elib.dlr.de/130168/]
var table = table.filter(ee.Filter.greaterThan("gee_ssc_no", 0));

var ssc_l = table.filter(ee.Filter.lessThanOrEquals("gee_ssc_no", 1));           // SSC class "low" (0-1)
var ssc_m = table.filter(ee.Filter.lessThanOrEquals("gee_ssc_no", 1.8));
var ssc_m = ssc_m.filter(ee.Filter.greaterThan("gee_ssc_no", 1));                // SSC class "medium" (1-1.8)
var ssc_h = table.filter(ee.Filter.greaterThan("gee_ssc_no", 1.8));              // SSC class "high" (1-10)

//print amount of grids (features) within one class
//print('Filter low', ssc_l.size());
//print('Filter medium', ssc_m.size());
//print('Filter high', ssc_h.size());




//////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// 3. SSC class - I. LOW //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

// a) Set ssc class value to features
var ssc_low = ssc_l.map(sscClassLow);
//print('ssc low', ssc_low);                    // check intermediate result
//print('Total low', ssc_low.size());
//print('SSC class low example', ssc_low.first());


// b) Simplify (reclassify) climate zones
var bw = ssc_low.filter(ee.Filter.rangeContains("klima", 5, 8));
var cf = ssc_low.filter(ee.Filter.rangeContains("klima", 9, 11));
var cs = ssc_low.filter(ee.Filter.rangeContains("klima", 12, 14));
var cw = ssc_low.filter(ee.Filter.rangeContains("klima", 15, 17));
var d = ssc_low.filter(ee.Filter.rangeContains("klima", 18, 29));
var a = ssc_low.filter(ee.Filter.rangeContains("klima", 2, 4));
//print('Climate zone Bw', bw.size());

// c) Set climate zone value into grid
var bw_new = bw.map(classBW); //print('Number of grids in climate zone BW', bw_new.size());
var cf_new = cf.map(classCf); //print('Number of grids in climate zone Cf',cf_new.size());
var cs_new = cs.map(classCs); //print('Number of grids in climate zone Cs',cs_new.size());
var cw_new = cs.map(classCw); //print('Number of grids in climate zone Cs',cs_new.size());
var d_new = d.map(classD);    //print('Number of grids in climate zone D',d_new.size());
var a_new = a.map(classA);    //print('Number of grids in climate zone A',a_new.size());



// d) Merge featureCollections
var bw_cf = cf_new.merge(bw_new);
var bw_cf_cs = bw_cf.merge(cs_new);
var bw_cf_cs_cw = bw_cf_cs.merge(cw_new);
var bw_cf_cs_cw_d = bw_cf_cs_cw.merge(d_new);
var bw_cf_cs_d_a = bw_cf_cs_cw_d.merge(a_new);
//print('Merged climate zones', bw_cf_cs_d_a.limit(150));
//print('Number of merged climate zones', bw_cf_cs_d_a.size());
//print('Total number grids', ssc_low.size());


// e) Sample wihtin the SSC class "low" via Koeppen-Geiger
var data = bw_cf_cs_d_a;
// featureCollection to Image + property -> herein "class"
var classes = ee.Image().byte().paint(data, "klima_2").rename("klima_2");
//print('Image classes', classes);
//Map.addLayer(classes, {}, 'classes');
//Map.centerObject(ROI);
//Map.addLayer(classes,{min:1,max:3,palette: ['yellow', 'orange', 'red']}, 'classes image');



var stratified_low = classes.addBands(ee.Image.pixelLonLat())
    .stratifiedSample({
      numPoints: noSamples,                             // number of generated points
      classBand: 'klima_2',
      projection: 'EPSG:4326',
      scale: 100,
      region: geometry.getInfo()
    }).map(function(f) {
      return f.setGeometry(ee.Geometry.Point([f.get('longitude'), f.get('latitude')]));
    });

//print('Stratified image', stratified_low);
//print ('Histogram', stratified.reduceColumns(ee.Reducer.frequencyHistogram(),['class']));
//Map.addLayer(stratified, {color: 'black'}, 'Noemi');


// Export the FeatureCollection to a KML file.
Export.table.toDrive({
  collection: stratified_low,
  description: stratified_low_label,
  fileFormat: exportFileFormat
});




///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// 3. SSC class - II. MEDIUM ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

// Set ssc class value to features
var ssc_low = ssc_m.map(sscClassMedium);
//print('ssc low', ssc_low);                    // check intermediate result
//print('Total medium', ssc_low.size()); print('SSC class medium example', ssc_low.first());


// simplify climate zone
var bw = ssc_low.filter(ee.Filter.rangeContains("klima", 5, 8));
var cf = ssc_low.filter(ee.Filter.rangeContains("klima", 9, 11));
var cs = ssc_low.filter(ee.Filter.rangeContains("klima", 12, 14));
var cw = ssc_low.filter(ee.Filter.rangeContains("klima", 15, 17));
var d = ssc_low.filter(ee.Filter.rangeContains("klima", 18, 29));
var a = ssc_low.filter(ee.Filter.rangeContains("klima", 2, 4));

//print('Climate zone A', a.size());

var bw_new = bw.map(classBW);     //print('Number of grids in climate zone BW', bw_new.size());
var cf_new = cf.map(classCf);     //print('Number of grids in climate zone Cf',cf_new.size());
var cs_new = cs.map(classCs);     //print('Number of grids in climate zone Cs',cs_new.size());
var cw_new = cs.map(classCw);     //print('Number of grids in climate zone Cs',cs_new.size());
var d_new = d.map(classD);        //print('Number of grids in climate zone D',d_new.size());
var a_new = a.map(classA);        //print('Number of grids in climate zone A',a_new.size());



// Merge featureCollections
var bw_cf = cf_new.merge(bw_new);
var bw_cf_cs = bw_cf.merge(cs_new);
var bw_cf_cs_cw = bw_cf_cs.merge(cw_new);
var bw_cf_cs_cw_d = bw_cf_cs_cw.merge(d_new);
var bw_cf_cs_d_a = bw_cf_cs_cw_d.merge(a_new);
//print('Merged climate zones', bw_cf_cs_d_a.limit(150));
//print('Number of merged climate zones', bw_cf_cs_d_a.size());
//print('Total number grids', ssc_low.size());


// Sample wihtin the SSC class "low" via Koeppen-Geiger
var data = bw_cf_cs_d_a;

// featureCollection to Image + property -> herein "class"
var classes = ee.Image().byte().paint(data, "klima_2").rename("klima_2");
//print('Image classes', classes);
//Map.addLayer(classes, {}, 'classes');

//Map.centerObject(ROI);
//Map.addLayer(classes,{min:1,max:3,palette: ['yellow', 'orange', 'red']}, 'classes image');



var stratified_medium = classes.addBands(ee.Image.pixelLonLat())
    .stratifiedSample({
      numPoints: noSamples,                             // number of generated points
      classBand: 'klima_2',
      projection: 'EPSG:4326',
      scale: 100,
      region: geometry.getInfo()
    }).map(function(f) {
      return f.setGeometry(ee.Geometry.Point([f.get('longitude'), f.get('latitude')]));
    });

//print('Stratified image', stratified_medium);
//print ('Histogram', stratified.reduceColumns(ee.Reducer.frequencyHistogram(),['class']));
//Map.addLayer(stratified_medium, {color: 'black'}, 'Noemi');


// Export the FeatureCollection to a KML file.
Export.table.toDrive({
  collection: stratified_medium,
  description: stratified_medium_label,                               //'ikonos_2001_grid_003_sscIndex_sel_sscClass_KG_sampling_medium',
  fileFormat: exportFileFormat
});




//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// 4. SSC class - III. HIGH ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

// Set ssc class value to features
var ssc_low = ssc_h.map(sscClassHigh);                 //print('ssc low', ssc_low);                    // check intermediate result
//print('Total high', ssc_low.size()); print('SSC class high example', ssc_low.first());


// simplify climate zone
var bw = ssc_low.filter(ee.Filter.rangeContains("klima", 5, 8));
var cf = ssc_low.filter(ee.Filter.rangeContains("klima", 9, 11));
var cs = ssc_low.filter(ee.Filter.rangeContains("klima", 12, 14));
var cw = ssc_low.filter(ee.Filter.rangeContains("klima", 15, 17));
var d = ssc_low.filter(ee.Filter.rangeContains("klima", 18, 29));
var a = ssc_low.filter(ee.Filter.rangeContains("klima", 2, 4));

//print('Climate zone A', a.size());

var bw_new = bw.map(classBW);  //print('Number of grids in climate zone BW', bw_new.size());
var cf_new = cf.map(classCf);  //print('Number of grids in climate zone Cf',cf_new.size());
var cs_new = cs.map(classCs);  //print('Number of grids in climate zone Cs',cs_new.size());
var cw_new = cs.map(classCw);  //print('Number of grids in climate zone Cs',cs_new.size());
var d_new = d.map(classD);    //print('Number of grids in climate zone D',d_new.size());
var a_new = a.map(classA);    //print('Number of grids in climate zone A',a_new.size());



// Merge featureCollections
var bw_cf = cf_new.merge(bw_new);
var bw_cf_cs = bw_cf.merge(cs_new);
var bw_cf_cs_cw = bw_cf_cs.merge(cw_new);
var bw_cf_cs_cw_d = bw_cf_cs_cw.merge(d_new);
var bw_cf_cs_d_a = bw_cf_cs_cw_d.merge(a_new);
//print('Merged climate zones', bw_cf_cs_d_a.limit(150));
//print('Number of merged climate zones', bw_cf_cs_d_a.size());
//print('Total number grids', ssc_low.size());


// Sample wihtin the SSC class "low" via Koeppen-Geiger
var data = bw_cf_cs_d_a;

// featureCollection to Image + property -> herein "class"
var classes = ee.Image().byte().paint(data, "klima_2").rename("klima_2");
//print('Image classes', classes);
//Map.addLayer(classes, {}, 'classes');
//Map.centerObject(ROI);
//Map.addLayer(classes,{min:1,max:3,palette: ['yellow', 'orange', 'red']}, 'classes image');



var stratified_high = classes.addBands(ee.Image.pixelLonLat())
    .stratifiedSample({
      numPoints: noSamples,                             // number of generated points
      classBand: 'klima_2',
      projection: 'EPSG:4326',
      scale: 100,
      region: geometry.getInfo()
    }).map(function(f) {
      return f.setGeometry(ee.Geometry.Point([f.get('longitude'), f.get('latitude')]));
    });

//print('Stratified image', stratified_high);
//print ('Histogram', stratified.reduceColumns(ee.Reducer.frequencyHistogram(),['class']));
//Map.addLayer(stratified_high, {color: 'black'}, 'Noemi');


// Export the FeatureCollection to a KML file.
Export.table.toDrive({
  collection: stratified_high,
  description: stratified_high_label,                                    //'ikonos_2001_grid_003_sscIndex_sel_sscClass_KG_sampling_high',
  fileFormat: exportFileFormat
});



print('Low', stratified_low.size());
print('Medium', stratified_medium.size());
print('High', stratified_high.size());
