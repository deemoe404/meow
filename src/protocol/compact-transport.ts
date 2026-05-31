import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from './base-n-digits';
import { ProtocolError } from './errors';

export const COMPACT_SYLLABLE_ALPHABET = [
  '喵', '咪', '呜', '嗷', '呼', '噜', '咕', '瞄',
  '喔', '唔', '哈', '嗯', '呣', '咿', '咻', '嗚',
] as const;

const COMPACT_SHORT_TOKEN_COUNT = 2048;
const COMPACT_CHINESE_TOKEN_COUNT = 3840;
const COMPACT_ENGLISH_TOKEN_COUNT = 256;

const COMPACT_SHORT_HEAD_ALPHABET = [
  '喵', '咪', '呜', '嗷', '呼', '噜', '咕', '瞄',
  '喔', '唔', '哈', '嗯', '苗', '眯', '描', '猫',
  '貓', '乌', '屋', '凹', '熬', '嚎', '奥', '敖',
  '呦', '哟', '呀', '哇', '嘟', '哼', '哩', '咧',
] as const;

const COMPACT_TOKEN_TAIL_ALPHABET = [
  ...COMPACT_SYLLABLE_ALPHABET,
  '苗', '眯', '描', '猫', '貓', '乌', '屋', '凹',
  '熬', '嚎', '奥', '敖', '呦', '哟', '呀', '哇',
  '嘟', '哼', '哩', '咧', '啾', '啵', '唷', '嚕',
  '嘤', '咩', '咔', '哒', '嘶', '啊', '哦', '噢',
  '啦', '呢', '嘛', '吖', '咦', '嗨', '嘿', '咚',
  '叮', '叭', '啰', '嗬', '喏', '啧', '唧', '叽',
] as const;

const COMPACT_LONG_HEAD_ALPHABET = ['呣', '咿', '咻', '嗚'] as const;
const COMPACT_LONG_TAIL_ALPHABET = COMPACT_TOKEN_TAIL_ALPHABET.slice(0, 28);

const ENGLISH_CAT_ONSETS = [
  'm', 'n', 'p', 'r', 'y', 'a',
] as const;

const ENGLISH_CAT_NUCLEI = ['a', 'e', 'i', 'o', 'u', 'y', 'r', 'w'] as const;
const ENGLISH_CAT_CODAS = ['w', 'o', 'u', 'a', 'r', 'm'] as const;

const PRIORITY_ENGLISH_CAT_CALLS = [
  'meo', 'mow', 'mia', 'aoo', 'aou', 'mew', 'nya', 'nyo',
  'nyu', 'mrr', 'prr', 'pur', 'mao', 'mau', 'mio', 'miu',
] as const;

export const COMPACT_BASE = COMPACT_CHINESE_TOKEN_COUNT + COMPACT_ENGLISH_TOKEN_COUNT;

function buildShortChineseCatTokens(): string[] {
  const tokens: string[] = [];

  for (const first of COMPACT_SHORT_HEAD_ALPHABET) {
    for (const second of COMPACT_TOKEN_TAIL_ALPHABET) {
      tokens.push(`${first}${second}`);
    }
  }

  return tokens;
}

function buildLongChineseCatTokens(): string[] {
  const tokens: string[] = [];

  for (const first of COMPACT_LONG_HEAD_ALPHABET) {
    for (const second of COMPACT_SYLLABLE_ALPHABET) {
      for (const third of COMPACT_LONG_TAIL_ALPHABET) {
        tokens.push(`${first}${second}${third}`);
      }
    }
  }

  return tokens;
}

function buildEnglishCatCalls(): string[] {
  const generated: string[] = [];

  for (const onset of ENGLISH_CAT_ONSETS) {
    for (const nucleus of ENGLISH_CAT_NUCLEI) {
      for (const coda of ENGLISH_CAT_CODAS) {
        generated.push(`${onset}${nucleus}${coda}`);
      }
    }
  }

  const priority = new Set<string>(PRIORITY_ENGLISH_CAT_CALLS);
  const tokens = [
    ...PRIORITY_ENGLISH_CAT_CALLS,
    ...generated.filter((token) => !priority.has(token)),
  ];

  return tokens.slice(0, COMPACT_ENGLISH_TOKEN_COUNT);
}

