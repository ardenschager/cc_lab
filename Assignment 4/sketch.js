/* 
                                                                    
 @@@@@@@@  @@@  @@@   @@@@@@    @@@@@@   @@@@@@@                    
@@@@@@@@@  @@@  @@@  @@@@@@@@  @@@@@@@   @@@@@@@                    
!@@        @@!  @@@  @@!  @@@  !@@         @@!                      
!@!        !@!  @!@  !@!  @!@  !@!         !@!                      
!@! @!@!@  @!@!@!@!  @!@  !@!  !!@@!!      @!!                      
!!! !!@!!  !!!@!!!!  !@!  !!!   !!@!!!     !!!                      
:!!   !!:  !!:  !!!  !!:  !!!       !:!    !!:                      
:!:   !::  :!:  !:!  :!:  !:!      !:!     :!:                      
 ::: ::::  ::   :::  ::::: ::  :::: ::      ::                      
 :: :: :    :   : :   : :  :   :: : :       :                       
                                                                    
                                                                    
@@@  @@@  @@@     @@@@@@@  @@@  @@@  @@@@@@@@                       
@@@  @@@@ @@@     @@@@@@@  @@@  @@@  @@@@@@@@                       
@@!  @@!@!@@@       @@!    @@!  @@@  @@!                            
!@!  !@!!@!@!       !@!    !@!  @!@  !@!                            
!!@  @!@ !!@!       @!!    @!@!@!@!  @!!!:!                         
!!!  !@!  !!!       !!!    !!!@!!!!  !!!!!:                         
!!:  !!:  !!!       !!:    !!:  !!!  !!:                            
:!:  :!:  !:!       :!:    :!:  !:!  :!:                            
 ::   ::   ::        ::    ::   :::   :: ::::                       
:    ::    :         :      :   : :  : :: ::                        
                                                                    
                                                                    
@@@@@@@@@@    @@@@@@    @@@@@@@  @@@  @@@  @@@  @@@  @@@  @@@@@@@@  
@@@@@@@@@@@  @@@@@@@@  @@@@@@@@  @@@  @@@  @@@  @@@@ @@@  @@@@@@@@  
@@! @@! @@!  @@!  @@@  !@@       @@!  @@@  @@!  @@!@!@@@  @@!       
!@! !@! !@!  !@!  @!@  !@!       !@!  @!@  !@!  !@!!@!@!  !@!       
@!! !!@ @!@  @!@!@!@!  !@!       @!@!@!@!  !!@  @!@ !!@!  @!!!:!    
!@!   ! !@!  !!!@!!!!  !!!       !!!@!!!!  !!!  !@!  !!!  !!!!!:    
!!:     !!:  !!:  !!!  :!!       !!:  !!!  !!:  !!:  !!!  !!:       
:!:     :!:  :!:  !:!  :!:       :!:  !:!  :!:  :!:  !:!  :!:       
:::     ::   ::   :::   ::: :::  ::   :::   ::   ::   ::   :: ::::  
 :      :     :   : :   :: :: :   :   : :  :    ::    :   : :: ::

 
 
 By Arden Schager

 This sketch takes aligned face images from the Faces in the Wild dataset
 And stitches them together to create a new image, excuisite corpse style.
 You can move the mouse left to righte to determine the height of the next 
 image drawn.

*/

// variables
let portraitStitcher;
let imageList;
let results = [];
let imageFiles;
let dim; // canvas dimension

// constants
const IMAGE_HEIGHT_SCALE = 0.1;


// classes

// A class that draws a row of a randomly selected portrait image
// It alternates between drawing from the top and bottom of the canvas
class PortraitStitcher {
    constructor() {
        this.numColumns = width;
        this.numRows = height;
        this.index = 0;
        this.shouldLoadImage = true;
        this.pixelCount = 0;
        this.scanDirection = 1;
    }

    update(pixelRows = 1) {
        if (this.pixelCount >= dim || this.pixelCount <= 0) {
            this.shouldLoadImage = true;
            this.scanDirection *= -1;
            if (this.scanDirection > 0) {
                this.pixelCount = 0;
            } else {
                this.pixelCount = dim;
            }
        }
        if (this.shouldLoadImage) {
            this.shouldLoadImage = false;
            const img = imageList[Math.floor(Math.random() * imageList.length)];
            let proportion = this.pixelCount / dim;
            let ySrc = Math.floor(proportion * img.height);
            // Define the source height based on the pixelRows
            let srcHeight = Math.min(img.height - ySrc, pixelRows) * Math.max(0.1, proportion);
            // image arguments: image, x, y, width, height, xSrc, ySrc, srcWidth, srcHeight 
            image(img, 0, this.pixelCount, dim, pixelRows, 0, ySrc, img.width, srcHeight);
            this.pixelCount += pixelRows * this.scanDirection;
            this.shouldLoadImage = true;
        }
    }
}

function reset() {
    dim = Math.min(windowWidth, windowHeight);
    // imageList = createImageList(dim);
    resizeCanvas(dim, dim);
    portraitStitcher = new PortraitStitcher(imageList);
    clear();
    background(0);
}

// Chat GPT for unloading images from zip
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Chat GPT for unloading images from zip
function convertToJPGDataURL(dataURL) {
    return dataURL.replace('data:application/octet-stream', 'data:image/jpeg');
}

function preload() {
    imageList = [];
    // load zip file, from ChatGPT
    let zipData = loadBytes('downloaded_images.zip', async () => {
        try {
            let zip = await JSZip.loadAsync(zipData.bytes.buffer);
            let loadPromises = [];
            // load json file with image names
            loadJSON('image_list.json', (data) => {
                // iteratte through image names and load images individually into imageList
                for (let i = 0; i < data.length; i++) {
                    const imageFile = data[i];
                    let promise = zip.file('downloaded_images/' + imageFile).async("blob").then(async (blob) => {
                        let dataURL = await blobToDataURL(blob);
                        return new Promise((resolve) => {
                            let img = loadImage(dataURL, () => {
                                imageList.push(img);
                                resolve(img);
                            });
                        });
                    });
                }
            });
        } catch (err) {
            console.error(err);
        }
    });
}


function setup() {
    reset();
}

let numDraws = 0;
function draw() {
    // console.log(imageList.length);
    const imageDrawHeight = Math.max(1, Math.floor(Math.random() * IMAGE_HEIGHT_SCALE * (1 + mouseX)));
    if (portraitStitcher && imageList.length > 0) {
        let dynamicFrameRate = map(imageDrawHeight, 1, dim * IMAGE_HEIGHT_SCALE, 120, 10);  // Adjust values as necessary
        frameRate(dynamicFrameRate);
        portraitStitcher.update(imageDrawHeight);
    } 
}

function windowResized() {
    reset();
}