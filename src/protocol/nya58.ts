import {
  base58DigitsToBytesNoPad,
  bytesToBase58DigitsNoPad,
} from './base58-digits';
import { ProtocolError } from './errors';
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
  rawLength: number,
  tokenCount: number,
): ProtocolMeta {
  return {
    codec,
    rawLength,
    tokenCount,
  };
}

export function createNya58Codec(adapter: CompressionAdapter) {
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
      rawLength: raw.length,
      payload: choice.payload,
    });
    const digits = bytesToBase58DigitsNoPad(frame);

    return {
      cat: encodeDigitsToCat(digits),
      meta: buildMeta(
        choice.codec,
        raw.length,
        digits.length,
      ),
    };
  }

  async function decode(cat: string): Promise<DecodeResult> {
    await ensureReady();

    const digits = decodeCatToDigits(cat);
    const frameBytes = base58DigitsToBytesNoPad(digits);
    const frame = unpackFrame(frameBytes);
    const raw = await adapter.decodePayload(frame.codec, frame.payload);

    if (raw.length !== frame.rawLength) {
      throw new ProtocolError('解码后原文字节长度不匹配。', 'corrupted-data');
    }

    return {
      text: textDecoder.decode(raw),
      meta: buildMeta(
        frame.codec,
        frame.rawLength,
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
