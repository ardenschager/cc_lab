/*    

|              o         |                   
|---..   .,---..,---.,---|                   
|   ||   ||    ||---'|   |                   
`---'`---'`    ``---'`---'                   
                                             
                                             
|                                            
|--- ,---.,---.,---.,---..   .,---.,---.,---.
|    |    |---',---|`---.|   ||    |---'`---.
`---'`    `---'`---^`---'`---'`    `---'`---'

By Arden Schager
    
This is a sketch inspired by the toys we have lost. I wanted to make something that had toys buried in
layers of rock and dirt, with the occasional layer of gross polution. 

XFab makes me think about the material the toys are made of and how 
they might live on in time, to be found by archaeologists one day in layers of human substrate. 

 */

// Constant parameters
const DEFAULT_POINT_SIZE = 3;

const DEFAULT_POINT_VARIANCE = 1;
const NUM_LAYERS = 50;
const MAX_LAYER_SAMPLE_TRIES = 10;
const LAYER_HEIGHT_MOD = 5;
const DRAWS_PER_FRAME = 50;
const LAYER_INDEX_INF = -1/NUM_LAYERS;
const NOISE_SCALE = 0.01;
const NOISE_SCALE_VARIATION = 0.01;
const NOISE_OFFSET = -0.25;
const NOISE_INFUENCE = 1.4;
const NUM_INITIAL_DIRTS = 10000;
const NUM_DIRTS_SCREEN_WIDTH_INFLUENCE = 5;
const DRAW_TOY_CHANCE = 0.5; // chance per frame to draw a toy
const DIRT_CLUMP_SIZE = 2; // size of dirt clumps
const DIRT_COLOR_VARIANCE = 22.5; // statistical variety in dirt colors per layer
const DIRT_POLUTION_COLOR_CHANCE = 0.1; // chance to use a pollution color
const DIRT_COMPLETE_RANDOM_COLOR_CHANCE = 0.045; // chance to completely randomize dirt color
const POSSIBLE_DIRT_COLORS = [
    "#937c73",
    "#94907b",
    "#8d89a4",
    "#958c81",
    "#97a1bc",
    "#414245",
    "#6b707e",
    "#78665e",
    "#68777e",
    "#8c8ea0",
    "#918482",
    "#8899b5",
    "#53453f",
    "#5e606d",
    "#8e846e",
    "#948d79",
    "#83839b",
    "#928b7f",
    "#8e98b0",
    "#494847",
    "#606075",
    "#7a715c",
    "#7c7e70",
    "#8688a0",
    "#898578",
];

const POLLUTION_COLORS = [
    "#b76767",
    "#9c75ad",
    "#6a73a9",
    "#75aab0",
    "#79a67b",
    "#c2b783",
    "#dbab7c",
    "#b47895"
];


const DEFAULT_TOY_SIZE = 3;
const TOY_COLOR_VARIANCE = 50; // statistical variety in toy colors per layer
const TOY_COMPLETE_RANDOM_COLOR_CHANCE = 0.25; // chance to completely randomize toy color
const POSSIBLE_TOY_COLORS = [
    "#FF6B6B",
    "#6BF4B8",
    "#6B8CFF",
    "#FFE56B",
    "#E56BFF",
    "#6BE5FF",
    "#FF9E9E",
    "#9EFFF2",
    "#9EAEFF",
    "#FFFA9E",
    "#FA9EFF",
    "#9EFAFF",
    "#ca3150",
    "#68c68e",
    "#7661c8",
    "#FFFF33",
    "#db62db",
    "#76d2d2",
];


// A class for drawing a circle of a certain size and color at a location
class Point {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    draw() {
        fill(this.color);
        circle(this.x, this.y, this.size);
    }
}

// A class for drawing an elipse of random points centered around a location and at an angle.
// You can also vary the color randomization, number of points, and point size
class RandomCloud {
    constructor(x, y, sizeX, sizeY, angle, numPoints, meanPointSize, pointSizeSpread, averageColor, colorSpread) {
        this.x = x;
        this.y = y;
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.angle = angle;
        this.numPoints = numPoints;
        this.meanPointSize = meanPointSize;
        this.pointSizeSpread = pointSizeSpread;
        this.averageColor = averageColor;
        this.colorSpread = colorSpread;
        this.points = [];
    }

    sample(mean, spread) {
        return mean + (Math.random() * 2 - 1) * spread;
    }

