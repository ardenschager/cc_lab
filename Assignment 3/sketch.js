//// Constants

const parameters = {
    numFireflies: 500,
    fireflyRandomWalk: 0.1,
    // fireflyAttractionAll: 0.1,
    // fireflyAttractionSimilar: 0.3,
    fireflyBaseFrequency: 0.3,
    fireflyFrequencyVariation: 0.3,
    fireflyInertia: 0,
    fireflyBaseSize: 3,
    fireflySizeVariation: 4,
    fireflyCircadianVariation: 0.25,
    fireflyViewRadius: 100,
    fireflyMaxVelocity: 3.5,
    fireflyMaxForce: 5,
    fireflyDayGlowOffset: 0.0,
    // foodFallFrequency: 0.1,
    dayNightFrequency: 0.01,
    nightOffset: 0.6,
    shouldLoop: true,
    // simSquareSize: 100
}

//// Variables
let gui;
let skyShader;
let blendShader;
let hBlurShader;
let vBlurShader;
let bloomShader;
let baseCanvas;
let simulation;

//// Helper functions

function setupGui() {
    gui.add(parameters, "numFireflies", 1, 10000, 1).name("Num Fireflies").onChange(() => {
        simulation.reset();
    });
    gui.add(parameters, "fireflyRandomWalk", 0, 10, 0.01).name("Firefly Random Walk");
    // gui.add(parameters, "fireflyAttractionAll", 0, 10, 0.01).name("Firefly Attraction (All)");
    // gui.add(parameters, "fireflyAttractionSimilar", 0, 10, 0.01).name("Firefly Attraction (Similar)");
    gui.add(parameters, "fireflyBaseFrequency", 0, 10, 0.01).name("Firefly Base Frequency");
    gui.add(parameters, "fireflyInertia", 0, 1, 0.01).name("Firefly Intertia");
    gui.add(parameters, "fireflyMaxVelocity", 0, 15, 0.01).name("Firefly Max Velocity");
    gui.add(parameters, "fireflyMaxForce", 0, 20, 0.01).name("Firefly Max Force");
    gui.add(parameters, "fireflyDayGlowOffset", 0, 1, 0.01).name("Firefly Day Glow Offset");
    gui.add(parameters, "fireflySizeVariation", 0, 5, 0.01).name("Firefly Size Variation");
    gui.add(parameters, "fireflyBaseSize", 0, 5, 0.01).name("Firefly Base Size");
    // gui.add(parameters, "fireflyPhaseShift", 0, 5, 0.01).name("Firefly Phase Shift");
    // gui.add(parameters, "fireflySleepForce", 0, 500, 0.01).name("Firefly Sleep Force");
    gui.add(parameters, "dayNightFrequency", 0, 1, 0.0001).name("Day Night Frequency");
    gui.add(parameters, "nightOffset", -1, 1, 0.01).name("Night Offset");
    gui.add(parameters, "shouldLoop").name("Should Loop");
    // gui.add(parameters, "simSquareSize", 10, 1000, 1).name("Sim Square Size").onChange(() => {
        // simulation.reset();
    // });
}