function buildCompactTokenTable(): readonly string[] {
  const tokens = [
    ...buildShortChineseCatTokens(),
    ...buildLongChineseCatTokens(),
    ...buildEnglishCatCalls(),
  ];
  const uniqueTokenCount = new Set(tokens).size;
  const shortTokens = tokens.filter((token) => token.length === 2);
  const longTokens = tokens.filter((token) => token.length === 3);

  if (
    tokens.length !== COMPACT_BASE
    || uniqueTokenCount !== COMPACT_BASE
    || shortTokens.length !== COMPACT_SHORT_TOKEN_COUNT
    || longTokens.length !== COMPACT_BASE - COMPACT_SHORT_TOKEN_COUNT
    || longTokens.some((longToken) => shortTokens.some((shortToken) => longToken.startsWith(shortToken)))
  ) {
    throw new Error('compact 猫语词表构建失败。');
  }

  return tokens;
}

export const COMPACT_TOKEN_TABLE = buildCompactTokenTable();

export const COMPACT_ENGLISH_CAT_CALLS = COMPACT_TOKEN_TABLE.slice(
  COMPACT_CHINESE_TOKEN_COUNT,
);

const COMPACT_TOKEN_TO_DIGIT = new Map<string, number>(
  COMPACT_TOKEN_TABLE.map((token, index) => [token, index]),
);

export function getCompactVocabularySize(): number {
  return COMPACT_BASE;
}

export function getCompactSyllableCount(): number {
  return COMPACT_SYLLABLE_ALPHABET.length;
}

export function getCompactShortTokenCount(): number {
  return COMPACT_SHORT_TOKEN_COUNT;
}

export function getCompactChineseTokenCount(): number {
  return COMPACT_CHINESE_TOKEN_COUNT;
}

export function getCompactLongChineseTokenCount(): number {
  return COMPACT_CHINESE_TOKEN_COUNT - COMPACT_SHORT_TOKEN_COUNT;
}

export function getCompactEnglishTokenCount(): number {
  return COMPACT_ENGLISH_TOKEN_COUNT;
}

export function getCompactAverageTokenWidth(): number {
  const totalWidth = COMPACT_TOKEN_TABLE.reduce((sum, token) => sum + token.length, 0);
  return totalWidth / COMPACT_TOKEN_TABLE.length;
}

export function getCompactCatDigitCount(cat: string): number {
  return parseCompactCatToDigits(cat).length;
}

export function compactDigitToSymbol(digit: number): string {
  if (!Number.isInteger(digit) || digit < 0 || digit >= COMPACT_BASE) {
    throw new ProtocolError(`compact digit 超出 0..${COMPACT_BASE - 1} 范围。`, 'invalid-input');
  }

  return COMPACT_TOKEN_TABLE[digit];
}

export function encodeBytesToCompactCat(bytes: Uint8Array): string {
  const digits = bytesToBaseNDigitsNoPad(bytes, COMPACT_BASE);
  return digits.map(compactDigitToSymbol).join('');
}

function parseCompactCatToDigits(cat: string): number[] {
  const digits: number[] = [];

  for (let index = 0; index < cat.length;) {
    const twoCharToken = cat.slice(index, index + 2);
    const twoCharDigit = COMPACT_TOKEN_TO_DIGIT.get(twoCharToken);

    if (twoCharDigit !== undefined) {
      digits.push(twoCharDigit);
      index += twoCharToken.length;
      continue;
    }

    const token = cat.slice(index, index + 3);
    const digit = COMPACT_TOKEN_TO_DIGIT.get(token);

    if (digit === undefined) {
      throw new ProtocolError(`未知 compact 猫语 token: ${cat.slice(index, index + 3)}`, 'invalid-input');
    }

    digits.push(digit);
    index += token.length;
  }

  return digits;
}

export function decodeCompactCatToBytes(cat: string): Uint8Array {
  const digits = parseCompactCatToDigits(cat);
  return baseNDigitsToBytesNoPad(digits, COMPACT_BASE);
}
