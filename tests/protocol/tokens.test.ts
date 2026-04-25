import { describe, expect, it } from 'vitest';

import {
  decodeCatToDigits,
  encodeDigitsToCat,
  TOKEN_TABLE,
} from '../../src/protocol/tokens';

const EXPECTED_ENGLISH_TRIPLES = [
  'mew', 'MEW', 'Mew',
  'meo', 'MEO', 'Meo',
  'mia', 'MIA', 'Mia',
  'mio', 'MIO', 'Mio',
  'miu', 'MIU', 'Miu',
  'mao', 'MAO', 'Mao',
  'mau', 'MAU', 'Mau',
  'mow', 'MOW', 'Mow',
  'nya', 'NYA', 'Nya',
  'nyo', 'NYO', 'Nyo',
  'nyu', 'NYU', 'Nyu',
  'mya', 'MYA', 'Mya',
  'myo', 'MYO', 'Myo',
  'myu', 'MYU', 'Myu',
  'mrr', 'MRR', 'Mrr',
  'prr', 'PRR', 'Prr',
  'pur', 'PUR', 'Pur',
  'mur', 'MUR', 'Mur',
  'eow', 'EOW', 'Eow',
  'iao', 'IAO', 'Iao',
  'iau', 'IAU', 'Iau',
  'yow', 'YOW', 'Yow',
  'urr', 'URR', 'Urr',
  'rrr', 'RRR', 'Rrr',
] as const;

const EXPECTED_FACE_TOKENS = [
  '(^_^)',
  '(^o^)',
  '(^w^)',
  '(^ω^)',
  '(^x^)',
  '(^ェ^)',
  '(^ﻌ^)',
  '(•ω•)',
  '(•ᆺ•)',
] as const;

describe('nya152 token table', () => {
  it('encodes and decodes deterministically across the full table', () => {
    const digits = Array.from({ length: TOKEN_TABLE.length }, (_, index) => index);
    const cat = encodeDigitsToCat(digits);
    const restored = decodeCatToDigits(cat);

    expect(restored).toEqual(digits);
  });

  it('keeps token prefixes unambiguous for no-separator decoding', () => {
    expect(TOKEN_TABLE).toHaveLength(152);

    for (const [leftIndex, left] of TOKEN_TABLE.entries()) {
      for (const [rightIndex, right] of TOKEN_TABLE.entries()) {
        if (leftIndex === rightIndex) {
          continue;
        }

        expect(left.startsWith(right)).toBe(false);
        expect(right.startsWith(left)).toBe(false);
      }
    }
  });

  it('round-trips mixed punctuation, CJK, and ASCII tokens', () => {
    const digits = [0, 1, 2, 9, 10, 11, 12, 58, 80, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 151];
    const cat = encodeDigitsToCat(digits);

    expect(cat).toBe('！～喵喵咕噜mewMEWMewpurRRR…,，!~、？?...。。。 (^_^)(^o^)(•ᆺ•)');
    expect(decodeCatToDigits(cat)).toEqual(digits);
  });

  it('exposes the expected 152-token values and ordering', () => {
    expect(TOKEN_TABLE).toHaveLength(152);
    expect(TOKEN_TABLE.slice(0, 10)).toEqual([
      '！', '～', '喵喵', '咪喵', '喵呜', '咪呜', '喵嗷', '咪嗷', '呼噜', '咕噜',
    ]);
    expect(TOKEN_TABLE.slice(10, 82)).toEqual(EXPECTED_ENGLISH_TRIPLES);
    expect(TOKEN_TABLE.slice(82, 143)).toEqual([
      '哈', '—', '瞄瞄', '喵咪', '喵喔', '喵唔', '喵呼', '眯喵', '迷喵', '咪描',
      '咪瞄', '喵乌', '喵屋', '喵嗚', '咪乌', '咪屋', '咪唔', '咪嗚', '咪呼', '苗嗷',
      '瞄嗷', '喵凹', '喵熬', '喵嚎', '喵奥', '喵敖', '眯嗷', '迷嗷', '咪凹', '咪熬',
      '咪嚎', '咪奥', '咪敖', '乎噜', '忽噜', '惚噜', '估噜', '姑噜', '菇噜', '箍噜',
      '嗷呜', '嗷乌', '嗷屋', '熬呜', '敖呜', '遨呜', '嗷唔', '嗷喔', '嗷喵', '咪咪喵',
      '…', ',', '，', '!', '~', '、', '？', '?', '...', '。。。', ' ',
    ]);
    expect(TOKEN_TABLE.slice(143)).toEqual(EXPECTED_FACE_TOKENS);
    expect(TOKEN_TABLE[151]).toBe('(•ᆺ•)');
    expect(TOKEN_TABLE).not.toContain('(=^.^=)');
    expect(TOKEN_TABLE).not.toContain('（=^.^=）');
  });

  it('rejects unknown prefixes', () => {
    expect(() => decodeCatToDigits('mewzzz')).toThrowError(/token/i);
  });
});
