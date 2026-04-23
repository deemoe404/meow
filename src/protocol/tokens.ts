import { ProtocolError } from './errors';

export const TOKEN_TABLE = [
  '！', '～', '喵喵', '咪喵', '喵呜', '咪呜', '喵嗷', '咪嗷', '呼噜', '咕噜',
  'mew', 'MEW', 'meo', 'MEO', 'mia', 'MIA', 'mio', 'MIO', 'miu', 'MIU',
  'mao', 'MAO', 'mau', 'MAU', 'mow', 'MOW', 'nya', 'NYA', 'nyo', 'NYO',
  'nyu', 'NYU', 'mya', 'MYA', 'myo', 'MYO', 'myu', 'MYU', 'mrr', 'MRR',
  'prr', 'PRR', 'pur', 'PUR', 'mur', 'MUR', 'eow', 'EOW', 'iao', 'IAO',
  'iau', 'IAU', 'yow', 'YOW', 'urr', 'URR', 'rrr', 'RRR',
] as const;

const TOKENS_BY_LENGTH = [...TOKEN_TABLE]
  .map((token, index) => ({ token, index }))
  .sort((left, right) => right.token.length - left.token.length || left.index - right.index);

export function encodeDigitsToCat(digits: number[]): string {
  const chunks: string[] = [];

  for (const digit of digits) {
    const token = TOKEN_TABLE[digit];
    if (token === undefined) {
      throw new ProtocolError('digit 超出 token 表范围。', 'invalid-input');
    }
    chunks.push(token);
  }

  return chunks.join('');
}

export function decodeCatToDigits(cat: string): number[] {
  const digits: number[] = [];

  for (let index = 0; index < cat.length;) {
    const match = TOKENS_BY_LENGTH.find(({ token }) => cat.startsWith(token, index));

    if (!match) {
      throw new ProtocolError(`未知 token: ${cat.slice(index, index + 3)}`, 'invalid-input');
    }

    digits.push(match.index);
    index += match.token.length;
  }

  return digits;
}
