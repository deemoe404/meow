import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from './base-n-digits';
import { ProtocolError } from './errors';

export const COMPACT_SYLLABLE_ALPHABET = [
  '喵', '咪', '呜', '嗷', '呼', '噜', '咕', '瞄',
  '喔', '唔', '哈', '嗯', '呣', '咿', '咻', '嗚',
] as const;

const COMPACT_TOKEN_WIDTH = 3;
const COMPACT_CHINESE_TOKEN_COUNT = 3840;
const COMPACT_ENGLISH_TOKEN_COUNT = 256;

const COMPACT_CHINESE_TAIL_ALPHABET = COMPACT_SYLLABLE_ALPHABET.slice(0, 15);

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

function buildChineseCatTokens(): string[] {
  const tokens: string[] = [];

  for (const first of COMPACT_SYLLABLE_ALPHABET) {
    for (const second of COMPACT_SYLLABLE_ALPHABET) {
      for (const third of COMPACT_CHINESE_TAIL_ALPHABET) {
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
    ...buildChineseCatTokens(),
    ...buildEnglishCatCalls(),
  ];
  const uniqueTokenCount = new Set(tokens).size;

  if (
    tokens.length !== COMPACT_BASE
    || uniqueTokenCount !== COMPACT_BASE
    || tokens.some((token) => token.length !== COMPACT_TOKEN_WIDTH)
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

export function getCompactChineseTokenCount(): number {
  return COMPACT_CHINESE_TOKEN_COUNT;
}

export function getCompactEnglishTokenCount(): number {
  return COMPACT_ENGLISH_TOKEN_COUNT;
}

export function getCompactCatDigitCount(cat: string): number {
  if (cat.length % COMPACT_TOKEN_WIDTH !== 0) {
    throw new ProtocolError('compact 猫语短码长度必须是 3 的倍数。', 'invalid-input');
  }

  return cat.length / COMPACT_TOKEN_WIDTH;
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

export function decodeCompactCatToBytes(cat: string): Uint8Array {
  if (cat.length % COMPACT_TOKEN_WIDTH !== 0) {
    throw new ProtocolError('compact 猫语短码长度必须是 3 的倍数。', 'invalid-input');
  }

  const digits: number[] = [];

  for (let index = 0; index < cat.length; index += COMPACT_TOKEN_WIDTH) {
    const token = cat.slice(index, index + COMPACT_TOKEN_WIDTH);
    const digit = COMPACT_TOKEN_TO_DIGIT.get(token);

    if (digit === undefined) {
      throw new ProtocolError(`未知 compact 猫语 token: ${token}`, 'invalid-input');
    }

    digits.push(digit);
  }

  return baseNDigitsToBytesNoPad(digits, COMPACT_BASE);
}
