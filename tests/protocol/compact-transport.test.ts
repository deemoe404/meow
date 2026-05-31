import { describe, expect, it } from 'vitest';

import {
  COMPACT_BASE,
  COMPACT_ENGLISH_CAT_CALLS,
  COMPACT_SYLLABLE_ALPHABET,
  COMPACT_TOKEN_TABLE,
  compactDigitToSymbol,
  decodeCompactCatToBytes,
  encodeBytesToCompactCat,
  getCompactCatDigitCount,
  getCompactChineseTokenCount,
  getCompactEnglishTokenCount,
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

  it('uses a mixed 4096-token cat vocabulary without a compact magic prefix', () => {
    const cat = encodeBytesToCompactCat(Uint8Array.from([1, 2, 3, 4, 5]));
    const tokenSet = new Set(COMPACT_TOKEN_TABLE);

    expect(getCompactSyllableCount()).toBe(16);
    expect(getCompactVocabularySize()).toBe(4_096);
    expect(getCompactChineseTokenCount()).toBe(3_840);
    expect(getCompactEnglishTokenCount()).toBe(256);
    expect(getCompactCatDigitCount(cat)).toBe(cat.length / 3);
    expect(compactDigitToSymbol(0)).toBe('喵喵喵');
    expect(compactDigitToSymbol(getCompactChineseTokenCount())).toBe('meo');
    expect(COMPACT_TOKEN_TABLE).toHaveLength(COMPACT_BASE);
    expect(tokenSet.size).toBe(COMPACT_BASE);
    expect(COMPACT_TOKEN_TABLE.every((token) => token.length === 3)).toBe(true);
    expect(COMPACT_ENGLISH_CAT_CALLS).toEqual(expect.arrayContaining([
      'meo', 'mow', 'mia', 'aoo', 'aou', 'nya', 'mrr', 'prr', 'pur',
    ]));
    expect(cat.length % 3).toBe(0);
    expect(cat.startsWith('喵:')).toBe(false);

    for (let index = 0; index < getCompactChineseTokenCount(); index += 1) {
      const token = compactDigitToSymbol(index);

      expect(COMPACT_SYLLABLE_ALPHABET).toContain(token[0] as typeof COMPACT_SYLLABLE_ALPHABET[number]);
      expect(COMPACT_SYLLABLE_ALPHABET).toContain(token[1] as typeof COMPACT_SYLLABLE_ALPHABET[number]);
      expect(COMPACT_SYLLABLE_ALPHABET).toContain(token[2] as typeof COMPACT_SYLLABLE_ALPHABET[number]);
    }
  });

  it('rejects non-compact and out-of-alphabet input', () => {
    expect(() => decodeCompactCatToBytes('！！')).toThrowError(/compact/i);
    expect(() => decodeCompactCatToBytes('abc')).toThrowError(/token/i);
    expect(() => decodeCompactCatToBytes('喵')).toThrowError(/3 的倍数/i);
    expect(() => decodeCompactCatToBytes('猫猫猫')).toThrowError(/token/i);
    expect(() => compactDigitToSymbol(COMPACT_BASE)).toThrowError(/digit/i);
  });
});
