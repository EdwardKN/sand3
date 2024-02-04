const CHUNKSIZE = 32;
const TEXTURESIZE = 128;
const TRANS = true;

function elementCoordinate(x, y) {
    return y * CHUNKSIZE + x;
}

function updateFrameBuffer(elements, backgroundElements, frameBuffer, particlesInChunk) {
    for (let x = 0; x < CHUNKSIZE; x++) {
        for (let y = 0; y < CHUNKSIZE; y++) {
            let coord = elementCoordinate(x, y)
            let el = elements[coord] || undefined;
            let backgroundEL = backgroundElements[coord];
            let dataIndex = coord * 4
            if (!el) {
                for (let i = 0; i < 4; i++) {
                    frameBuffer.data[dataIndex + i] = backgroundEL?.drawCol[i] || 255;
                }
            } else if (TRANS) {
                for (let i = 0; i < 3; i++) {
                    let ca = el?.drawCol[i];
                    let aa = el?.drawCol[3] / 255;
                    let cb = backgroundEL?.drawCol[i] || 255;
                    let ab = (backgroundEL?.drawCol[3] || 255) / 255;
                    let a0 = aa + ab * (1 - aa);

                    frameBuffer.data[dataIndex + i] = (ca * aa + cb * ab * (1 - aa)) / a0;
                }
                frameBuffer.data[dataIndex + 3] = 255;
            } else {
                for (let i = 0; i < 4; i++) {
                    frameBuffer.data[dataIndex + i] = el?.drawCol[i] || 255;
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
            let cb = frameBuffer.data[dataIndex + i] || 255;
            let ab = (frameBuffer.data[dataIndex + 3] || 255) / 255;
            let a0 = aa + ab * (1 - aa);

            frameBuffer.data[dataIndex + i] = (ca * aa + cb * ab * (1 - aa)) / a0;
        }
        frameBuffer.data[dataIndex + 3] = 255;
    })
    return frameBuffer;
}
