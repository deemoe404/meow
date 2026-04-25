import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from './base-n-digits';
import { packFrame, unpackFrame } from './frame';
import {
  decodeCatToDigits,
  encodeDigitsToCat,
  getVocabularySize,
} from './tokens';
import type { TokenVocabularyId } from './tokens';
import type {
  CompressionAdapter,
  DecodeResult,
  EncodeResult,
  ProtocolMeta,
} from './types';

function buildMeta(
  codec: ProtocolMeta['codec'],
  tokenCount: number,
  vocabulary: TokenVocabularyId,
): ProtocolMeta {
  return {
    codec,
    tokenCount,
    vocabulary,
  };
}

export function createNya155Codec(adapter: CompressionAdapter) {
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  let initPromise: Promise<unknown> | null = null;

  async function ensureReady(): Promise<void> {
    if (!initPromise) {
      initPromise = adapter.init();
    }

    await initPromise;
  }

  async function encode(
    text: string,
    vocabulary: TokenVocabularyId = 'default',
  ): Promise<EncodeResult> {
    await ensureReady();

    const raw = textEncoder.encode(text);
    const choice = await adapter.choosePayload(raw);
    const frame = packFrame({
      codec: choice.codec,
      payload: choice.payload,
    });
    const digits = bytesToBaseNDigitsNoPad(frame, getVocabularySize(vocabulary));

    return {
      cat: encodeDigitsToCat(digits, vocabulary),
      meta: buildMeta(
        choice.codec,
        digits.length,
        vocabulary,
      ),
    };
  }

  async function decode(
    cat: string,
    vocabulary: TokenVocabularyId = 'default',
  ): Promise<DecodeResult> {
    await ensureReady();

    const digits = decodeCatToDigits(cat, vocabulary);
    const frameBytes = baseNDigitsToBytesNoPad(digits, getVocabularySize(vocabulary));
    const frame = unpackFrame(frameBytes);
    const raw = await adapter.decodePayload(frame.codec, frame.payload);

    return {
      text: textDecoder.decode(raw),
      meta: buildMeta(
        frame.codec,
        digits.length,
        vocabulary,
      ),
    };
  }

  return {
    ready: ensureReady,
    encode,
    decode,
  };
}
