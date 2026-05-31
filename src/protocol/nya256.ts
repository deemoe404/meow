import {
  decodeCompactCatToBytes,
  encodeBytesToCompactCat,
  getCompactCatDigitCount,
} from './compact-transport';
import { packFrame, unpackFrame } from './frame';
import type {
  CompressionAdapter,
  DecodeResult,
  EncodeResult,
  ProtocolMeta,
} from './types';

function buildMeta(
  codec: ProtocolMeta['codec'],
  tokenCount: number,
): ProtocolMeta {
  return {
    codec,
    tokenCount,
  };
}

export function createNya256Codec(adapter: CompressionAdapter) {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  let initPromise: Promise<unknown> | null = null;

  async function ensureReady(): Promise<void> {
    if (!initPromise) {
      initPromise = adapter.init();
    }

    await initPromise;
  }

  async function encode(text: string): Promise<EncodeResult> {
    await ensureReady();

    const raw = textEncoder.encode(text);
    const choice = await adapter.choosePayload(raw);
    const frame = packFrame({
      codec: choice.codec,
      payload: choice.payload,
    });
    const cat = encodeBytesToCompactCat(frame);

    return {
      cat,
      meta: buildMeta(
        choice.codec,
        getCompactCatDigitCount(cat),
      ),
    };
  }

  async function decode(cat: string): Promise<DecodeResult> {
    await ensureReady();

    const frameBytes = decodeCompactCatToBytes(cat);
    const frame = unpackFrame(frameBytes);
    const raw = await adapter.decodePayload(frame.codec, frame.payload);

    return {
      text: textDecoder.decode(raw),
      meta: buildMeta(
        frame.codec,
        getCompactCatDigitCount(cat),
      ),
    };
  }

  return {
    ready: ensureReady,
    encode,
    decode,
  };
}
