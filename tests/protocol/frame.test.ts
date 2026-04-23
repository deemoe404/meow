import { describe, expect, it } from 'vitest';

import { packFrame, unpackFrame } from '../../src/protocol/frame';

describe('protocol frame', () => {
  it('packs and unpacks a raw frame', () => {
    const payload = Uint8Array.from([1, 2, 3, 4, 5]);
    const frame = packFrame({
      codec: 0,
      rawLength: 5,
      payload,
    });
    const unpacked = unpackFrame(frame);

    expect(unpacked.version).toBe(2);
    expect(unpacked.codec).toBe(0);
    expect(unpacked.rawLength).toBe(5);
    expect(unpacked.payload).toEqual(payload);
  });

  it('rejects bad magic', () => {
    const bad = Uint8Array.from([0, 0, 1, 0, 0, 0, 0, 0, 0]);
    expect(() => unpackFrame(bad)).toThrowError(/magic/i);
  });

  it('treats the remaining bytes as payload', () => {
    const frame = Uint8Array.from([0x4e, 0x59, 0x02, 0x01, 0x03, 0x09, 0x08]);
    const unpacked = unpackFrame(frame);

    expect(unpacked.codec).toBe(1);
    expect(unpacked.rawLength).toBe(3);
    expect(unpacked.payload).toEqual(Uint8Array.from([0x09, 0x08]));
  });
});
