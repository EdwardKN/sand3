importScripts("./shared.js")

onmessage = async (message) => {
    let messageData = message.data;
    //console.log(messageData.type)
    if (messageData.type == "frameBuffer") {
        let frameBuffer = await updateFrameBuffer(messageData.elements, messageData.backgroundElements, messageData.frameBuffer, messageData.particlesInChunk)
        postMessage(frameBuffer);
    } else if (messageData.type == "getElement") {
        postMessage(getElementAtCellFasterReal(messageData.x, messageData.y, messageData.chunks))
    } else {
        postMessage("unknownMessageType")
    }

}

