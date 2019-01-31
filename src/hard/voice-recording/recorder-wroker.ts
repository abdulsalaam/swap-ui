function worker(self: any) {
  let recLength = 0;
  let recBuffers = [];
  let sampleRate: number;
  let numChannels: number;

  this.onmessage = function(e) {
    // console.log("message recived");
    switch (e.data.command) {
        case "init":
            init(e.data.config);
            break;
        case "record":
            record(e.data.buffer);
            break;
        case "exportWAV":
            exportWAV(e.data.type);
            break;
        case "getBuffer":
            getBuffer();
            break;
        case "test":
            compressionTest(e.data.data);
            break;
        case "clear":
            clear();
            break;
    }
  };

  function init(config) {
    sampleRate = config.sampleRate;
    numChannels = config.numChannels;
    initBuffers();
  }

  function record(inputBuffer: AudioBuffer) {
    for (let channel = 0; channel < numChannels; channel++) {
        recBuffers[channel].push(inputBuffer[channel]);
    }
    recLength += inputBuffer[0].length;
  }

  function compressionTest(buf: ArrayBuffer) {
    console.log("Test", buf);

  }

  function exportWAV(type) {
    const buffers = [];
    for (let channel = 0; channel < numChannels; channel++) {
        buffers.push(mergeBuffers(recBuffers[channel], recLength));
    }
    const interleaved = (numChannels === 2 ? interleave(buffers[0], buffers[1]) : buffers[0]);
    const dataview = encodeWAV(interleaved);
    const audioBlob = new Blob([dataview], {type});

    this.postMessage({
      command: "exportWAV",
      data: {
        blob: audioBlob,
        duration: audioBlob.size / (sampleRate * 4) * 2,
      },
    });
  }

  function getBuffer() {
    const buffers = [];
    for (let channel = 0; channel < numChannels; channel++) {
        buffers.push(mergeBuffers(recBuffers[channel], recLength));
    }
    this.postMessage({command: "getBuffer", data: buffers});
  }

  function clear() {
    recLength = 0;
    recBuffers = [];
    initBuffers();
  }

  function initBuffers() {
    for (let channel = 0; channel < numChannels; channel++) {
        recBuffers[channel] = [];
    }
  }

  function mergeBuffers(recordBuffers, recordLength) {
    const result = new Float32Array(recordLength);
    let offset = 0;
    recordBuffers.forEach((v) => {
      result.set(v, offset);
      offset += v.length;
    });
    return result;
}

  function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);

    let index = 0;
    let inputIndex = 0;

    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

  function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

  function writeString(view, offset, val) {
    for (let i = 0; i < val.length; i++) {
        view.setUint8(offset + i, val.charCodeAt(i));
    }
}

  function encodeWAV(samples) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    // console.log("Hard", (sampleRate * 4));
    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
  }
}

export {worker};