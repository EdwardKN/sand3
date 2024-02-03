importScripts("./shared.js")

onmessage = (message) => {
    let messageData = message.data;
    if (messageData.type == "frameBuffer") {
        postMessage(updateFrameBuffer(messageData.elements, messageData.backgroundElements, messageData.frameBuffer, messageData.particlesInChunk));
    } else if (messageData.type == "test") {
        console.log(messageData)
    } else {
        postMessage("unknownMessageType")
    }

}

