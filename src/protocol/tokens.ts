import { ProtocolError } from './errors';

export type TokenVocabularyId = 'default' | 'expanded';

export const TOKEN_TABLE = [
  '！', '～', '喵喵', '咪喵', '喵呜', '咪呜', '喵嗷', '咪嗷', '呼噜', '咕噜',
  'mew', 'MEW', 'Mew', 'meo', 'MEO', 'Meo', 'mia', 'MIA', 'Mia', 'mio',
  'MIO', 'Mio', 'miu', 'MIU', 'Miu', 'mao', 'MAO', 'Mao', 'mau', 'MAU',
  'Mau', 'mow', 'MOW', 'Mow', 'nya', 'NYA', 'Nya', 'nyo', 'NYO', 'Nyo',
  'nyu', 'NYU', 'Nyu', 'mya', 'MYA', 'Mya', 'myo', 'MYO', 'Myo', 'myu',
  'MYU', 'Myu', 'mrr', 'MRR', 'Mrr', 'prr', 'PRR', 'Prr', 'pur', 'PUR',
  'Pur', 'mur', 'MUR', 'Mur', 'eow', 'EOW', 'Eow', 'iao', 'IAO', 'Iao',
  'iau', 'IAU', 'Iau', 'yow', 'YOW', 'Yow', 'urr', 'URR', 'Urr', 'rrr',
  'RRR', 'Rrr', '哈', '—',
  '瞄瞄', '喵咪', '喵喔', '喵唔', '喵呼', '眯喵', '迷喵', '咪描', '咪瞄', '喵乌',
  '喵屋', '喵嗚', '咪乌', '咪屋', '咪唔', '咪嗚', '咪呼', '苗嗷', '瞄嗷', '喵凹',
  '喵熬', '喵嚎', '喵奥', '喵敖', '眯嗷', '迷嗷', '咪凹', '咪熬', '咪嚎', '咪奥',
  '咪敖', '乎噜', '忽噜', '惚噜', '估噜', '姑噜', '菇噜', '箍噜', '嗷呜', '嗷乌',
  '嗷屋', '熬呜', '敖呜', '遨呜', '嗷唔', '嗷喔', '嗷喵', '咪咪喵', '…', ',',
  '，', '!', '~', '、', '？', '?', '...', '。。。', ' ', '(^_^)',
  '(^o^)', '(^w^)', '(^ω^)', '(^x^)', '(^ェ^)', '(^ﻌ^)', '(•ω•)', '(•ᆺ•)',
  '\n', ';', '；',
] as const;

const ASCII_SUFFIX_TOKENS = [',', '!', '~', '?', ';'] as const;

function isExpandableToken(token: string): boolean {
  return /^[\p{Script=Han}]+$/u.test(token) || /^[A-Za-z]+$/.test(token);
}

function isRemovedAsciiSuffixToken(token: string): boolean {
  return ASCII_SUFFIX_TOKENS.includes(token as typeof ASCII_SUFFIX_TOKENS[number]);
}

function buildExpandedTokenTable(source: readonly string[]): readonly string[] {
  const expandableTokens = source.filter(isExpandableToken);
  const asciiSuffixedTokens = expandableTokens
    .flatMap((token) => ASCII_SUFFIX_TOKENS.map((suffix) => `${token}${suffix}`));
  const spaceSuffixedTokens = [
    ...expandableTokens.map((token) => `${token} `),
    ...asciiSuffixedTokens.map((token) => `${token} `),
  ];
  const retainedTokens = source.filter((token) => !isRemovedAsciiSuffixToken(token) && token !== ' ');

  return [...retainedTokens, ...asciiSuffixedTokens, ...spaceSuffixedTokens];
}

function buildTokensByLength(table: readonly string[]): { token: string; index: number }[] {
  return [...table]
    .map((token, index) => ({ token, index }))
    .sort((left, right) => right.token.length - left.token.length || left.index - right.index);
}

export const EXPANDED_TOKEN_TABLE = buildExpandedTokenTable(TOKEN_TABLE);

const TOKEN_TABLES: Record<TokenVocabularyId, readonly string[]> = {
  default: TOKEN_TABLE,
  expanded: EXPANDED_TOKEN_TABLE,
};

const TOKENS_BY_LENGTH: Record<TokenVocabularyId, { token: string; index: number }[]> = {
  default: buildTokensByLength(TOKEN_TABLE),
  expanded: buildTokensByLength(EXPANDED_TOKEN_TABLE),
};

export function getTokenTable(vocabulary: TokenVocabularyId = 'default'): readonly string[] {
  return TOKEN_TABLES[vocabulary];
}

export function getVocabularySize(vocabulary: TokenVocabularyId = 'default'): number {
  return getTokenTable(vocabulary).length;
}

export function encodeDigitsToCat(
  digits: number[],
  vocabulary: TokenVocabularyId = 'default',
): string {
  const table = getTokenTable(vocabulary);
  const chunks: string[] = [];

  for (const digit of digits) {
    const token = table[digit];
    if (token === undefined) {
      throw new ProtocolError('digit 超出 token 表范围。', 'invalid-input');
    }
    chunks.push(token);
  }

  return chunks.join('');
}

export function decodeCatToDigits(
  cat: string,
  vocabulary: TokenVocabularyId = 'default',
): number[] {
  const tokensByLength = TOKENS_BY_LENGTH[vocabulary];
  const digits: number[] = [];

  for (let index = 0; index < cat.length;) {
    const match = tokensByLength.find(({ token }) => cat.startsWith(token, index));

    if (!match) {
      throw new ProtocolError(`未知 token: ${cat.slice(index, index + 3)}`, 'invalid-input');
    }

    digits.push(match.index);
    index += match.token.length;
  }

  return digits;
}
