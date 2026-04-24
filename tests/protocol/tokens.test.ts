import { describe, expect, it } from 'vitest';

import {
  decodeCatToDigits,
  encodeDigitsToCat,
  TOKEN_TABLE,
} from '../../src/protocol/tokens';

const EXPECTED_FACE_TOKENS = [
  '(=^.^=)',
  '（=^.^=）',
  '(=^^=)',
  '（=^^=）',
  '(=^..^=)',
  '（=^..^=）',
  '(=^･^=)',
  '（=^･^=）',
  '(=^o^=)',
  '（=^o^=）',
  '(=^w^=)',
  '（=^w^=）',
  '(=^ω^=)',
  '（=^ω^=）',
  '(=^x^=)',
  '（=^x^=）',
  '(=^ェ^=)',
  '（=^ェ^=）',
  '(=^ᆺ^=)',
  '（=^ᆺ^=）',
  '(=^人^=)',
  '（=^人^=）',
  '(=^ᴥ^=)',
  '（=^ᴥ^=）',
  '(=^ﻌ^=)',
  '（=^ﻌ^=）',
  '(=•ω•=)',
  '（=•ω•=）',
  '(=•ᆺ•=)',
  '（=•ᆺ•=）',
  '(=•ﻌ•=)',
  '（=•ﻌ•=）',
  '(=•ㅅ•=)',
  '（=•ㅅ•=）',
  '(=•ᴥ•=)',
  '（=•ᴥ•=）',
  '(=•ェ•=)',
  '（=•ェ•=）',
  '(=ΦωΦ=)',
  '（=ΦωΦ=）',
  '(=ΦﻌΦ=)',
  '（=ΦﻌΦ=）',
  '(=ΦᴥΦ=)',
  '（=ΦᴥΦ=）',
  '(=ΦェΦ=)',
  '（=ΦェΦ=）',
  '(=ΦᆺΦ=)',
  '（=ΦᆺΦ=）',
  '(ฅ^•ﻌ•^ฅ)',
  '（ฅ^•ﻌ•^ฅ）',
  '(ฅ^•ω•^ฅ)',
  '（ฅ^•ω•^ฅ）',
  '(ฅ^•ㅅ•^ฅ)',
  '（ฅ^•ㅅ•^ฅ）',
  '(ฅ^•ᆺ•^ฅ)',
  '（ฅ^•ᆺ•^ฅ）',
  '(ฅ^•ᴥ•^ฅ)',
  '（ฅ^•ᴥ•^ฅ）',
  '(ฅ^•ェ^ฅ)',
  '（ฅ^•ェ^ฅ）',
  '(ฅ^..^ฅ)',
  '（ฅ^..^ฅ）',
  '(ฅ^^ฅ)',
  '（ฅ^^ฅ）',
  '(ฅ^o^ฅ)',
  '（ฅ^o^ฅ）',
  '(ฅ^w^ฅ)',
  '（ฅ^w^ฅ）',
  '(ฅ^ω^ฅ)',
  '（ฅ^ω^ฅ）',
  '(ฅ^x^ฅ)',
  '（ฅ^x^ฅ）',
  '(ฅ^ェ^ฅ)',
  '（ฅ^ェ^ฅ）',
  '(ฅ^ﻌ^ฅ)',
  '（ฅ^ﻌ^ฅ）',
  '(ฅ•ω•ฅ)',
  '（ฅ•ω•ฅ）',
  '(ฅ•ᆺ•ฅ)',
  '（ฅ•ᆺ•ฅ）',
  '(ฅ•ﻌ•ฅ)',
  '（ฅ•ﻌ•ฅ）',
  '(ฅ•ㅅ•ฅ)',
  '（ฅ•ㅅ•ฅ）',
  '(ฅ•ᴥ•ฅ)',
  '（ฅ•ᴥ•ฅ）',
  '(ฅ•ェ•ฅ)',
  '（ฅ•ェ•ฅ）',
  '(ฅΦωΦฅ)',
  '（ฅΦωΦฅ）',
  '(ฅΦﻌΦฅ)',
  '（ฅΦﻌΦฅ）',
  '(ฅΦᴥΦฅ)',
  '（ฅΦᴥΦฅ）',
  '(ฅΦェΦฅ)',
  '（ฅΦェΦฅ）',
  '(^•ﻌ•^)',
  '（^•ﻌ•^）',
  '(^•ω•^)',
  '（^•ω•^）',
  '(^•ㅅ•^)',
  '（^•ㅅ•^）',
  '(^•ᆺ•^)',
  '（^•ᆺ•^）',
  '(^•ᴥ•^)',
  '（^•ᴥ•^）',
  '(^•ェ^)',
  '（^•ェ^）',
  '(^..^)',
  '（^..^）',
  '(^_^)',
  '（^_^）',
  '(^o^)',
  '（^o^）',
  '(^w^)',
  '（^w^）',
  '(^ω^)',
  '（^ω^）',
  '(^x^)',
  '（^x^）',
  '(^ェ^)',
  '（^ェ^）',
  '(^ﻌ^)',
  '（^ﻌ^）',
  '(•ω•)',
  '（•ω•）',
  '(•ᆺ•)',
  '（•ᆺ•）',
  '(•ﻌ•)',
  '（•ﻌ•）',
  '(•ㅅ•)',
  '（•ㅅ•）',
  '(•ᴥ•)',
  '（•ᴥ•）',
  '(•ェ•)',
  '（•ェ•）',
  '(ΦωΦ)',
] as const;

