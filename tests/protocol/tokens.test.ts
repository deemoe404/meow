import { describe, expect, it } from 'vitest';

import {
  decodeCatToDigits,
  encodeDigitsToCat,
  TOKEN_TABLE,
} from '../../src/protocol/tokens';

describe('nya58 token table', () => {
  it('encodes and decodes deterministically across the full table', () => {
    const digits = Array.from({ length: 58 }, (_, index) => index);
    const cat = encodeDigitsToCat(digits);
    const restored = decodeCatToDigits(cat);

    expect(restored).toEqual(digits);
  });

  it('round-trips mixed punctuation, CJK, and ASCII tokens', () => {
    const digits = [0, 1, 2, 9, 10, 11, 42, 57];
    const cat = encodeDigitsToCat(digits);

    expect(cat).toBe('！～喵喵咕噜mewMEWpurRRR');
    expect(decodeCatToDigits(cat)).toEqual(digits);
  });

  it('exposes the expected 58-token values and ordering', () => {
    expect(TOKEN_TABLE).toEqual([
      '！', '～', '喵喵', '咪喵', '喵呜', '咪呜', '喵嗷', '咪嗷', '呼噜', '咕噜',
      'mew', 'MEW', 'meo', 'MEO', 'mia', 'MIA', 'mio', 'MIO', 'miu', 'MIU',
      'mao', 'MAO', 'mau', 'MAU', 'mow', 'MOW', 'nya', 'NYA', 'nyo', 'NYO',
      'nyu', 'NYU', 'mya', 'MYA', 'myo', 'MYO', 'myu', 'MYU', 'mrr', 'MRR',
      'prr', 'PRR', 'pur', 'PUR', 'mur', 'MUR', 'eow', 'EOW', 'iao', 'IAO',
      'iau', 'IAU', 'yow', 'YOW', 'urr', 'URR', 'rrr', 'RRR',
    ]);
  });

  it('rejects unknown prefixes', () => {
    expect(() => decodeCatToDigits('mewzzz')).toThrowError(/token/i);
  });
});
