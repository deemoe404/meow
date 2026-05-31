import { describe, expect, it } from 'vitest';

import {
  COMPACT_BASE,
  COMPACT_OFFSET,
  compactDigitToSymbol,
  decodeCompactCatToBytes,
  encodeBytesToCompactCat,
  getCompactCatDigitCount,
  getCompactVocabularySize,
} from '../../src/protocol/compact-transport';

describe('compact cat transport', () => {
  it('round-trips arbitrary byte arrays', () => {
    for (let length = 0; length <= 48; length += 1) {
      const bytes = Uint8Array.from({ length }, (_, index) => (index * 73 + 19) & 0xff);
      const cat = encodeBytesToCompactCat(bytes);

      expect(decodeCompactCatToBytes(cat)).toEqual(bytes);
    }
  });

  it('uses a 14-bit BMP alphabet without a compact magic prefix', () => {
    const cat = encodeBytesToCompactCat(Uint8Array.from([1, 2, 3, 4, 5]));

    expect(getCompactVocabularySize()).toBe(16_384);
    expect(getCompactCatDigitCount(cat)).toBe(cat.length);
    expect(compactDigitToSymbol(0).charCodeAt(0)).toBe(COMPACT_OFFSET);
    expect(compactDigitToSymbol(COMPACT_BASE - 1).charCodeAt(0)).toBe(COMPACT_OFFSET + COMPACT_BASE - 1);

    for (let index = 0; index < cat.length; index += 1) {
      const code = cat.charCodeAt(index);

      expect(code).toBeGreaterThanOrEqual(COMPACT_OFFSET);
      expect(code).toBeLessThan(COMPACT_OFFSET + COMPACT_BASE);
    }
  });

  it('rejects non-compact and out-of-alphabet input', () => {
    expect(() => decodeCompactCatToBytes('！！')).toThrowError(/compact/i);
    expect(() => decodeCompactCatToBytes('abc')).toThrowError(/compact/i);
    expect(() => compactDigitToSymbol(COMPACT_BASE)).toThrowError(/digit/i);
  });
});
