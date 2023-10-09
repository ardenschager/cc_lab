/*
                                                                    
888888888888                                                    
     88                             ,d                          
     88                             88                          
     88   ,adPPYba,  8b,     ,d8  MM88MMM                       
     88  a8P_____88   `Y8, ,8P'     88                          
     88  8PP"""""""     )888(       88                          
     88  "8b,   ,aa   ,d8" "8b,     88,                         
     88   `"Ybbd8"'  8P'     `Y8    "Y888                       
                                                                
                                                                
                                                                
         ,ad8888ba,   88                       88               
        d8"'    `"8b  88                       ""               
       d8'            88                                        
       88             88,dPPYba,   ,adPPYYba,  88  8b,dPPYba,   
       88             88P'    "8a  ""     `Y8  88  88P'   `"8a  
       Y8,            88       88  ,adPPPPP88  88  88       88  
        Y8a.    .a8P  88       88  88,    ,88  88  88       88  
         `"Y8888Y"'   88       88  `"8bbdP"Y8  88  88       88  
                                                                
                                                                
                                                                
             88                                                 
             88                                                 
             88                                                 
             88           ,adPPYba,    ,adPPYba,   8b,dPPYba,   
             88          a8"     "8a  a8"     "8a  88P'    "8a  
             88          8b       d8  8b       d8  88       d8  
             88          "8a,   ,a8"  "8a,   ,a8"  88b,   ,a8"  
             88888888888  `"YbbdP"'    `"YbbdP"'   88`YbbdP"'   
                                                   88           
                                                   88



By Arden Schager

This project is a text-based form generator. It takes a string of text and splays it out in a ring of text chains. 
You can type to change the text, press backspace to delete characters, and press "Tab" to open a GUI to control many 
parameters and presets. Made with love using p5.js and dat.gui.

*/

// Constants
const LETTER_LINK_SPACING = 2;
const BACKSPACE_TIMEOUT_THRESHOLD = 600; // ms
const BACKSPACE_TIME_BETWEEN_THRESHOLD = 100; // ms
const COLOR_ANIMATION_SPEED_MODIFIER = 0.001;
const ROTATION_SPEED_MODIFIER = 0.0001;
const RANDOM_INITIAL_FRAME_COUNT = Math.random() * 10000; // Randomize initial frame count to make each refresh unique


// Global variables
let swanSeaFont;
let letterChainCircle;
let gui;
let guiContainer;
let guiPresets = {
    currentPreset: "Default",
}
let guiVariablesJson;
let guiVariables;
let guiControllers = {};
let backspaceActivateTimer = 0;
let backspaceLetterTimer = 0;
let redrawBackground = false;
let recordGifProperties = {
    duration: 3,
    fps: 30,
}

// Helper functions

function resetLetterChainCircle() {
    letterChainCircle = new LetterChainCircle(
        windowWidth / 2,
        windowHeight / 2,
        guiVariables.chainString,
        guiVariables.numChains
    );
    letterChainCircle.init();
}

function setGuiVariables(newGuiVariables) {
    for (const [key, value] of Object.entries(newGuiVariables)) {
        guiVariables[key] = value;
    }
}

// Sort of works?
function isGuiInFocus() {
    return guiContainer?.contains(document.activeElement);
}

// Circumvents a bug in dat.gui's listen() function
function updateGuiControls() {
    for (const [key, controller] of Object.entries(guiControllers)) {
        if (guiVariables[key] !== undefined) {
            controller.setValue(guiVariables[key]);
        }
    }
}

