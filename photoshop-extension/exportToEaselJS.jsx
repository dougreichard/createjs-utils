
// (c) Copyright 2012 Adobe Systems, Inc. All rights reserved.
// Written by David Deraedt
// PHOTOSHOP TO EASEL JS SPRITESHEET EXPORTER

// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

// in case we double clicked the file
app.bringToFront();

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
$.level = 1;





// Default frequency for all animations
var defaultFrequency = 4;
// Library name (the object holding sprite classes in the window object).
// Also used for the file name.
var libName = "spriteLib";
// Path to the folder containing the spriteSheets, relative to the HTML page
var spriteSheetFolder = "sprites/";


var layerIndex = 0 ;
var totalFrames = 0;
var outputTxt = "";
var le = "\n";
var commonSheet = [];

function main () {

	// Check if we to have a doc to work with
    if (app.documents.length == 0){
        alert ("No document opened");
		return;
    }

    var srcDoc = app.activeDocument;
	
	// Switch to pixel units
    var strtRulerUnits = app.preferences.rulerUnits;
    if (strtRulerUnits != Units.PIXELS) {
      app.preferences.rulerUnits = Units.PIXELS;
    }
    
	// Sprite size
    var w = srcDoc.width ;
    var h = srcDoc.height ;
    
    
    // Create a copy of the current doc
    var destDoc = srcDoc.duplicate("tmp", false);
     
	// Get the total number of layers
	getTotalLayers(destDoc.layers);
	//$.writeln("totalFrames: " + totalFrames);

	// Sheet size
    var cols = Math.ceil(Math.sqrt(totalFrames));
    var rows = Math.ceil(totalFrames/cols);
	//$.writeln("total rows: " + rows);
    
	
	 // Make it the size of the sprite
    destDoc.resizeCanvas (cols*w, rows*h, AnchorPosition.TOPLEFT);
    
    // Select this new doc
    app.activeDocument = destDoc;
	
	// Get the spriteSheet name from the document name
	var imageName = srcDoc.name.split(".")[0];
	
	
	// Start library output	
	outputTxt += beginOutput(libName, imageName);
	
    
    // Manage frames common throught the document
    
    for(var cmSprite = 0; cmSprite < destDoc.layers.length; cmSprite++) {
        var spriteLayer = destDoc.layers[cmSprite];
        if (spriteLayer.name.indexOf("+") >=0) {
                commonSheet.push(spriteLayer);
                continue;
        }
    }

	// Process each sprite	
	for (var i = 0 ; i < destDoc.layerSets.length ; i++) {
		var spriteSet = destDoc.layerSets[i];
		spriteSet.allLocked=false;
		var destName = spriteSet.name;
		var spriteTxt = processSprite(destDoc, spriteSet, destName, cols, rows, w, h);
		outputTxt += spriteTxt;		
	}
    
    // Remove the commonSheet now that they are cloned
    for(var c = commonSheet.length-1; c >=0; c--) {
        commonSheet[c].remove();
    }
	
	// End library output
	outputTxt += endOutput(libName);
	
	
	// Let the user select its destination and save
    var destF =  Folder.selectDialog ("Select Destination");
	
	if(destF){
		var folderName = destF.absoluteURI+"/";
		savePng(destDoc, folderName + imageName + ".png" );
		saveTxt(outputTxt, folderName + libName +".js");    	
	}
    
     // Close doc
    destDoc.close(SaveOptions.DONOTSAVECHANGES);

    // Release refs
    srcDoc = null;
    destDoc = null;

    // Restore orginal unit preferences
    if (strtRulerUnits != app.preferences.rulerUnits) {
      app.preferences.rulerUnits = strtRulerUnits;
    }

}



function getTotalLayers(layerList){
	// DJR: Walked backwars so I can remove	
	for (var i =  layerList.length-1; i >=0 ; i--) {
		var layer = layerList[i];
        if (layer.name.charAt(0) == "-") {
            layer.remove();
            continue;          
        } else if (layer.name.charAt(0) == "+") {
            // Layer is common don't count
            continue;          
        }
            

		if(layer.typename=="LayerSet") {
			getTotalLayers(layer.layers);
		}
		else {
			totalFrames++;
		}		
	}
	
	return totalFrames;
}



function beginOutput(libName, imageName){
	var txt = "//EaselJS Spritesheet"+le;
	txt += "if (!window." + libName + ") { window." + libName + " = {}; }"+le;
	txt += "(function(scope) {"+le;
	txt += "var spritesheetPath='" + spriteSheetFolder + imageName + ".png';"+le;   
	
	return txt;
}