    // Create the points objects for each cloud
    init() {
        this.points.length = 0; // erase points if exists
        for (let i = 0; i < this.numPoints; i++) {
            const factorX = Math.random();
            const factorY = Math.random();
            const theta = Math.random() * 2 * Math.PI;
            const x = this.x + factorX * this.sizeX * Math.cos(theta);
            const y = this.y + factorY * this.sizeY * Math.sin(theta);
            const pointSize = this.sample(this.meanPointSize, this.pointSizeSpread);
            const r = Math.max(Math.min(this.sample(this.averageColor.levels[0], this.colorSpread), 255), 0); // clamp to 0-255
            const g = Math.max(Math.min(this.sample(this.averageColor.levels[1], this.colorSpread), 255), 0); 
            const b = Math.max(Math.min(this.sample(this.averageColor.levels[2], this.colorSpread), 255), 0);
            const a = 255; // alpha
            const col = color(r, g, b, a);
            this.points.push(new Point(x, y, pointSize, col));
        }
    }

    draw() {
        push();
        rotate(this.angle);
        for (let point of this.points) {
            point.draw();
        }
        pop();
    }
}

// Similar to above, but uses a box muller approximation to generate a gaussian distribution of
// points rather than a uniform random distribution. More "cloudy" looking.
class GaussianCloud extends RandomCloud {

    init() {
        this.points.length = 0; // erase points if exists
        for (let i = 0; i < this.numPoints; i++) {
            const x = this.sample(this.x, this.sizeX);
            const y = this.sample(this.y, this.sizeY);
            const pointSize = this.sample(this.meanPointSize, this.pointSizeSpread);
            const r = Math.max(Math.min(this.sample(this.averageColor.levels[0], this.colorSpread), 255), 0); // clamp to 0-255
            const g = Math.max(Math.min(this.sample(this.averageColor.levels[1], this.colorSpread), 255), 0); 
            const b = Math.max(Math.min(this.sample(this.averageColor.levels[2], this.colorSpread), 255), 0);
            const a = 255; // alpha
            const col = color(r, g, b, a);
            this.points.push(new Point(x, y, pointSize, col));
        }
    }

    sample(mean, stddev) {
        // Box-muller approximation for normal distributions inspired by this:
        // https://mika-s.github.io/javascript/random/normal-distributed/2019/05/15/generating-normally-distributed-random-numbers-in-javascript.html
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stddev + mean;
    }
}

// A randomly generated "toy", which is something colorful with a body, eyes, arms, and legs. 
class LostToy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
        if (Math.random() < TOY_COMPLETE_RANDOM_COLOR_CHANCE) { // completely randomize toy color
            this.color = color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
        } else {
            this.color = color(POSSIBLE_TOY_COLORS[Math.floor(Math.random() * POSSIBLE_TOY_COLORS.length)]);
        }
    }

    init() {
        const sizeX = DEFAULT_TOY_SIZE + Math.random() * DEFAULT_TOY_SIZE;
        const sizeY = DEFAULT_TOY_SIZE + Math.random() * DEFAULT_TOY_SIZE;
        const numPoints = 50;
        const meanPointSize = DEFAULT_POINT_SIZE;
        const pointSizeSpread = DEFAULT_POINT_VARIANCE;
        const colorSpread = TOY_COLOR_VARIANCE;
        this.body = new RandomCloud(this.x, this.y, sizeX, sizeY, this.rotation, numPoints, meanPointSize, pointSizeSpread, this.color, colorSpread);
        this.body.init();
        // this.body = new RandomCloud();
        this.bodyParts = [
            this.body,
        ];
    }

    get numPoints() {
        return this.body.numPoints;
    }

    draw() {
        for (let part of this.bodyParts) {
            part.draw();
        }
    }
}

// A layer containing both dirt and toys
class Layer {
    constructor(prevLayer, layerHeight, layerIndex) {
        this.previousLayer = prevLayer;
        this.height = layerHeight;
        this.layerIndex = layerIndex;
        this.isFinalLayer = layerIndex == NUM_LAYERS - 1;
        this.artifacts = [];
        this.isDrawn = false;
        this.numDraws = 0;
        if (Math.random() < DIRT_COMPLETE_RANDOM_COLOR_CHANCE) { // completely randomize dirt color
            this.dirtColor = color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
        } else if (Math.random() < DIRT_POLUTION_COLOR_CHANCE) { // use a pollution color
            this.dirtColor = color(POLLUTION_COLORS[Math.floor(Math.random() * POLLUTION_COLORS.length)]);
        } else {
            this.dirtColor = color(POSSIBLE_DIRT_COLORS[Math.floor(Math.random() * POSSIBLE_DIRT_COLORS.length)]);
        }
        this.topPoint = windowHeight;
        this.bottomPoint = 0;
        this.noiseScale = NOISE_SCALE + (2 * Math.random() - 1) * NOISE_SCALE_VARIATION;
    }