describe('nya256 token table', () => {
  it('encodes and decodes deterministically across the full table', () => {
    const digits = Array.from({ length: TOKEN_TABLE.length }, (_, index) => index);
    const cat = encodeDigitsToCat(digits);
    const restored = decodeCatToDigits(cat);

    expect(restored).toEqual(digits);
  });

  it('keeps token prefixes unambiguous for no-separator decoding', () => {
    expect(TOKEN_TABLE).toHaveLength(256);

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
    const digits = [0, 1, 2, 9, 10, 11, 42, 57, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 255];
    const cat = encodeDigitsToCat(digits);

    expect(cat).toBe('！～喵喵咕噜mewMEWpurRRR…,，!~、？?...。。。 (=^.^=)（=^.^=）(ΦωΦ)');
    expect(decodeCatToDigits(cat)).toEqual(digits);
  });

  it('exposes the expected 256-token values and ordering', () => {
    expect(TOKEN_TABLE).toHaveLength(256);
    expect(TOKEN_TABLE.slice(0, 119)).toEqual([
      '！', '～', '喵喵', '咪喵', '喵呜', '咪呜', '喵嗷', '咪嗷', '呼噜', '咕噜',
      'mew', 'MEW', 'meo', 'MEO', 'mia', 'MIA', 'mio', 'MIO', 'miu', 'MIU',
      'mao', 'MAO', 'mau', 'MAU', 'mow', 'MOW', 'nya', 'NYA', 'nyo', 'NYO',
      'nyu', 'NYU', 'mya', 'MYA', 'myo', 'MYO', 'myu', 'MYU', 'mrr', 'MRR',
      'prr', 'PRR', 'pur', 'PUR', 'mur', 'MUR', 'eow', 'EOW', 'iao', 'IAO',
      'iau', 'IAU', 'yow', 'YOW', 'urr', 'URR', 'rrr', 'RRR',
      '哈', '—', '瞄瞄', '喵咪', '喵喔', '喵唔', '喵呼', '眯喵', '迷喵', '咪描',
      '咪瞄', '喵乌', '喵屋', '喵嗚', '咪乌', '咪屋', '咪唔', '咪嗚', '咪呼', '苗嗷',
      '瞄嗷', '喵凹', '喵熬', '喵嚎', '喵奥', '喵敖', '眯嗷', '迷嗷', '咪凹', '咪熬',
      '咪嚎', '咪奥', '咪敖', '乎噜', '忽噜', '惚噜', '估噜', '姑噜', '菇噜', '箍噜',
      '嗷呜', '嗷乌', '嗷屋', '熬呜', '敖呜', '遨呜', '嗷唔', '嗷喔', '嗷喵', '咪咪喵',
      '…', ',', '，', '!', '~', '、', '？', '?', '...', '。。。', ' ',
    ]);
    expect(TOKEN_TABLE.slice(119)).toEqual(EXPECTED_FACE_TOKENS);
    expect(TOKEN_TABLE[255]).toBe('(ΦωΦ)');
    expect(TOKEN_TABLE).not.toContain('（ΦωΦ）');
  });

  it('rejects unknown prefixes', () => {
    expect(() => decodeCatToDigits('mewzzz')).toThrowError(/token/i);
  });
});
