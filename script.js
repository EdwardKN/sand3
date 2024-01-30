const CHUNKSIZE = 32;

var chunks = {};
var player;

const MOUSESIZE = 10;

var chunkAmount = 0;

var maxSimulatedAtTime = 200;

function init() {
    player = new Player();
    fixCanvas();
    testGenerate(20, 20);
    update();
}
async function update() {
    requestAnimationFrame(update);

    renderC.imageSmoothingEnabled = false;

    renderC.clearRect(0, 0, renderCanvas.width, renderCanvas.height)
    c.clearRect(0, 0, canvas.width, canvas.height);

    player.update();

    updateChunks();

    drawVisibleChunks();

    updateCursor();

    c.drawText(fps, 10, 20, 10)

    c.drawText(chunkAmount, 10, 40, 10)


    renderC.drawImage(canvas, 0, 0, renderCanvas.width, renderCanvas.height);

};

function updateCursor() {
    c.lineWidth = 1;
    c.strokeStyle = "black";
    c.strokeRect(mouse.x - MOUSESIZE / 2, mouse.y - MOUSESIZE / 2, MOUSESIZE, MOUSESIZE);

    /*
    let x = ~~(mouse.x - ~~(MOUSESIZE / 2 - player.x))
    let y = ~~(mouse.y - ~~(MOUSESIZE / 2 - player.y))

    let chunkX = ((x - (x < 0 ? -1 : 0)) / CHUNKSIZE) + (x < 0 ? -1 : 0);
    let chunkY = ((y - (y < 0 ? -1 : 0)) / CHUNKSIZE) + (y < 0 ? -1 : 0);

    let elementX = ((x % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
    let elementY = ((y % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;

    c.drawText(~~chunkY + "      " + ~~elementY, mouse.x, mouse.y)
    */

    if (mouse.down) {
        //mouse.down = false;
        for (let i = 0; i < Math.pow(MOUSESIZE, 2); i++) {
            let x = ~~(mouse.x + ~~(i / MOUSESIZE) - ~~(MOUSESIZE / 2 - player.x));
            let y = ~~(mouse.y + i % MOUSESIZE - ~~(MOUSESIZE / 2 - player.y))

            let chunkX = ~~((x - (x < 0 ? -1 : 0)) / CHUNKSIZE) + (x < 0 ? -1 : 0);
            let chunkY = ~~((y - (y < 0 ? -1 : 0)) / CHUNKSIZE) + (y < 0 ? -1 : 0);

            let elementX = ((x % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
            let elementY = ((y % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;


            if (!chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)]) {
                chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = new Liquid(chunkX * CHUNKSIZE + elementX, chunkY * CHUNKSIZE + elementY, [10, 10, 255, 255]);

                chunks[`${chunkX},${chunkY}`].updateFrameBuffer();
                chunks[`${chunkX},${chunkY}`].shouldStepNextFrame = true;
            }
        }

    }
}

function drawVisibleChunks() {
    for (let x = -1; x < STANDARDX * RENDERSCALE / CHUNKSIZE + 1; x++) {
        for (let y = -1; y < STANDARDY * RENDERSCALE / CHUNKSIZE + 1; y++) {
            let chunk = chunks[`${x + ~~(player.x / CHUNKSIZE)},${y + ~~(player.y / CHUNKSIZE)}`];
            if (chunk) {
                c.putImageData(chunk.frameBuffer, x * CHUNKSIZE - player.x % CHUNKSIZE, y * CHUNKSIZE - player.y % CHUNKSIZE)
                if (chunk.hasUpdatedSinceFrameBufferChange) {
                    chunk.updateFrameBuffer();
                }
                //c.strokeRect(x * CHUNKSIZE - player.x % CHUNKSIZE, y * CHUNKSIZE - player.y % CHUNKSIZE, CHUNKSIZE, CHUNKSIZE)

                //c.drawText(`${x + ~~(player.x / CHUNKSIZE)},${y + ~~(player.y / CHUNKSIZE)}`, x * CHUNKSIZE - player.x % CHUNKSIZE + CHUNKSIZE / 2, y * CHUNKSIZE - player.y % CHUNKSIZE + CHUNKSIZE / 2)
            }
        }
    }
}

async function updateChunks() {
    let filteredChunks = Object.values(chunks).filter(e => e.shouldStep);
    chunkAmount = filteredChunks.length;
    for (let i = 0; i < filteredChunks.length; i += 2) {
        let chunk = filteredChunks[i];
        chunk.updateElements();
    }
    for (let i = 1; i < filteredChunks.length; i += 2) {
        let chunk = filteredChunks[i];
        chunk.updateElements();
    }

    Object.values(chunks).forEach(e => {
        e.shiftShouldStepAndReset()
    });
}

class Chunk {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frameBuffer = new ImageData(CHUNKSIZE, CHUNKSIZE);
        this.shouldStep = true;
        this.shouldStepNextFrame = false;
        this.hasUpdatedSinceFrameBufferChange = true;
        this.elements = [];
    }
    initElements() {
        for (let i = 0; i < CHUNKSIZE; i++) {
            this.elements.push(undefined);
        }
    }
    shiftShouldStepAndReset() {
        this.shouldStep = this.shouldStepNextFrame;
        this.shouldStepNextFrame = false;
    }
    updateFrameBuffer() {
        this.hasUpdatedSinceFrameBufferChange = false;
        for (let x = 0; x < CHUNKSIZE; x++) {
            for (let y = 0; y < CHUNKSIZE; y++) {
                let coord = elementCoordinate(x, y)
                let el = this.elements[coord];
                let dataIndex = coord * 4
                for (let i = 0; i < 4; i++) {
                    this.frameBuffer.data[dataIndex + i] = el?.col[i] || 255;
                }
            }
        }
    }
    updateElements() {
        this.hasUpdatedSinceFrameBufferChange = true;
        let filteredElements = this.elements.filter(e => (e instanceof MovableSolid || e instanceof Liquid))

        for (let i = 0; i < filteredElements.length; i += 2) {
            let element = filteredElements[i];
            element.step();
        }
        for (let i = 1; i < filteredElements.length; i += 2) {
            let element = filteredElements[i];
            element.step();
        }
    }
}

class Element {
    constructor(x, y, col) {
        this.x = x;
        this.y = y;
        this.col = col;
    }
    moveTo(x, y) {
        let chunkX = ~~((this.x - (this.x < 0 ? -1 : 0)) / CHUNKSIZE) + (this.x < 0 ? -1 : 0);
        let chunkY = ~~((this.y - (this.y < 0 ? -1 : 0)) / CHUNKSIZE) + (this.y < 0 ? -1 : 0);

        let newChunkX = ~~((x - (x < 0 ? -1 : 0)) / CHUNKSIZE) + (x < 0 ? -1 : 0);
        let newChunkY = ~~((y - (y < 0 ? -1 : 0)) / CHUNKSIZE) + (y < 0 ? -1 : 0);

        let elementX = ((this.x % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
        let elementY = ((this.y % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;

        let newElementX = ((x % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
        let newElementY = ((y % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;

        let elementOnNewPos = getElementAtCell(x, y);

        if (elementOnNewPos) {
            elementOnNewPos.x = this.x;
            elementOnNewPos.y = this.y;
            chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = elementOnNewPos;
        } else {
            chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = undefined;
        }
        this.x = x;
        this.y = y;

        chunks[`${newChunkX},${newChunkY}`].elements[elementCoordinate(newElementX, newElementY)] = this;

        chunks[`${newChunkX},${newChunkY}`].shouldStepNextFrame = true;
        chunks[`${chunkX},${chunkY}`].shouldStepNextFrame = true;

        chunks[`${chunkX + 1},${chunkY}`].shouldStepNextFrame = true;
        chunks[`${chunkX - 1},${chunkY}`].shouldStepNextFrame = true;
        chunks[`${chunkX},${chunkY + 1}`].shouldStepNextFrame = true;
        chunks[`${chunkX},${chunkY - 1}`].shouldStepNextFrame = true;

    }
}

class Solid extends Element {

}

class MovableSolid extends Solid {
    step() {
        let targetCell = getElementAtCell(this.x, this.y + 1);
        if (targetCell == undefined) {
            this.moveTo(this.x, this.y + 1)
        } else {
            this.lookDiagonally(~~(Math.random() * 2) || -1, true);
        }
    }
    lookDiagonally(dir, first) {
        let targetCell = getElementAtCell(this.x + dir, this.y + 1);

        if (targetCell == undefined) {
            this.moveTo(this.x + dir, this.y + 1)
        } else if (first == true) {
            this.lookDiagonally(-dir, false);
        }
    }
}
class Liquid extends Element {
    constructor(x, y, col) {
        super(x, y, col)
        this.dispersionRate = 5;
    }
    step() {
        let targetCell = getElementAtCell(this.x, this.y + 1);
        if (targetCell == undefined) {
            this.moveTo(this.x, this.y + 1)
        } else {
            this.lookHorizontally(Math.random() > 0.5 ? -1 : 1);
        }
    }
    lookHorizontally(dir) {
        let maxDir = 0;
        for (let i = 1; i < this.dispersionRate + 1; i++) {
            let targetCell1 = getElementAtCell(this.x + dir * i, this.y);
            let targetCell2 = getElementAtCell(this.x + dir * -i, this.y);
            if (targetCell1 == undefined) {
                maxDir = i * dir
            } else if (targetCell2 == undefined) {
                maxDir = i * dir * -1
            } else {
                i = undefined;
            }
        }
        if (maxDir !== 0) {
            if (maxDir * dir < 0) {
                this.lookHorizontally(-dir)
            } else {
                this.moveTo(this.x + maxDir, this.y)
            }
        }
    }
}
class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
    }
    update() {
        if (pressedKeys['KeyA']) {
            this.x--;
        }
        if (pressedKeys['KeyD']) {
            this.x++;
        }
        if (pressedKeys['KeyW']) {
            this.y--;
        }
        if (pressedKeys['KeyS']) {
            this.y++;
        }
    }
}

function elementCoordinate(x, y) {
    return y * CHUNKSIZE + x;
}

function getElementAtCell(x, y) {
    let chunkX = ~~((x - (x < 0 ? -1 : 0)) / CHUNKSIZE) + (x < 0 ? -1 : 0);
    let chunkY = ~~((y - (y < 0 ? -1 : 0)) / CHUNKSIZE) + (y < 0 ? -1 : 0);

    let elementX = ((x % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
    let elementY = ((y % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;

    return chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)];
}

function testGenerate(chunkX, chunkY) {
    for (let x = -chunkX; x <= chunkX; x++) {
        for (let y = -chunkY; y <= chunkY; y++) {
            chunks[`${x},${y}`] = new Chunk(x, y)
            for (let elementX = 0; elementX < CHUNKSIZE; elementX++) {
                for (let elementY = 0; elementY < CHUNKSIZE; elementY++) {
                    let perlin = getPerlinNoise(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, 20, 100)
                    if (perlin > 0.5 || Math.abs(x) > chunkX - 1 || Math.abs(y) > chunkX - 1) {
                        chunks[`${x},${y}`].elements[elementCoordinate(elementX, elementY)] = new Solid(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, [~~(perlin * 255), ~~(perlin * 255), ~~(perlin * 255), 255]);
                    }
                }
            }
        }
    }
    Object.values(chunks).forEach(e => e.updateFrameBuffer());
}
function getPerlinNoise(x, y, perlinSeed, resolution) {
    noise.seed(perlinSeed);

    var value = noise.simplex2(x / resolution, y / resolution);
    value++;
    value /= 2;

    return value;

}

window.onload = init;