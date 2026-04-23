import { ProtocolError } from './errors';
import type { CodecId, FrameData, FrameInput } from './types';

const RAW_WIRE_TAG = 0x01;
const ZSTD_DICT_WIRE_TAG = 0x02;

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function codecToWireTag(codec: CodecId): number {
  switch (codec) {
    case 0:
      return RAW_WIRE_TAG;
    case 1:
      return ZSTD_DICT_WIRE_TAG;
  }
}

function wireTagToCodec(tag: number): CodecId {
  switch (tag) {
    case RAW_WIRE_TAG:
      return 0;
    case ZSTD_DICT_WIRE_TAG:
      return 1;
    default:
      throw new ProtocolError(`不支持的 codec tag: ${tag}`, 'unsupported');
  }
}

export function packFrame(input: FrameInput): Uint8Array {
  return concatBytes([
    Uint8Array.of(codecToWireTag(input.codec)),
    input.payload,
  ]);
}

export function unpackFrame(frame: Uint8Array): FrameData {
  if (frame.length < 1) {
    throw new ProtocolError('frame 太短。', 'corrupted-data');
  }

  return {
    codec: wireTagToCodec(frame[0]),
    payload: frame.slice(1),
  };
}
