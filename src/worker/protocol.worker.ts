/// <reference lib="webworker" />

import { SAMPLE_TEXTS } from '../content/samples';
import { createBrowserCompressionAdapter } from '../protocol/browser-compression';
import { createNya256Codec } from '../protocol/nya256';
import { createWorkerHandler } from './handler';
import type { CodecInfo, WorkerRequest, WorkerResponse } from './messages';

const compression = createBrowserCompressionAdapter();
const codec = createNya256Codec(compression);

function codecInfo(name: 'raw' | 'zstd-dict'): CodecInfo {
  switch (name) {
    case 'raw':
      return { id: 0, name };
    case 'zstd-dict':
      return { id: 1, name };
  }
}

const handler = createWorkerHandler({
  async ready() {
    const ready = await compression.init();
    return {
      codecs: ready.codecs.map(codecInfo),
      wasmLoaded: ready.wasmLoaded,
    };
  },
  encode: codec.encode,
  decode: codec.decode,
  sample() {
    const index = Math.floor(Math.random() * SAMPLE_TEXTS.length);
    return { text: SAMPLE_TEXTS[index] };
  },
});

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const response = await handler(event.data);
  self.postMessage(response as WorkerResponse);
};

export {};
