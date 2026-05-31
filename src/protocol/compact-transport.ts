import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from './base-n-digits';
import { ProtocolError } from './errors';

export const COMPACT_SYLLABLE_ALPHABET = [
  '喵', '咪', '呜', '嗷', '呼', '噜', '咕', '瞄',
  '喔', '唔', '哈', '嗯', '呣', '咿', '咻', '嗚',
] as const;

const COMPACT_SYLLABLE_RADIX = COMPACT_SYLLABLE_ALPHABET.length;
const COMPACT_HEAD_RADIX = 4;
const COMPACT_TOKEN_WIDTH = 3;

export const COMPACT_BASE = COMPACT_HEAD_RADIX * COMPACT_SYLLABLE_RADIX * COMPACT_SYLLABLE_RADIX;

const COMPACT_SYLLABLE_TO_INDEX = new Map<string, number>(
  COMPACT_SYLLABLE_ALPHABET.map((syllable, index) => [syllable, index]),
);

export function getCompactVocabularySize(): number {
  return COMPACT_BASE;
}

export function getCompactSyllableCount(): number {
  return COMPACT_SYLLABLE_RADIX;
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

  const high = Math.floor(digit / (COMPACT_SYLLABLE_RADIX * COMPACT_SYLLABLE_RADIX));
  const middle = Math.floor(digit / COMPACT_SYLLABLE_RADIX) % COMPACT_SYLLABLE_RADIX;
  const low = digit % COMPACT_SYLLABLE_RADIX;

  return `${COMPACT_SYLLABLE_ALPHABET[high]}${COMPACT_SYLLABLE_ALPHABET[middle]}${COMPACT_SYLLABLE_ALPHABET[low]}`;
}

function compactSymbolToDigit(first: string, second: string, third: string): number {
  const high = COMPACT_SYLLABLE_TO_INDEX.get(first);
  const middle = COMPACT_SYLLABLE_TO_INDEX.get(second);
  const low = COMPACT_SYLLABLE_TO_INDEX.get(third);

  if (
    high === undefined
    || middle === undefined
    || low === undefined
    || high >= COMPACT_HEAD_RADIX
  ) {
    throw new ProtocolError(`未知 compact 猫语三连音: ${first}${second}${third}`, 'invalid-input');
  }

  return (
    high * COMPACT_SYLLABLE_RADIX * COMPACT_SYLLABLE_RADIX
    + middle * COMPACT_SYLLABLE_RADIX
    + low
  );
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
    digits.push(compactSymbolToDigit(cat[index], cat[index + 1], cat[index + 2]));
  }

  return baseNDigitsToBytesNoPad(digits, COMPACT_BASE);
}
