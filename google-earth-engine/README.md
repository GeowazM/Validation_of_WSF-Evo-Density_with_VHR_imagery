# Scripts for Google Earth Engine

The following scripts were created to perform a stratified random sampling and validate the WSF-Evo-Density layer provided by DLR ([Team: Smart Cities and Spatial Development](https://www.dlr.de/eoc/en/desktopdefault.aspx/tabid-11925/20985_read-48802/))


This directory contain following scripts:
  
  #### a) createVctGrid.js
   * gridding a vector file
   * create grid vector file out of a polygon vector file
  
  #### b) calcSSCindex.js
   * calculate the normalized SSC index after Palacios-Lopez et al. (2019)
    
  #### c) createSSCclass-and-runStratifiedRandomSampling.js
   * classify the normalized SSC index
   * add the Köppen-Geiger climate classification after Kottek et al. (2006) to the vector file
   * run a stratified random sampling
    
  #### d) addRstval2Vct.js
   * add the values of a raster binary file to a vector grid file
  
  
 
