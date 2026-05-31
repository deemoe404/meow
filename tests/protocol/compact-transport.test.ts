import { describe, expect, it } from 'vitest';

import {
  COMPACT_BASE,
  COMPACT_SYLLABLE_ALPHABET,
  compactDigitToSymbol,
  decodeCompactCatToBytes,
  encodeBytesToCompactCat,
  getCompactCatDigitCount,
  getCompactSyllableCount,
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

  it('uses cat-syllable pairs without a compact magic prefix', () => {
    const cat = encodeBytesToCompactCat(Uint8Array.from([1, 2, 3, 4, 5]));
    const syllables = new Set(COMPACT_SYLLABLE_ALPHABET);

    expect(getCompactSyllableCount()).toBe(32);
    expect(getCompactVocabularySize()).toBe(1_024);
    expect(getCompactCatDigitCount(cat)).toBe(cat.length / 2);
    expect(compactDigitToSymbol(0)).toBe('喵喵');
    expect(compactDigitToSymbol(COMPACT_BASE - 1)).toBe('团团');
    expect(cat.length % 2).toBe(0);

    for (let index = 0; index < cat.length; index += 1) {
      expect(syllables.has(cat[index] as typeof COMPACT_SYLLABLE_ALPHABET[number])).toBe(true);
    }
  });

  it('rejects non-compact and out-of-alphabet input', () => {
    expect(() => decodeCompactCatToBytes('！！')).toThrowError(/compact/i);
    expect(() => decodeCompactCatToBytes('abc')).toThrowError(/compact/i);
    expect(() => decodeCompactCatToBytes('喵')).toThrowError(/偶数/i);
    expect(() => compactDigitToSymbol(COMPACT_BASE)).toThrowError(/digit/i);
  });
});
