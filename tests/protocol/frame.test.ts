import { describe, expect, it } from 'vitest';

import { packFrame, unpackFrame } from '../../src/protocol/frame';

describe('protocol frame', () => {
  it('packs and unpacks a raw frame', () => {
    const payload = Uint8Array.from([1, 2, 3, 4, 5]);
    const frame = packFrame({
      codec: 0,
      payload,
    });
    const unpacked = unpackFrame(frame);

    expect(frame).toEqual(Uint8Array.from([1, 1, 2, 3, 4, 5]));
    expect(unpacked.codec).toBe(0);
    expect(unpacked.payload).toEqual(payload);
  });

  it('packs zstd-dict with a non-zero wire tag', () => {
    const payload = Uint8Array.from([9, 8]);
    const frame = packFrame({
      codec: 1,
      payload,
    });
    const unpacked = unpackFrame(frame);

    expect(frame).toEqual(Uint8Array.from([2, 9, 8]));
    expect(unpacked.codec).toBe(1);
    expect(unpacked.payload).toEqual(payload);
  });

  it('treats the remaining bytes as payload', () => {
    const frame = Uint8Array.from([2, 0x09, 0x08]);
    const unpacked = unpackFrame(frame);

    expect(unpacked.codec).toBe(1);
    expect(unpacked.payload).toEqual(Uint8Array.from([0x09, 0x08]));
  });
});