    getTopBoundAt(x) {
        let prevTopBound = windowHeight;
        if (this.previousLayer != null) {
            prevTopBound = this.previousLayer.getTopBoundAt(x);
        }
        return prevTopBound - NOISE_INFUENCE * this.height * (noise(x * this.noiseScale + windowWidth * this.layerIndex) + NOISE_OFFSET);
    }

    getBottomBoundAt(x) {
        if (this.previousLayer != null) {
            return this.previousLayer.getTopBoundAt(x);
        } 
        return windowHeight;
    }

    trySampleLayer() {
        let numTries = 0;
        // console.log(this.getTopBoundAt(0), this.getBottomBoundAt(0), windowHeight, this.height, this.previousLayer);
        while(true) {
            if (numTries > MAX_LAYER_SAMPLE_TRIES) return null; // give up
            const x = Math.random() * windowWidth;
            const y = Math.random() * windowHeight;
            const topBound = this.getTopBoundAt(x);
            const bottomBound = this.getBottomBoundAt(x);
            // console.log(topBound, bottomBound, y);
            if (topBound < y && bottomBound > y) {
                if (y < this.topPoint) {
                    this.topPoint = y;
                }
                if (y > this.bottomPoint) {
                    this.bottomPoint = y;
                }
                return {x: x, y: y};
                // return new Toy(x, y, Math.random() * 2 * Math.PI, Math.random(), Math.random());
            }
            numTries++;
        }
    }

    drawPartial() {
        this.drawDirt();
        this.drawToy();
    }

    drawDirt() {
        for (let i = 0; i < DRAWS_PER_FRAME; i++) {
            const coordinate = this.trySampleLayer();
            if (coordinate != null) {
                const x = coordinate.x;
                const y = coordinate.y;
                const sizeX = DIRT_CLUMP_SIZE;
                const sizeY = DIRT_CLUMP_SIZE;
                const angle = 0;
                const numPoints = 10;
                const meanPointSize = DEFAULT_POINT_SIZE;
                const pointSizeSpread = DEFAULT_POINT_VARIANCE;
                const colorSpread = DIRT_COLOR_VARIANCE;
                const cloud = new GaussianCloud(x, y, sizeX, sizeY, angle, numPoints, meanPointSize, pointSizeSpread, this.dirtColor, colorSpread);
                cloud.init();
                cloud.draw();
            }
            // move on to next state
            this.numDraws++;
            if (this.numDraws > NUM_INITIAL_DIRTS + NUM_DIRTS_SCREEN_WIDTH_INFLUENCE * windowWidth) {
                this.isDrawn = true;
                return;
            }
        }
    }

    drawToy() {
        if (Math.random() < DRAW_TOY_CHANCE ) {
            const coordinate = this.trySampleLayer();
            if (coordinate != null) {
                // coordinate.y = this.getTopBoundAt(coordinate.x);
                const x = coordinate.x;
                const y = coordinate.y;
                const toy = new LostToy(x, y);
                toy.init();
                toy.draw();
            }
        }
    }
}

// A class for building the layers of dirt, rocks, and toy artifacts
class ArtifactGeology {
    constructor() {
        this.layers = [];
    }

    // Todo: vary layer height based on parameter
    getLayerHeight(layerIndex) {
        return (LAYER_HEIGHT_MOD + LAYER_INDEX_INF * layerIndex) * windowHeight / NUM_LAYERS;
    }

    // Build all layers
    build() {
        for (let i = 0; i < NUM_LAYERS; i++) {
            let prevLayer = null;
            if (i > 0) {
                prevLayer = this.layers[i - 1];
            } 
            const layerHeight = this.getLayerHeight(i);
            const layer = new Layer(prevLayer, layerHeight, i);
            this.layers.push(layer);
        }
        this.layerIdx = 0;
    }

    drawPartial() {
        this.layers[this.layerIdx].drawPartial();
        if (this.layers[NUM_LAYERS - 1].isDrawn) {
            this.isDrawn = true;
            return;
        } else if (this.layers[this.layerIdx].isDrawn) {
            this.layerIdx++;
        }
        this.layers[this.layerIdx].drawPartial();
    }
}

let geology;
function setup() {
    createCanvas(windowWidth, windowHeight);
    background("#b6cff1");
    noStroke();
}

function draw() {
    if (geology == null) {
        geology = new ArtifactGeology();
        geology.build();
    }
    if (!geology.isDrawn) {
        geology.drawPartial();
    }
}