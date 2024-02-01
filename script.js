const CHUNKSIZE = 32;
const TEXTURESIZE = 128;

const TRANS = true;

var chunks = {};
var particles = [];
var player;

const MOUSESIZE = 10;

var chunkAmount = 0;

var maxSimulatedAtTime = 200;

var particlesOnScreen = 0;

var tool = 1;

async function init() {
    await loadData();
    await new Promise(e => setTimeout(e, 500));
    player = new Player();
    fixCanvas();
    //testGenerate(20, 20);
    update();
}
async function update() {
    requestAnimationFrame(update);

    renderC.imageSmoothingEnabled = false;

    renderC.clearRect(0, 0, renderCanvas.width, renderCanvas.height)
    c.clearRect(0, 0, canvas.width, canvas.height);

    player.update();

    updateParticles();

    updateChunks();

    drawVisibleChunks();

    updateCursor();

    c.drawText(tool, 10, 10, 10)

    c.drawText(fps, 10, 20, 10)

    c.drawText(chunkAmount, 10, 30, 10)

    c.drawText(maxSimulatedAtTime, 10, 40, 10)

    c.drawText(particlesOnScreen, 10, 50, 10)

    c.drawText(Object.values(chunks).length, 10, 60, 10)


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
        let area = Math.pow(MOUSESIZE, 2);
        for (let i = 0; i < area; i++) {
            let x = ~~(mouse.x + ~~(i / MOUSESIZE) - ~~(MOUSESIZE / 2 - player.x));
            let y = ~~(mouse.y + i % MOUSESIZE - ~~(MOUSESIZE / 2 - player.y))

            let chunkX = ~~((x - (x < 0 ? -1 : 0)) / CHUNKSIZE) + (x < 0 ? -1 : 0);
            let chunkY = ~~((y - (y < 0 ? -1 : 0)) / CHUNKSIZE) + (y < 0 ? -1 : 0);

            let elementX = ((x % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
            let elementY = ((y % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;

            if (chunks[`${chunkX},${chunkY}`]) {
                if (!chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)]) {
                    if (tool == 1) {
                        let offset = randomIntFromRange(0, 30) - 15
                        chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = new Liquid(chunkX * CHUNKSIZE + elementX, chunkY * CHUNKSIZE + elementY, [102 + offset, 171 + offset, 230 + offset / 2, 150]);
                    } else if (tool == 2) {
                        let offset = randomIntFromRange(0, 20) - 10
                        chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = new MovableSolid(chunkX * CHUNKSIZE + elementX, chunkY * CHUNKSIZE + elementY, [195 + offset, 195 + offset, 145 + offset, 255]);
                    } else if (tool == 4) {
                        let offset = randomIntFromRange(0, 30) - 15
                        mouse.down = false;
                        particles.push(new Particle(chunkX * CHUNKSIZE + elementX, chunkY * CHUNKSIZE + elementY, [102 + offset, 171 + offset, 230 + offset / 2, 100], { x: randomFloatFromRange(-2, 2), y: randomFloatFromRange(-2, -1) }))
                    }

                    chunks[`${chunkX},${chunkY}`].updateFrameBuffer();
                    chunks[`${chunkX},${chunkY}`].shouldStepNextFrame = true;
                } else if (tool == 3) {
                    chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = undefined;

                    chunks[`${chunkX},${chunkY}`].updateFrameBuffer();
                }
            }
        }

    }
}

function changeTool(key) {
    if (key.includes('Digit')) {
        tool = JSON.parse(key.replaceAll('Digit', ''));
    }

}

function drawVisibleChunks() {
    for (let x = -2; x < STANDARDX * RENDERSCALE / CHUNKSIZE + 1; x++) {
        for (let y = -2; y < STANDARDY * RENDERSCALE / CHUNKSIZE + 1; y++) {
            let chunk = chunks[`${x + ~~(player.x / CHUNKSIZE)},${y + ~~(player.y / CHUNKSIZE)}`];
            if (chunk) {
                c.putImageData(chunk.frameBuffer, x * CHUNKSIZE - player.x % CHUNKSIZE, y * CHUNKSIZE - player.y % CHUNKSIZE)
                if (chunk.hasUpdatedSinceFrameBufferChange) {
                    chunk.updateFrameBuffer();
                }
                //c.strokeRect(x * CHUNKSIZE - player.x % CHUNKSIZE, y * CHUNKSIZE - player.y % CHUNKSIZE, CHUNKSIZE, CHUNKSIZE)

                //c.drawText(`${x + ~~(player.x / CHUNKSIZE)},${y + ~~(player.y / CHUNKSIZE)}`, x * CHUNKSIZE - player.x % CHUNKSIZE + CHUNKSIZE / 2, y * CHUNKSIZE - player.y % CHUNKSIZE + CHUNKSIZE / 2)
            } else {
                createNewChunk(x + ~~(player.x / CHUNKSIZE), y + ~~(player.y / CHUNKSIZE))
            }
        }
    }
}

function createNewChunk(x, y) {
    chunks[`${x},${y}`] = new Chunk(x, y)
    for (let elementX = 0; elementX < CHUNKSIZE; elementX++) {
        for (let elementY = 0; elementY < CHUNKSIZE; elementY++) {
            let perlin = getPerlinLayers(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, 20, [100, 50], [5, 1])
            let offset = randomIntFromRange(0, 6) - 3 - 50;
            let texX = ((((x * CHUNKSIZE + elementX) % TEXTURESIZE) + TEXTURESIZE) % TEXTURESIZE);
            let texY = ((((y * CHUNKSIZE + elementY) % TEXTURESIZE) + TEXTURESIZE) % TEXTURESIZE);
            let texData = getWholeImageDataFromSpriteSheet(images.textures.stone, texX, texY)
            if (perlin > 0.5) {
                chunks[`${x},${y}`].elements[elementCoordinate(elementX, elementY)] = new Solid(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, [images.imageData.data[texData] - 170 + ~~(perlin * 100), images.imageData.data[texData + 1] - 170 + ~~(perlin * 100), images.imageData.data[texData + 2] - 170 + ~~(perlin * 100), 255])
                chunks[`${x},${y}`].backgroundElements[elementCoordinate(elementX, elementY)] = new Background(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, [images.imageData.data[texData] - 200 + ~~(perlin * 100), images.imageData.data[texData + 1] - 200 + ~~(perlin * 100), images.imageData.data[texData + 2] - 200 + ~~(perlin * 100), 255]);
            } else {
                chunks[`${x},${y}`].backgroundElements[elementCoordinate(elementX, elementY)] = new Background(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, [images.imageData.data[texData] - 50 + ~~((perlin + 0.5) * 50), images.imageData.data[texData + 1] - 50 + ~~((perlin + 0.5) * 50), images.imageData.data[texData + 2] - 50 + ~~((perlin + 0.5) * 50), 255]);
            }
        }
    }
}

function updateParticles() {
    let filteredParticles = particles.filter(particle => detectCollision(particle.drawX, particle.drawY, 1, 1, ~~(player.x), ~~(player.y), STANDARDX * RENDERSCALE, STANDARDY * RENDERSCALE));

    particlesOnScreen = filteredParticles.length

    filteredParticles.forEach(e => e.updatePos());

    let otherParticles = particles.filter(particle => !detectCollision(particle.drawX, particle.drawY, 1, 1, ~~(player.x), ~~(player.y), STANDARDX * RENDERSCALE, STANDARDY * RENDERSCALE));

    otherParticles.forEach(particle => particle.convertToElement());
}

async function updateChunks() {
    let filteredChunks = Object.values(chunks).filter(e => e.shouldStep);
    filteredChunks = filteredChunks.sort((a, b) => distance(a.x * CHUNKSIZE - canvas.width / 2, a.y * CHUNKSIZE - canvas.height / 2, player.x, player.y) - distance(b.x * CHUNKSIZE - canvas.width / 2, b.y * CHUNKSIZE - canvas.height / 2, player.x, player.y))
    let notStepped = filteredChunks.splice(maxSimulatedAtTime, filteredChunks.length - maxSimulatedAtTime);
    chunkAmount = filteredChunks.length;
    for (let i = 0; i < filteredChunks.length; i += 2) {
        let chunk = filteredChunks[i];
        chunk.updateElements();
    }
    for (let i = 1; i < filteredChunks.length; i += 2) {
        let chunk = filteredChunks[i];
        chunk.updateElements();
    }
    notStepped.forEach(e => e.hasStepped = false);
    Object.values(chunks).forEach(e => {
        e.shiftShouldStepAndReset()
    });
    if (chunkAmount == maxSimulatedAtTime) {
        if (fps > 58) {
            maxSimulatedAtTime++;
        }
    }
    if (fps < 60) {
        maxSimulatedAtTime--;
        if (maxSimulatedAtTime < 15) maxSimulatedAtTime = 15;
    }
}

class Chunk {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frameBuffer = new ImageData(CHUNKSIZE, CHUNKSIZE);
        this.shouldStep = true;
        this.shouldStepNextFrame = false;
        this.hasStepped = true;
        this.hasUpdatedSinceFrameBufferChange = true;
        this.elements = [];
        this.backgroundElements = [];
    }
    initElements() {
        for (let i = 0; i < CHUNKSIZE; i++) {
            this.elements.push(undefined);
            this.backgroundElements.push(undefined);
        }
    }
    shiftShouldStepAndReset() {
        if (this.hasStepped) {
            this.shouldStep = this.shouldStepNextFrame;
            this.shouldStepNextFrame = false;
        }
    }
    updateFrameBuffer() {
        let particlesInChunk = particles.filter(particle => detectCollision(particle.drawX, particle.drawY, 1, 1, this.x * CHUNKSIZE, this.y * CHUNKSIZE, CHUNKSIZE, CHUNKSIZE));
        this.hasUpdatedSinceFrameBufferChange = false;
        for (let x = 0; x < CHUNKSIZE; x++) {
            for (let y = 0; y < CHUNKSIZE; y++) {
                let coord = elementCoordinate(x, y)
                let el = this.elements[coord] || undefined;
                let backgroundEL = this.backgroundElements[coord];
                let dataIndex = coord * 4
                if (!el) {
                    for (let i = 0; i < 4; i++) {
                        this.frameBuffer.data[dataIndex + i] = backgroundEL?.drawCol[i] || 255;
                    }
                } else if (TRANS) {
                    for (let i = 0; i < 3; i++) {
                        let ca = el?.drawCol[i];
                        let aa = el?.drawCol[3] / 255;
                        let cb = backgroundEL?.drawCol[i] || 255;
                        let ab = (backgroundEL?.drawCol[3] || 255) / 255;
                        let a0 = aa + ab * (1 - aa);

                        this.frameBuffer.data[dataIndex + i] = (ca * aa + cb * ab * (1 - aa)) / a0;
                    }
                    this.frameBuffer.data[dataIndex + 3] = 255;
                } else {
                    for (let i = 0; i < 4; i++) {
                        this.frameBuffer.data[dataIndex + i] = el?.drawCol[i] || 255;
                    }
                }

            }
        }
        particlesInChunk.forEach(particle => {
            let elementX = ((particle.drawX % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
            let elementY = ((particle.drawY % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
            let coord = elementCoordinate(elementX, elementY);
            let dataIndex = coord * 4
            for (let i = 0; i < 3; i++) {
                let ca = particle?.col[i];
                let aa = particle?.col[3] / 255;
                let cb = this.frameBuffer.data[dataIndex + i] || 255;
                let ab = (this.frameBuffer.data[dataIndex + 3] || 255) / 255;
                let a0 = aa + ab * (1 - aa);

                this.frameBuffer.data[dataIndex + i] = (ca * aa + cb * ab * (1 - aa)) / a0;
            }
            this.frameBuffer.data[dataIndex + 3] = 255;
        })
    }
    updateElements() {
        this.hasStepped = true;
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

class Particle {
    constructor(x, y, col, startVel = {
        x: 0,
        y: 0
    }) {
        this.x = x;
        this.y = y;
        this.drawX = x;
        this.drawY = y;
        this.col = col;

        this.gravity = 0.1;

        this.vel = startVel;
    }
    updatePos() {
        this.vel.y += this.gravity;

        this.x += this.vel.x;
        this.y += this.vel.y;

        this.drawX = ~~this.x;
        this.drawY = ~~this.y;

        let chunkX = ~~((this.drawX - (this.drawX < 0 ? -1 : 0)) / CHUNKSIZE) + (this.drawX < 0 ? -1 : 0);
        let chunkY = ~~((this.drawY - (this.drawY < 0 ? -1 : 0)) / CHUNKSIZE) + (this.drawY < 0 ? -1 : 0);

        if (!chunks[`${chunkX},${chunkY}`]) { createNewChunk(chunkX, chunkY) }
        chunks[`${chunkX},${chunkY}`].hasUpdatedSinceFrameBufferChange = true;

        if (!chunks[`${chunkX + 1},${chunkY}`]) { createNewChunk(chunkX + 1, chunkY) }
        if (!chunks[`${chunkX - 1},${chunkY}`]) { createNewChunk(chunkX - 1, chunkY) }
        if (!chunks[`${chunkX},${chunkY + 1}`]) { createNewChunk(chunkX, chunkY + 1) }
        if (!chunks[`${chunkX},${chunkY - 1}`]) { createNewChunk(chunkX, chunkY - 1) }

        if (chunks[`${chunkX - 1},${chunkY}`]) chunks[`${chunkX - 1},${chunkY}`].hasUpdatedSinceFrameBufferChange = true;
        if (chunks[`${chunkX + 1},${chunkY}`]) chunks[`${chunkX + 1},${chunkY}`].hasUpdatedSinceFrameBufferChange = true;
        if (chunks[`${chunkX},${chunkY - 1}`]) chunks[`${chunkX},${chunkY - 1}`].hasUpdatedSinceFrameBufferChange = true;
        if (chunks[`${chunkX},${chunkY + 1}`]) chunks[`${chunkX},${chunkY + 1}`].hasUpdatedSinceFrameBufferChange = true;

        if (getElementAtCell(this.drawX, this.drawY) !== undefined) {
            this.x -= this.vel.x;
            this.y -= this.vel.y;
            this.drawX = ~~this.x;
            this.drawY = ~~this.y;

            while (getElementAtCell(this.drawX, this.drawY) !== undefined) {
                this.y -= 1;
                this.drawY = ~~this.y;
            }

            this.convertToElement();
        }
    }
    convertToElement() {
        let chunkX = ~~((this.drawX - (this.drawX < 0 ? -1 : 0)) / CHUNKSIZE) + (this.drawX < 0 ? -1 : 0);
        let chunkY = ~~((this.drawY - (this.drawY < 0 ? -1 : 0)) / CHUNKSIZE) + (this.drawY < 0 ? -1 : 0);

        let elementX = ((this.drawX % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
        let elementY = ((this.drawY % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
        if (!chunks[`${chunkX},${chunkY}`]) { createNewChunk(chunkX, chunkY) }
        chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = new Liquid(chunkX * CHUNKSIZE + elementX, chunkY * CHUNKSIZE + elementY, this.col);
        chunks[`${chunkX},${chunkY}`].updateFrameBuffer();
        chunks[`${chunkX},${chunkY}`].shouldStepNextFrame = true;

        particles.splice(particles.indexOf(this), 1)
    }
}

class Element {
    constructor(x, y, col) {
        this.x = x;
        this.y = y;
        this.col = col;
        this.drawCol = col;

        this.velY = 1;
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

        if (!chunks[`${chunkX},${chunkY}`]) { createNewChunk(chunkX, chunkY) }
        if (!chunks[`${newChunkX},${newChunkY}`]) { createNewChunk(newChunkX, newChunkY) }

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

        if (!chunks[`${chunkX + 1},${chunkY}`]) { createNewChunk(chunkX + 1, chunkY) }
        if (!chunks[`${chunkX - 1},${chunkY}`]) { createNewChunk(chunkX - 1, chunkY) }
        if (!chunks[`${chunkX},${chunkY + 1}`]) { createNewChunk(chunkX, chunkY + 1) }
        if (!chunks[`${chunkX},${chunkY - 1}`]) { createNewChunk(chunkX, chunkY - 1) }

        chunks[`${chunkX + 1},${chunkY}`].shouldStepNextFrame = true;
        chunks[`${chunkX - 1},${chunkY}`].shouldStepNextFrame = true;
        chunks[`${chunkX},${chunkY + 1}`].shouldStepNextFrame = true;
        chunks[`${chunkX},${chunkY - 1}`].shouldStepNextFrame = true;

    }
    convertToParticle(vel = { x: 0, y: 0 }) {
        let chunkX = ~~((this.x - (this.x < 0 ? -1 : 0)) / CHUNKSIZE) + (this.x < 0 ? -1 : 0);
        let chunkY = ~~((this.y - (this.y < 0 ? -1 : 0)) / CHUNKSIZE) + (this.y < 0 ? -1 : 0);
        let elementX = ((this.x % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
        let elementY = ((this.y % CHUNKSIZE) + CHUNKSIZE) % CHUNKSIZE;
        particles.push(new Particle(chunkX * CHUNKSIZE + elementX, chunkY * CHUNKSIZE + elementY, this.col, vel))

        chunks[`${chunkX},${chunkY}`].elements[elementCoordinate(elementX, elementY)] = undefined;

    }
}

class Background extends Element {

}

class Solid extends Element {

}

class MovableSolid extends Solid {
    step() {
        let targetCell = getElementAtCell(this.x, this.y + 1);
        if (targetCell == undefined || targetCell instanceof Liquid) {
            this.lookVertically();
        } else {
            this.lookDiagonally(~~(Math.random() * 2) || -1, true);
        }
    }
    lookVertically() {
        let maxDir = 0;
        for (let i = 1; i < this.velY + 1; i++) {
            let targetCell = getElementAtCell(this.x, this.y + i);
            if (targetCell == undefined || targetCell instanceof Liquid) {
                maxDir = i
            } else {
                i = Infinity;
            }
        }
        if (maxDir !== 0) {
            this.velY++;
            this.moveTo(this.x, this.y + maxDir)
        }
    }
    lookDiagonally(dir, first) {
        let targetCell = getElementAtCell(this.x + dir, this.y + 1);

        if (targetCell == undefined || targetCell instanceof Liquid) {
            this.moveTo(this.x + dir, this.y + 1)
        } else if (first == true) {
            this.lookDiagonally(-dir, false);
        }
    }
}
class Liquid extends Element {
    constructor(x, y, col) {
        super(x, y, col)
        this.dispersionRate = 10;
    }
    step() {
        this.drawCol = [...this.col];
        let targetCell = getElementAtCell(this.x, this.y + 1);
        if (targetCell == undefined) {
            this.lookVertically();
        } else {
            this.velY = 1;
            this.lookHorizontally();
        }
        if (getElementAtCell(this.x, this.y - 1) == undefined) {
            this.drawCol[0] -= 80;
            this.drawCol[1] -= 80;
            this.drawCol[2] -= 80;
        }
    }
    lookVertically() {
        let maxDir = 0;
        for (let i = 1; i < this.velY + 1; i++) {
            let targetCell = getElementAtCell(this.x, this.y + i);
            if (targetCell == undefined) {
                maxDir = i
            } else {
                i = Infinity;
            }
        }
        if (maxDir !== 0) {
            this.velY++;
            this.moveTo(this.x, this.y + maxDir)
        }
    }
    lookHorizontally() {
        let maxLeft = 0;
        let maxRight = 0;
        let leftMaxed = false;
        let rightMaxed = false;
        let maxAmount = (Math.random() * this.dispersionRate * 2) + 1;
        for (let i = 1; i < maxAmount; i++) {
            let targetCell1 = getElementAtCell(this.x + i, this.y);
            let targetCell2 = getElementAtCell(this.x - i, this.y);
            if (!rightMaxed) {
                if (targetCell1 == undefined) {
                    maxRight = i
                } else {
                    rightMaxed = true;
                }
            }
            if (!leftMaxed) {
                if (targetCell2 == undefined && !leftMaxed) {
                    maxLeft = i
                } else {
                    leftMaxed = true;
                }
            }
            if (leftMaxed && rightMaxed) {
                i = Infinity;
            }
        }
        if (maxLeft !== 0 || maxRight !== 0) {
            if (maxLeft > maxRight) {
                if (maxLeft > this.dispersionRate / 2 && detectCollision(this.x, this.y, 1, 1, ~~(player.x), ~~(player.y), STANDARDX * RENDERSCALE, STANDARDY * RENDERSCALE)) {
                    this.convertToParticle({ x: randomFloatFromRange(-1, -0.5), y: randomFloatFromRange(-0.5, -0.2) })
                } else {
                    this.moveTo(this.x - maxLeft, this.y)
                }
            } else if (maxLeft < maxRight) {
                if (maxRight > this.dispersionRate / 2 && detectCollision(this.x, this.y, 1, 1, ~~(player.x), ~~(player.y), STANDARDX * RENDERSCALE, STANDARDY * RENDERSCALE)) {
                    this.convertToParticle({ x: randomFloatFromRange(0.5, 1), y: randomFloatFromRange(-0.5, -0.2) })
                } else {
                    this.moveTo(this.x + maxRight, this.y)
                }
            } else {
                this.moveTo(this.x + maxRight * (~~(Math.random() * 2) || -1), this.y)
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
            this.x -= 3;
        }
        if (pressedKeys['KeyD']) {
            this.x += 3;
        }
        if (pressedKeys['KeyW']) {
            this.y -= 3;
        }
        if (pressedKeys['KeyS']) {
            this.y += 3;
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

    let elementCoordinateValue = elementCoordinate(elementX, elementY);

    let chunkKey = `${chunkX},${chunkY}`;

    return chunks[chunkKey]?.elements[elementCoordinateValue];
}

function testGenerate(chunkX, chunkY) {
    for (let x = -chunkX; x <= chunkX; x++) {
        for (let y = -chunkY; y <= chunkY; y++) {
            chunks[`${x},${y}`] = new Chunk(x, y)
            for (let elementX = 0; elementX < CHUNKSIZE; elementX++) {
                for (let elementY = 0; elementY < CHUNKSIZE; elementY++) {
                    let perlin = getPerlinLayers(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, 20, [100, 50], [5, 1])
                    let offset = randomIntFromRange(0, 6) - 3 - 50;
                    if (perlin > 0.5 || Math.abs(x) > chunkX - 1 || Math.abs(y) > chunkX - 1) {
                        chunks[`${x},${y}`].elements[elementCoordinate(elementX, elementY)] = new Solid(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, [~~(perlin * 255) + offset, ~~(perlin * 255) + offset, ~~(perlin * 255) + offset, 255]);
                        chunks[`${x},${y}`].backgroundElements[elementCoordinate(elementX, elementY)] = new Background(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, [~~(perlin * 255) + offset + 50, ~~(perlin * 255) + offset + 50, ~~(perlin * 255) + offset + 50, 255]);
                    } else {
                        chunks[`${x},${y}`].backgroundElements[elementCoordinate(elementX, elementY)] = new Background(x * CHUNKSIZE + elementX, y * CHUNKSIZE + elementY, [~~(perlin * 255) + offset + 100, ~~(perlin * 255) + offset + 100, ~~(perlin * 255) + offset + 100, 255]);
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
function getPerlinLayers(x, y, perlinSeed, resolutions, weights) {
    let amount = resolutions.length;
    let value = 0;

    for (let i = 0; i < amount; i++) {
        value += getPerlinNoise(x, y, perlinSeed * (i + 1), resolutions[i]) * weights[i];
    }
    value /= sum(weights);
    return value;
}





window.onload = init;