// Box-muller approximation for normal distributions inspired by this:
// https://mika-s.github.io/javascript/random/normal-distributed/2019/05/15/generating-normally-distributed-random-numbers-in-javascript.html
function gaussianSample(mean, stddev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stddev + mean;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

//// Classes

// class SimSquare {
//     constructor(column, row) {
//         this.column = column;
//         this.row = row;
//         this.particles = [];
//     }

//     reset() {
//         this.particles = [];
//     }

//     addParticle(particle) {
//         this.particle.push(particle);
//     }
// }

// class SimGrid {
//     constructor(numColumns, numRows, shouldLoop = true) {
//         this.numColumns = numColumns;
//         this.numRows = numRows;
//         this.shouldLoop = shouldLoop;
//         this.simSquares = [];
//     }

//     // Get the 9 squares around
//     getAdjacentSimSquares(column, row) {
//         const adjacent = [];
//         for (let i = -1; i <= 1; i++) {
//             for (let j = -1; j <= 1; j++) {
//                 let x = column + i;
//                 let y = row + j;
//                 if (this.shouldLoop) {
//                     x = (x + this.numColumns) % this.numColumns; // Loop columns
//                     y = (y + this.numRows) % this.numRows; // Loop rows 
//                 } else if (x < 0 || x >= this.numColumns || y < 0 || y >= this.numRows) {
//                     continue; // Skip when not looping
//                 }
//                 adjacent.push(this.getSimSquare(x, y));
//             }
//         }
//         return adjacent;
//     }

//     setSimSquare(column, row, particle) {
//         const index = row * this.numColumns + column;
//         this.simSquares[index] = particle;
//     }

//     getSimSquare(column, row) {
//         const index = row * this.numColumns + column;
//         console.log(column, row, index, this.simSquares);
//         return this.simSquares[index];
//     }

//     reset() {
//         for (let simSquare of this.simSquares) {
//             simSquare.reset();
//         }
//     }
// }

class ParticleSystem {
    constructor(numParticles, particleClass, drawLayer) {
        // this.adjacentSystem = adjacentSystem;
        // const gridSize = parameters.simSquareSize;
        // const columnSize = Math.ceil(windowWidth / parameters.simSquareSize);
        // const rowSize = Math.ceil(windowHeight / parameters.simSquareSize);
        // const numColumns = Math.ceil(windowWidth / columnSize);
        // const numRows = Math.ceil(windowHeight / rowSize);
        // this.simGrid = new SimGrid(numColumns, numRows);
        this.numParticles = Math.max(100, numParticles - (1920 - Math.max(windowWidth, windowHeight)) * 0.5);
        this.particleClass = particleClass;
        this.drawLayer = drawLayer;
        this.particles = [];
    }

    init() {
        for (let i = 0; i < this.numParticles; i++) {
            const position = createVector(random(-windowWidth * 0.5, windowWidth * 0.5), random(-windowHeight * 0.5, windowHeight * 0.5));
            this.particles.push(new this.particleClass(position, this, this.adjacentSystem));
        }
    }

    simulate(timeOfDay) {
        for (let particle of this.particles) {
            particle.simulate(timeOfDay);
        }
    }

    draw() {
        for (let particle of this.particles) {
            particle.draw();
        }
    }

    // setParticleInGrid(particle) {
    //     const {column, row} = particle.gridLocation;
    //     this.simGrid.setSimSquare(column, row, particle);
    // }

    // getParticlesWithinRadius(x, y, r) {
    //     const adjacentSquares = this.simGrid.getAdjacentSimSquares(x, y);
    //     const particles = [];
    //     for (let square of adjacentSquares) {
    //         for (let particle of square.particles) {
    //             if (particle.position.dist(x, y) < r) {
    //                 particles.push(particle);
    //             }
    //         }
    //     }
    //     return particles;
    // }

    // get gridSize() {
    //     return {numColumns: this.simGrid.numColumns, numRows: this.simGrid.numRows};
    // }
}

class Particle {
    constructor(position, system, foodSystem) {
        this.position = position;
        this.system = system;
        this.foodSystem = foodSystem;
    }

    get gridLocation() {
        const {numColumns, numRows} = this.system.gridSize;
        const column = Math.floor(this.position.x / numColumns);
        const row = Math.floor(this.position.y / numRows);
        return {column: column, row: row};
    }
}

const MINIMUM_SIZE = 0.1;
const MINIMUM_FREQUENCY = 0.05;

class Firefly extends Particle {

    constructor(position, system) {
        super(position, system);
        this.velocity = createVector(0, 0);
        this.prevVelocity = createVector(0, 0);
        this.force = createVector(0, 0);
        this.canvas = system.drawLayer.canvas;
        this.cycle = random(0, 2 * Math.PI);
        this.size = Math.max(MINIMUM_SIZE, gaussianSample(parameters.fireflyBaseSize, parameters.fireflySizeVariation));
        this.phase = random(0, 2 * Math.PI);
        this.frequency = Math.max(MINIMUM_FREQUENCY, gaussianSample(parameters.fireflyBaseFrequency, parameters.fireflyFrequencyVariation));
        this.circadianOffset = gaussianSample(0, parameters.fireflyCircadianVariation);
    }

    // Firefly behavior lives here
    simulate(timeOfDay) {
        this.move(timeOfDay);
        // this.system.setParticleInGrid(this);
        this.cycle += parameters.fireflyBaseFrequency;
        this.glowModulation = clamp(Math.cos(2 * Math.PI * timeOfDay + this.circadianOffset) + parameters.nightOffset, 0, 1); ;
        this.phase += parameters.fireflyPhaseShift;
    }

    move(timeOfDay) {
        // const nearbyFireflies = this.getNearbyFireflies(this.system);
        // console.log(nearbyFireflies.length);
        this.force.set(0, 0);
        this.randomWalk();
        // this.goToSleep(timeOfDay);
        this.force.limit(parameters.fireflyMaxForce);
        this.velocity.add(this.force);
        this.velocity.limit(parameters.fireflyMaxVelocity);
        this.velocity = p5.Vector.lerp(this.velocity, this.prevVelocity, parameters.fireflyInertia);
        this.prevVelocity.copy(this.velocity);
        this.position.add(this.velocity);
        if (parameters.shouldLoop) {
            this.position.x = ((this.position.x + windowWidth * 0.5) % windowWidth + windowWidth) % windowWidth - windowWidth * 0.5;
            this.position.y = ((this.position.y + windowHeight * 0.5) % windowHeight + windowHeight) % windowHeight - windowHeight * 0.5;
        } else {
            this.position.x = clamp(this.position.x, -windowWidth * 0.5, windowWidth * 0.5);
            this.position.y = clamp(this.position.y, -windowHeight * 0.5, windowHeight * 0.5);
        }
    }

    randomWalk() {
        const x = random(-parameters.fireflyMaxForce, parameters.fireflyMaxForce) * parameters.fireflyRandomWalk;
        const y = random(-parameters.fireflyMaxForce, parameters.fireflyMaxForce) * parameters.fireflyRandomWalk;
        this.force.add(x, y);
    }

    getNearbyFireflies(fireflySystem) {
        const {column, row} = this.gridLocation;
        const adjacent = fireflySystem.getParticlesWithinRadius(column, row, parameters.fireflyViewRadius);
        return adjacent;
    }

    sortFirefliesBySimilarity(nearbyFireflies) {

    }

    draw() {
        const glow = (this.glowModulation) * (0.5 + 0.5 * Math.sin(this.cycle));
        this.canvas.fill(255 * glow, 255 * glow, 0, this.glowModulation * 255);
        this.canvas.circle(this.position.x, this.position.y, this.size);
    }
}

class DrawLayer {
    constructor(w, h, isBaseCanvas = false) {
        if (isBaseCanvas) {
            if (baseCanvas == null) {
                this.canvas = createCanvas(w, h, WEBGL);
            } else {
                this.canvas = baseCanvas;
            }
        } else {
            this.canvas = createGraphics(w, h, WEBGL);
            this.canvas.noStroke();
        }
    }

    draw() {
        this.canvas.clear();
    }

    get outputTexture() {
        return this.canvas;
    }
}

class BackgroundLayer extends DrawLayer {
    constructor() {
        super(windowWidth * 0.33, windowHeight * 0.33);
        this.gradient0 = chroma.scale(['#030009', '#27125d', '#153180', '#6a50de', '#8898ea','#6553db', '#181174', '#030009']).mode('lch');
        this.gradient1 = chroma.scale(['#0b0221', '#411252', '#623b8f', '#7179d3', '#8990e2','#8f68b5', '#51268e', '#0b0221']).mode('lch');
        this.gradient2 = chroma.scale(['#0d042d', '#50105e', '#7b51ad', '#8b79c0', '#8f92d4','#b35eae', '#472479', '#0d042d']).mode('lch');
        this.gradient3 = chroma.scale(['#18042f', '#7d3237', '#a3594f', '#a06bc6', '#9d90d1','#c65582', '#99377d', '#1d042f']).mode('lch');
    }

    draw(timeOfDay) {
        super.draw();
        this.canvas.shader(skyShader);
        const color0 = color(this.gradient0(timeOfDay).darken(Math.abs(0.5 - timeOfDay)).hex());
        const color1 = color(this.gradient1(timeOfDay).darken(Math.abs(0.5 - timeOfDay)).hex());
        const color2 = color(this.gradient2(timeOfDay).darken(Math.abs(0.5 - timeOfDay)).hex());
        const color3 = color(this.gradient3(timeOfDay).darken(Math.abs(0.5 - timeOfDay)).hex());
        skyShader.setUniform('uColor0', color0._array);
        skyShader.setUniform('uColor1', color1._array);
        skyShader.setUniform('uColor2', color2._array);
        skyShader.setUniform('uColor3', color3._array);
        skyShader.setUniform('uTime', frameCount * 0.001);
        skyShader.setUniform('uWindowWidth', windowWidth); 
        this.canvas.rect(-windowWidth * 0.5, -windowHeight * 0.5, windowWidth, windowHeight);
    }
}

class FireflyLayer extends DrawLayer {
    constructor() {
        super(windowWidth, windowHeight);
        this.hBlur = createGraphics(windowWidth * 0.25, windowHeight * 0.25, WEBGL);
        this.vBlur = createGraphics(windowWidth * 0.25, windowHeight * 0.25, WEBGL);
        this.bloom = createGraphics(windowWidth, windowHeight, WEBGL);
        this.hBlur.noStroke();
        this.vBlur.noStroke();
        this.bloom.noStroke();
    }

    draw() {
        this.hBlur.clear();
        this.vBlur.clear();
        this.bloom.clear();
        this.hBlur.shader(hBlurShader);
        hBlurShader.setUniform('uTex', this.canvas);
        hBlurShader.setUniform('uTexelSize', [1.0 / windowWidth, 1.0 / windowHeight]);
        hBlurShader.setUniform('uDirection', [1.0, 0.0]);
        this.hBlur.rect(-windowWidth * 0.5, -windowHeight * 0.5, windowWidth, windowHeight);
        this.vBlur.shader(vBlurShader);
        vBlurShader.setUniform('uTex', this.hBlur);
        vBlurShader.setUniform('uTexelSize', [1.0 / windowWidth, 1.0 / windowHeight]);
        vBlurShader.setUniform('uDirection', [0.0, 1.0]);
        this.vBlur.rect(-windowWidth * 0.5, -windowHeight * 0.5, windowWidth, windowHeight);
        this.bloom.shader(bloomShader);
        bloomShader.setUniform('uTex0', this.canvas);
        bloomShader.setUniform('uTex1', this.vBlur);
        bloomShader.setUniform('uAmount', 25);
        this.bloom.rect(-windowWidth * 0.5, -windowHeight * 0.5, windowWidth, windowHeight);
        super.draw();

    }

    get outputTexture() {
        // return this.hBlur;
        return this.bloom;
        // return this.canvas;
    }
}

// Happens on base canvas
class BlendLayer extends DrawLayer {
    constructor(backgroundCanvas, foregroundCanvas) {
        super(windowWidth, windowHeight, true);
        this.setUnis = () => {
            shader(blendShader);
            blendShader.setUniform('uBgTex', backgroundCanvas);
            blendShader.setUniform('uFgTex', foregroundCanvas);
        }
    }

    draw() {
        this.setUnis();
        rect(-windowWidth * 0.5, -windowHeight * 0.5, windowWidth, windowHeight);
    }
}

class Simulation {
    constructor() {
        this.reset();
    }

    simulate() {
        this.timeOfDay = (this.timeOfDay + deltaTime * parameters.dayNightFrequency * 0.001) % 1; // Midnight is 0 and 1, noon is 0.5
        this.fireflySystem.simulate(this.timeOfDay);
    }

    draw() {
        this.backgroundLayer.draw(this.timeOfDay);
        this.fireflyLayer.draw();
        this.fireflySystem.draw();
        this.blendLayer.draw();
    }

    reset() {
        this.backgroundLayer = new BackgroundLayer();
        this.fireflyLayer = new FireflyLayer();
        this.blendLayer = new BlendLayer(this.backgroundLayer.outputTexture, this.fireflyLayer.outputTexture);
        // this.foodSystem = new ParticleSystem(100, Food, this.backgroundLayer);
        this.fireflySystem = new ParticleSystem(parameters.numFireflies, Firefly, this.fireflyLayer);
        this.fireflySystem.init();
        this.timeOfDay = 0;
    }
}

//// Main p5.js functions

function preload() {
    skyShader = loadShader('shaders/fullscreen.vert', 'shaders/sky.frag');
    blendShader = loadShader('shaders/fullscreen.vert', 'shaders/blend.frag');
    hBlurShader = loadShader('shaders/fullscreen.vert', 'shaders/blur.frag');
    vBlurShader = loadShader('shaders/fullscreen.vert', 'shaders/blur.frag');
    bloomShader = loadShader('shaders/fullscreen.vert', 'shaders/bloom.frag');
}

function setup() {
    gui = new dat.GUI({ name: "Sim Params", width: windowWidth / 4 });
    dat.GUI.toggleHide();
    setupGui();
    simulation = new Simulation();
}

function draw() {
    simulation.simulate();
    simulation.draw();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    simulation.reset();
}