// Saves the current gui variables to a json file
function saveGuiVariablesToJson() {
    // Borrowed from: https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
    function downloadObjectAsJson(exportObj, exportName){
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", exportName + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
    downloadObjectAsJson(guiVariables, "TextChainLoopParams" + Math.floor(Date.now() / 1000).toString());
}

// A function to set up the dat.gui controls. Complicated and ugly... but it works
function setupGui(gui, presets) {
    
    guiControllers.fullscreen = gui.add({
        fullscreen: () => {
            fullscreen(!fullscreen());
        }
    }, 'fullscreen').name("Toggle Fullscreen");
    guiControllers.currentPreset = gui.add(guiPresets, "currentPreset", presets).onChange((value) => {
        guiVariablesJson = loadJSON('guiParamPresets.json', () => {
            setGuiVariables(guiVariablesJson[value]);
            updateGuiControls();
            resetLetterChainCircle();
            redrawBackground = true;
        });
    }).name("Presets");
    guiControllers.chainString = gui.add(guiVariables, "chainString").onChange((value) => {
        if (value.length == 0) return;
        resetLetterChainCircle();
    }).listen().name("Chain String");
    guiControllers.numChains = gui.add(guiVariables, "numChains", 1, 64, 1).onChange(resetLetterChainCircle).name("Number of Chains");
    guiControllers.randomStringStart = gui.add(guiVariables, "randomStringStart").onChange(resetLetterChainCircle).name("Random String Start");
    guiControllers.color0 = gui.addColor(guiVariables, "color0").onChange(resetLetterChainCircle).name("Color 0");
    guiControllers.color1 = gui.addColor(guiVariables, "color1").onChange(resetLetterChainCircle).name("Color 1");
    guiControllers.color2 = gui.addColor(guiVariables, "color2").onChange(resetLetterChainCircle).name("Color 2");
    guiControllers.colorBg = gui.addColor(guiVariables, "colorBg").name("Background Color");
    guiControllers.backgroundRedrawAlpha = gui.add(guiVariables, "backgroundRedrawAlpha", 0, 255, 1).name("Background Redraw Alpha");
    guiControllers.rainbowMode = gui.add(guiVariables, "rainbowMode").onChange(resetLetterChainCircle).name("Rainbow Mode");
    guiControllers.animateColorSpeed = gui.add(guiVariables, "animateColorSpeed", -50, 50, 0.01).name("Color Animation Speed");
    guiControllers.fontSizeChainStart = gui.add(guiVariables, "fontSizeChainStart", 1, 300, 1).onChange(resetLetterChainCircle).name("Font Size At Chain Start");
    guiControllers.fontSizeChainEnd = gui.add(guiVariables, "fontSizeChainEnd", 1, 300, 1).onChange(resetLetterChainCircle).name("Font Size At Chain End");
    guiControllers.fontSpacingStart = gui.add(guiVariables, "fontSpacingStart", -100, 100, 0.1).onChange(resetLetterChainCircle).name("Font Spacing At Chain Start");
    guiControllers.fontSpacingEnd = gui.add(guiVariables, "fontSpacingEnd", -100, 100, 0.1).onChange(resetLetterChainCircle).name("Font Spacing At Chain End");
    guiControllers.fontSizeLinkJitter = gui.add(guiVariables, "fontSizeLinkJitter", -100, 100).onChange((value) => {
        LetterLink.jitterValues = new Array(guiVariables.chainString.length * guiVariables.numChains);
        resetLetterChainCircle();
    }).name("Font Size Link Jitter");
    guiControllers.fontSizeChainJitter = gui.add(guiVariables, "fontSizeChainJitter", -100, 100, 0.1).onChange(resetLetterChainCircle).name("Font Size Chain Jitter");
    guiControllers.chainOffsetBase = gui.add(guiVariables, "chainOffsetBase", -100, 100, 0.1).name("Chain Offset Base");
    guiControllers.chainOffsetOscFreq = gui.add(guiVariables, "chainOffsetOscFreq", 0, 100, 0.1).name("Chain Offset Osc. Freq.");
    guiControllers.chainOffsetOscMag = gui.add(guiVariables, "chainOffsetOscMag", -100, 100, 0.1).name("Chain Offset Osc. Mag.");
    guiControllers.xRotationSpeed = gui.add(guiVariables, "xRotationSpeed", -100, 100, 0.01).name("x Rotation Speed");
    guiControllers.yRotationSpeed = gui.add(guiVariables, "yRotationSpeed", -100, 100, 0.01).name("y Rotation Speed");
    guiControllers.zRotationSpeed = gui.add(guiVariables, "zRotationSpeed", -100, 100, 0.01).name("z Rotation Speed");
    guiControllers.xRotationMouseXInf = gui.add(guiVariables, "xRotationMouseXInf", -10, 10, 0.01).name("x Rotation Mouse X Infl.");
    guiControllers.xRotationMouseYInf = gui.add(guiVariables, "xRotationMouseYInf", -10, 10, 0.01).name("x Rotation Mouse Y Infl.");
    guiControllers.yRotationMouseXInf = gui.add(guiVariables, "yRotationMouseXInf", -10, 10, 0.01).name("y Rotation Mouse X Infl.");
    guiControllers.yRotationMouseYInf = gui.add(guiVariables, "yRotationMouseYInf", -10, 10, 0.01).name("y Rotation Mouse Y Infl.");
    guiControllers.zRotationMouseXInf = gui.add(guiVariables, "zRotationMouseXInf", -10, 10, 0.01).name("z Rotation Mouse X Infl.");
    guiControllers.zRotationMouseYInf = gui.add(guiVariables, "zRotationMouseYInf", -10, 10, 0.01).name("z Rotation Mouse Y Infl.");

    guiControllers.screenshot = gui.add({ 
        screenshot: () => { 
            saveCanvas('Text Chain Loop ' + Math.floor(Date.now() / 1000).toString().toString(), 'png');
        }
    }, 'screenshot').name("Take Screenshot");

    guiControllers.recordGif = gui.add({ 
        recordGif: () => { 
            saveGif("Text Chain Loop " + Math.floor(Date.now() / 1000).toString(), recordGifProperties.duration, recordGifProperties.fps);
        }
    }, 'recordGif').name("Record GIF");

    guiControllers.gifDuration = gui.add(recordGifProperties, "duration", 1, 10).name("GIF Duration (s)");
    guiControllers.gifFPS = gui.add(recordGifProperties, "fps", 5, 60, 1).name("GIF FPS");

    guiControllers.downloadPreset = gui.add({
        downloadPreset: () => {
            saveGuiVariablesToJson();
        }
    }, 'downloadPreset').name("Download Preset as JSON");

    guiControllers.savePreset = gui.add({
        savePreset: () => {
            const jsonString = JSON.stringify(guiVariables);
            localStorage.setItem('guiVariables', jsonString);
        }
    }, 'savePreset').name("Save Preset to Local Storage");

    const originalToggleHide = dat.GUI.toggleHide.bind(gui);
    dat.GUI.toggleHide = function () {
        if (event.keyCode !== 72) // Deprecated way of checking for keypresses. Todo: change
            originalToggleHide();
    }
}

// Classes

// A single letter link that can have children
class LetterLink {

    constructor(letter, idx, chainIdx, size) {
        this.idx = idx;
        this.chainIdx = chainIdx;
        this.letter = letter;
        this.children = [];
        this.t = this.idx / guiVariables.chainString.length;
        // create jitter values if they don't exist
        if (LetterLink.jitterValues.length == 0) {
            LetterLink.jitterValues = new Array(guiVariables.chainString.length * guiVariables.numChains);
        }
        // save jitter in static array so that it is consistent when the links are rebuilt. Otherwise, things jitter on every reset
        const jitterIdx = this.chainIdx * guiVariables.chainString.length + this.idx;
        if (LetterLink.jitterValues[jitterIdx] == undefined) {
            LetterLink.jitterValues[jitterIdx] = random(-guiVariables.fontSizeLinkJitter, guiVariables.fontSizeLinkJitter);
        }
        this.size = size + lerp(guiVariables.fontSizeChainStart, guiVariables.fontSizeChainEnd, this.t) + LetterLink.jitterValues[jitterIdx];
        this.spacing = lerp(guiVariables.fontSpacingStart, guiVariables.fontSpacingEnd, this.t);
        this.color = this.getColor(this.t);
    }

    // Static array to save jitter values
    static jitterValues = new Array();

    // Interpolate between three colors
    getColor(t) {
        if (guiVariables.rainbowMode) {
            colorMode(HSB);
            return color(t * 360, 100, 100);
        } else {
            const c1 = color(guiVariables.color0.r, guiVariables.color0.g, guiVariables.color0.b);
            const c2 = color(guiVariables.color1.r, guiVariables.color1.g, guiVariables.color1.b);
            const c3 = color(guiVariables.color2.r, guiVariables.color2.g, guiVariables.color2.b);
            if (t < 0.5) {
                return lerpColor(c1, c2, t * 2);
            } else {
                return lerpColor(c2, c3, (t - 0.5) * 2);
            }
        }
    }

    addChild(child) {
        this.children.push(child);
    }

    draw(angleX, angleY, angleZ) {
        push();
        translate(0, this.size + this.spacing); // move "upwards" from the previous letter
        rotateX(angleX);
        rotateY(angleY);
        rotateZ(angleZ);
        if (guiVariables.animateColorSpeed != 0) {
            let t = Math.abs(2 * this.t + COLOR_ANIMATION_SPEED_MODIFIER * frameCount * guiVariables.animateColorSpeed) % 2;
            if (t > 1) t = 2 - t; // Loop the t value
            this.color = this.getColor(t);
        }
        fill(this.color);
        textSize(this.size);
        text(this.letter, 0, 0);
        for (let child of this.children) {
            child.draw(angleX, angleY, angleZ); // recursively draw the remaining letters
        }
        pop();
    }
}

// A chain of letter links that cna be rotated
class LetterChain {
    constructor(string, idx) {
        this.string = string;
        this.idx = idx;
        // this.rand = hashString(seed + ""); // convert string to deterministic random function
    }

    build() {
        this.letterLinks = [];
        let letterArray = Array.from(this.string);
        // Create letter links
        let offset = 0;
        if (guiVariables.randomStringStart) {
            offset = random(0, this.string.length);
            letterArray = [...letterArray.slice(offset), ...letterArray.slice(0, offset)]; // rotate string
        }
        for (const [idx, letter] of letterArray.entries()) {
            const size = random(-guiVariables.fontSizeChainJitter, guiVariables.fontSizeChainJitter); 
            const letterLink = new LetterLink(letter, idx, this.idx, size);
            this.letterLinks.push(letterLink);
            if (idx == 0) this.root = letterLink;
        }
        // "connect" letter links together
        for (const [idx, letterLink] of this.letterLinks.entries()) {
            if (idx + 1 < this.letterLinks.length) {
                letterLink.addChild(this.letterLinks[idx + 1]);
            }
        }
    }

    draw(angleX, angleY, angleZ) {
        push();
        rotateX(angleX);
        rotateY(angleY);
        rotateZ(angleZ);
        if (this.root) {
            this.root.draw(angleX, angleY, angleZ);
        }
        pop();
    }
}

// A circle of letter chains. Rotates each chain and draws them
class LetterChainCircle {
    constructor(x, y, string, numLetterChains) {
        this.x = x;
        this.y = y;
        this.letterChains = [];
        for (let i = 0; i < numLetterChains; i++) {
            this.letterChains.push(new LetterChain(string, i));
        }
    }

    init() {
        for (let letterChain of this.letterChains) {
            letterChain.build();
        }
    }

    // Draw each chain in a circle radiating out from the center
    draw(offset, angleX, angleY, angleZ) {
        const chainAngle = 2 * PI / this.letterChains.length;
        for (const [idx, letterChain] of this.letterChains.entries()) {
            push();
            rotateZ(chainAngle * idx);
            translate(0, offset);
            rotateX(angleX);
            rotateY(angleY);
            rotateZ(angleZ);
            const x = this.x;
            letterChain.draw(angleX, angleY, angleZ);
            pop();
        }
    }
}


function preload() {
    // swanSeaFont = loadFont("assets/swansea.ttf");
    swanSeaFont = loadFont("assets/swansea-bold.ttf");
    guiVariablesJson = loadJSON('guiParamPresets.json');
}

function setup() {
    // basic p5 setup
    const renderer = createCanvas(windowWidth, windowHeight, WEBGL);
    textAlign(CENTER, BOTTOM);
    // Using dat.gui, example found here:
    // https://editor.p5js.org/slow_izzm/sketches/rJXAyI7JV
    let localGuiVariables = localStorage.getItem('guiSettings');
    if (localGuiVariables) {
        guiVariables = JSON.parse(localGuiVariables);
    }
    guiVariables = guiVariablesJson["Default"]; // Load default preset
    gui = new dat.GUI({ name: "Text Chain Loop Params", width: windowWidth / 4  });
    guiContainer = gui.domElement.parentElement;
    dat.GUI.toggleHide(); // hide by default
    const presetNames = Object.keys(guiVariablesJson);
    setupGui(gui, presetNames); 

    // Hack to overwrite font shader to allow for overlapping (discarding pixels when there is no letter)
    // https://stackoverflow.com/questions/75723397/how-can-i-make-type-backgrounds-in-p5-js-transparent
    // Explanation above, see shaders.js for more
    renderer._getFontShader = function () {
        if (!this._defaultFontShader) {
            this.GL.getExtension('OES_standard_derivatives');
            this._defaultFontShader = new p5.Shader(
                this,
                textVert,
                textFrag
            );
        }
        return this._defaultFontShader;
    };

    // Create letter chain circle here
    letterChainCircle = new LetterChainCircle(
        windowWidth / 2,
        windowHeight / 2,
        guiVariables.chainString,
        guiVariables.numChains,
    );
    textFont(swanSeaFont);
    letterChainCircle.init();
}

// Variables to control mouse influence
let xRotationMouseInf = 0;
let yRotationMouseInf = 0;
let zRotationMouseInf = 0;
function draw() {
    colorMode(RGB);
    if (redrawBackground || guiVariables.backgroundRedrawAlpha == 255) { // Only redraw background when necessary
        redrawBackground = false;
        background(color(guiVariables.colorBg.r, guiVariables.colorBg.g, guiVariables.colorBg.b));
    } else {
        drawingContext.disable(drawingContext.DEPTH_TEST); // Disable depth test to allow for alpha blending
        blendMode(BLEND);
        fill(color(guiVariables.colorBg.r, guiVariables.colorBg.g, guiVariables.colorBg.b, guiVariables.backgroundRedrawAlpha));
        noStroke();
        rect(-width * 0.5, -height * 0.5, width, height);
        drawingContext.enable(drawingContext.DEPTH_TEST); // Re-enable depth test
    }
    
    // Initial offset of chain from center
    const offset = guiVariables.chainOffsetBase + guiVariables.chainOffsetOscMag * sin(frameCount * 0.001 * guiVariables.chainOffsetOscFreq);
    // Rotation logic for mouse input
    
    if (!isGuiInFocus()) { // Only rotate when mouse is not over dat.gui. Doesn't really work?
        xRotationMouseInf = guiVariables.xRotationMouseXInf * mouseX / windowWidth + guiVariables.xRotationMouseYInf * mouseY / windowHeight;
        yRotationMouseInf = guiVariables.yRotationMouseXInf * mouseX / windowWidth + guiVariables.yRotationMouseYInf * mouseY / windowHeight;
        zRotationMouseInf = guiVariables.zRotationMouseXInf * mouseX / windowWidth + guiVariables.zRotationMouseYInf * mouseY / windowHeight;
    }
   
    const totalFrameCount = frameCount + RANDOM_INITIAL_FRAME_COUNT;
    // Final rotations from parameters
    const xRotation = xRotationMouseInf + totalFrameCount * guiVariables.xRotationSpeed * ROTATION_SPEED_MODIFIER;
    const yRotation = yRotationMouseInf + totalFrameCount * guiVariables.yRotationSpeed * ROTATION_SPEED_MODIFIER;
    const zRotation = zRotationMouseInf + totalFrameCount * guiVariables.zRotationSpeed * ROTATION_SPEED_MODIFIER;
    letterChainCircle.draw(offset, xRotation, yRotation, zRotation);
    // Logic for holding down backspace (must go here because of p5.js structure)
    if (keyIsDown(BACKSPACE)) {
        if (isGuiInFocus()) {
            // Ignore key presses when dat.gui is in focus.
            return;
        }
        backspaceActivateTimer += deltaTime;
        if (backspaceActivateTimer > BACKSPACE_TIMEOUT_THRESHOLD) {
            backspaceLetterTimer += deltaTime;
            if (backspaceLetterTimer > BACKSPACE_TIME_BETWEEN_THRESHOLD) {
                guiVariables.chainString = guiVariables.chainString.slice(0, -1); // Remove last character
                resetLetterChainCircle();
                backspaceLetterTimer = 0;
            }
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    letterChainCircle.init(); // Rebuild letter chain when window is resized
}

// For toggling gui and typing letters
function keyPressed() {
    
    if (keyCode === TAB) {
        dat.GUI.toggleHide();
        return false;
    }
    if (!isGuiInFocus()) {
        if (keyCode === BACKSPACE) {
            guiVariables.chainString = guiVariables.chainString.slice(0, -1); // Remove last character
            resetLetterChainCircle();
        }
        // if key is a number, letter, space, or punctuation, add it to the string
        // https://stackoverflow.com/questions/12467240/determine-if-javascript-e-keycode-is-a-printable-non-control-character
        const validKey =
            (keyCode > 47 && keyCode < 58) || // number keys
            keyCode == 32 || // spacebar & return key(s) (if you want to allow carriage returns)
            keyCode == 58 || // colon
            keyCode == 59 || // semicolon
            (keyCode > 64 && keyCode < 91) || // letter keys
            (keyCode > 95 && keyCode < 112) || // numpad keys
            (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
            (keyCode > 218 && keyCode < 223);   // [\]' (in order)
        if (validKey) {
            guiVariables.chainString += key;
            resetLetterChainCircle(); // Rebuild letter chain circle when string is changed
        }
    }
}
