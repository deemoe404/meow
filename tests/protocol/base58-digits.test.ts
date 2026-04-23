import { describe, expect, it } from 'vitest';

import {
  base58DigitsToBytesNoPad,
  bytesToBase58DigitsNoPad,
} from '../../src/protocol/base58-digits';

describe('base58 digits without padding', () => {
  it('round-trips arbitrary byte lengths', () => {
    for (let length = 0; length <= 13; length += 1) {
      const bytes = Uint8Array.from({ length }, (_, index) => (index * 37) % 256);
      const digits = bytesToBase58DigitsNoPad(bytes);
      const restored = base58DigitsToBytesNoPad(digits);

      expect(restored).toEqual(bytes);
    }
  });

  it('preserves leading zero bytes', () => {
    const bytes = Uint8Array.from([0, 0, 1, 0, 2, 255]);
    const digits = bytesToBase58DigitsNoPad(bytes);

    expect(base58DigitsToBytesNoPad(digits)).toEqual(bytes);
  });

  it('rejects invalid digits during decode', () => {
    expect(() => base58DigitsToBytesNoPad([58])).toThrowError(/digit/i);
    expect(() => base58DigitsToBytesNoPad([-1])).toThrowError(/digit/i);
    expect(() => base58DigitsToBytesNoPad([1.5])).toThrowError(/digit/i);
  });
});
