import { ProtocolError } from './errors';

const MAX_VARINT_BYTES = 10;

export function encodeUvarint(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ProtocolError('uvarint 只能编码非负安全整数。', 'invalid-input');
  }

  const bytes: number[] = [];
  let remaining = value;

  do {
    let byte = remaining & 0x7f;
    remaining = Math.floor(remaining / 0x80);
    if (remaining > 0) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (remaining > 0);

  return Uint8Array.from(bytes);
}

export function decodeUvarint(
  bytes: Uint8Array,
  offset: number,
): { value: number; nextOffset: number } {
  let value = 0;
  let shift = 0;
  let cursor = offset;

  while (cursor < bytes.length && cursor - offset < MAX_VARINT_BYTES) {
    const byte = bytes[cursor];
    value += (byte & 0x7f) * 2 ** shift;
    cursor += 1;

    if ((byte & 0x80) === 0) {
      if (!Number.isSafeInteger(value)) {
        throw new ProtocolError('uvarint 超出安全整数范围。', 'invalid-input');
      }
      return { value, nextOffset: cursor };
    }

    shift += 7;
  }

  throw new ProtocolError('uvarint 数据截断或非法。', 'corrupted-data');
}
