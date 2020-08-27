# Scripts for Google Earth Engine

The following scripts were created to perform a stratified random sampling and validate the WSF-Evo-Density layer provided by DLR ([Team: Smart Cities and Spatial Development](https://www.dlr.de/eoc/en/desktopdefault.aspx/tabid-11925/20985_read-48802/))


This directory contain following scripts:
  
  ##### I. createVctGrid.js
   * gridding a vector file
   * create grid vector file out of a polygon vector file
  
  ##### II. calcSSCindex.js
   * calculate the SSC index after Palacios-Lopez et al. (2019)
   * normalize the SSC index
    
  ##### III. createSSCclass-and-runStratifiedRandomSampling.js
   * classify the normalized SSC index to low, medium and high
   * add the Köppen-Geiger climate classification after Kottek et al. (2006) to the vector file
   * run a stratified random sampling
    
  ##### IV. addRstval2Vct.js
   * add values of a raster binary file to a vector grid file
  
  
 
