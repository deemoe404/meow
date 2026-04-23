import { ProtocolError } from './errors';
import type { FrameData, FrameInput } from './types';
import { decodeUvarint, encodeUvarint } from './uvarint';

const MAGIC = Uint8Array.from([0x4e, 0x59]);
const VERSION = 0x02;

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

export function packFrame(input: FrameInput): Uint8Array {
  return concatBytes([
    MAGIC,
    Uint8Array.of(VERSION),
    Uint8Array.of(input.codec),
    encodeUvarint(input.rawLength),
    input.payload,
  ]);
}

export function unpackFrame(frame: Uint8Array): FrameData {
  if (frame.length < 5) {
    throw new ProtocolError('frame 太短。', 'corrupted-data');
  }

  if (frame[0] !== MAGIC[0] || frame[1] !== MAGIC[1]) {
    throw new ProtocolError('frame magic 非法。', 'corrupted-data');
  }

  const version = frame[2];
  if (version !== VERSION) {
    throw new ProtocolError(`不支持的版本: ${version}`, 'unsupported');
  }

  let offset = 4;
  const codec = frame[3] as FrameData['codec'];
  const rawLength = decodeUvarint(frame, offset);
  offset = rawLength.nextOffset;

  return {
    version,
    codec,
    rawLength: rawLength.value,
    payload: frame.slice(offset),
  };
}