function processSprite(doc, spriteSet, destName, cols, rows, w, h) {

	var t = "";

    var animsTxt = "animations: {";
    var framesTxt = "frames:[";

	// stores the frame count for this sprite
	var frameCount = 0;  
    
    var animationSets = spriteSet.layerSets;
    
    // Manage frames common throught the sprite
    var commonSprite = [];
    
    for(var cmSprite = 0; cmSprite < spriteSet.layers.length; cmSprite++) {
        var spriteLayer = spriteSet.layers[cmSprite];
        if (spriteLayer.name.indexOf("+") >=0) {
                commonSprite.push(spriteLayer);
                continue;
        }
    }

    
    for( var n = 0 ; n < animationSets.length ; n++){
        
        var set = animationSets[n];
		set.allLocked=false;
        var setName = set.name;
        
        
        
        var thisFrequency = defaultFrequency;
        var nextAnimation = '';
        
        var params = setName.split(/@|>/)
        if (params.length == 3) {
            setName = params[0];
            nextAnimation = params[2];
            thisFrequency = Number(params[1])
        }
        else if (params.length == 2) {
            if (setName.indexOf("@") >=0) {
                thisFrequency = Number(params[1])
            } else {
                nextAnimation = params[1];
            }
            setName = params[0];    
        } // Else assume happy path and set name has no params
        animsTxt += le+"\t" + setName + ":{ frames:[";
            
        
        
        var destinationsAnimation =[];
        var commonAnimation = [];
        for( var i = 0 ; i < set.layers.length ; i++){
            
            var layer = set.layers[i];
            //$.writeln("layer: " + layer.name);
            var layerName = layer.name;
            
            
            // discard text layers
            if (layer.kind == LayerKind.TEXT) {
                layerIndex++;
				frameCount++;
                continue;
            }  else if (layerName.indexOf("+") >=0) {
                commonAnimation.push(layer);
                continue;
            }
            
            // select the next layer
            doc.activeLayer = layer;
            doc.activeLayer.allLocked=false;
            
            // compute destination
            var destx = (layerIndex % cols) * w;
            var desty = (Math.floor(layerIndex/cols)) * h;
            var dest = {destx: destx, desty:desty};
            
            // Save the desination 
            destinationsAnimation.push(dest);
            
            doc.activeLayer.translate(dest.destx, dest.desty);
           
            
            // Add frames : x, y, width, height, imageIndex, regX, regY
            framesTxt += le+"\t[" + Number(dest.destx) + ", " + Number(dest.desty) + ", " + Number(w) + ", " + Number(h) + ", 0, 0, 0],";
            
            // Add frame index to animation data
            animsTxt += frameCount + ", ";
            // multiply frames as specified by the user
            var sepIndex = layer.name.indexOf(" x");
            if(sepIndex>-1) {
                var repeat = Number(layer.name.slice(sepIndex+2));
                for (var j = 0 ; j < repeat-1 ; j++)  animsTxt += frameCount + ", ";
            }
            
			layerIndex++;
			frameCount++;
        }
        // Copy the common frames to all frames
        // They are placed relative to the layer its duplicating
         for (var d = 0; d < destinationsAnimation.length; d++) {
             for (var above=0;above < commonAnimation.length; above++) {
                var copy = commonAnimation[above].duplicate();
                copy.move(commonAnimation[above], ElementPlacement.PLACEBEFORE );
                
                doc.activeLayer = copy;
                doc.activeLayer.allLocked=false;
                doc.activeLayer.translate(destinationsAnimation[d].destx, destinationsAnimation[d].desty);
             }
             
             for (var above=0;above < commonSprite.length; above++) {
                var copy = commonSprite[above].duplicate();
                copy.move(commonSprite[above], ElementPlacement.PLACEBEFORE );
                
                doc.activeLayer = copy;
                doc.activeLayer.allLocked=false;
                doc.activeLayer.translate(destinationsAnimation[d].destx, destinationsAnimation[d].desty);
             }
             
             for (var sheet=0;sheet < commonSheet.length; sheet++) {
                var copy = commonSheet[sheet].duplicate();
                copy.move(commonSheet[sheet], ElementPlacement.PLACEBEFORE );
                
                doc.activeLayer = copy;
                doc.activeLayer.allLocked=false;
                doc.activeLayer.translate(destinationsAnimation[d].destx, destinationsAnimation[d].desty);
             }
           }
      
       
 
		// TODO: deal with "frequency" & "next" parameters
        animsTxt += "], frequency:" + thisFrequency;
        if (nextAnimation) animsTxt += ", next: '" + nextAnimation + "'},";
        else animsTxt += ", next:true},";
    }
    

        // Remove the commonSprite now that they are cloned
        for(var c = commonSprite.length-1; c >=0; c--) {
            commonSprite[c].remove();
        }

	
	// sprite defintion
	t += le + "// "+ destName +le ;    	
	t += "var "+ destName +" = function() {this.initialize();}"+le;    
	t += destName + "._SpriteSheet = new createjs.SpriteSheet("    
	t += "{images: [spritesheetPath], "+le;
	t += framesTxt;
	t += "]";
	t += ","+le+animsTxt;
	t += "}";    
	t += "});"+le;
	t += "var "+ destName + "_p = " + destName + ".prototype = new createjs.BitmapAnimation();"+le;
	t += destName + "_p.BitmapAnimation_initialize = "+ destName + "_p.initialize;"+le;
	t += destName + "_p.initialize = function() {"+le;
	t += "\tthis.BitmapAnimation_initialize(" + destName + "._SpriteSheet);"+le;
	t += "\tthis.paused = false;"+le;
	t += "}"+le;
	t += "scope."+ destName + " = " + destName + ";"+le;
	
	return t;	
}


function endOutput(libName) {
	var txt = "// Endofspritesdef"+le;
	txt += "}(window."+libName+"));";
	return txt;
}



function savePng(doc, filepath) {
            
    var pngFile = new File(filepath);
    var pngFileOptions = new PNGSaveOptions();
    doc.saveAs (pngFile, pngFileOptions, true, Extension.LOWERCASE);
}



function saveTxt(pText, filepath) {
		
    // get OS specific linefeed
    var fileLineFeed; 
    if ($.os.search(/windows/i) != -1) {
            fileLineFeed = "Windows";
    } else {
		fileLineFeed = "Unix";
	}
	
	
    fileOut = new File(filepath);
    fileOut.lineFeed = fileLineFeed;
    fileOut.open("w", "TEXT", "????");
    fileOut.write(pText);
    fileOut.close();
}


main();


