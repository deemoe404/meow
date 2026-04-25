import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from './base-n-digits';
import { packFrame, unpackFrame } from './frame';
import {
  decodeCatToDigits,
  encodeDigitsToCat,
} from './tokens';
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

export function createNya152Codec(adapter: CompressionAdapter) {
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
    const digits = bytesToBaseNDigitsNoPad(frame);

    return {
      cat: encodeDigitsToCat(digits),
      meta: buildMeta(
        choice.codec,
        digits.length,
      ),
    };
  }

  async function decode(cat: string): Promise<DecodeResult> {
    await ensureReady();

    const digits = decodeCatToDigits(cat);
    const frameBytes = baseNDigitsToBytesNoPad(digits);
    const frame = unpackFrame(frameBytes);
    const raw = await adapter.decodePayload(frame.codec, frame.payload);

    return {
      text: textDecoder.decode(raw),
      meta: buildMeta(
        frame.codec,
        digits.length,
      ),
    };
  }

  return {
    ready: ensureReady,
    encode,
    decode,
  };
}
