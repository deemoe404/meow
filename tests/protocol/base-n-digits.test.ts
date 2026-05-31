import { describe, expect, it } from 'vitest';

import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from '../../src/protocol/base-n-digits';

describe('base-N digits without padding', () => {
  it('round-trips arbitrary byte lengths', () => {
    for (let length = 0; length <= 13; length += 1) {
      const bytes = Uint8Array.from({ length }, (_, index) => (index * 37) % 256);
      const digits = bytesToBaseNDigitsNoPad(bytes);
      const restored = baseNDigitsToBytesNoPad(digits);

      expect(restored).toEqual(bytes);
    }
  });

  it('preserves leading zero bytes', () => {
    const bytes = Uint8Array.from([0, 0, 1, 0, 2, 255]);
    const digits = bytesToBaseNDigitsNoPad(bytes);

    expect(baseNDigitsToBytesNoPad(digits)).toEqual(bytes);
  });

  it('accepts the highest default-base digit during decode', () => {
    const restored = baseNDigitsToBytesNoPad([255]);

    expect(restored).toEqual(Uint8Array.from([255]));
  });

  it('round-trips with a caller-selected base', () => {
    const base = 2048;
    const bytes = Uint8Array.from([255]);
    const digits = bytesToBaseNDigitsNoPad(bytes, base);

    expect(digits).toEqual([255]);
    expect(baseNDigitsToBytesNoPad(digits, base)).toEqual(bytes);
  });

  it('rejects invalid digits during decode', () => {
    expect(() => baseNDigitsToBytesNoPad([256])).toThrowError(/digit/i);
    expect(() => baseNDigitsToBytesNoPad([-1])).toThrowError(/digit/i);
    expect(() => baseNDigitsToBytesNoPad([1.5])).toThrowError(/digit/i);
    expect(() => baseNDigitsToBytesNoPad([2048], 2048)).toThrowError(/digit/i);
  });
});
