import { describe, expect, it } from 'vitest';

import { decodeUvarint, encodeUvarint } from '../../src/protocol/uvarint';

describe('uvarint', () => {
  it('encodes and decodes representative values', () => {
    const values = [0, 1, 2, 127, 128, 255, 300, 16384, 65535, 1048576];

    for (const value of values) {
      const encoded = encodeUvarint(value);
      const decoded = decodeUvarint(encoded, 0);

      expect(decoded.value).toBe(value);
      expect(decoded.nextOffset).toBe(encoded.length);
    }
  });

  it('rejects truncated values', () => {
    expect(() => decodeUvarint(Uint8Array.from([0x80]), 0)).toThrowError(/截断|非法/);
  });

  it('rejects negative values on encode', () => {
    expect(() => encodeUvarint(-1)).toThrowError(/非负/);
  });
});
