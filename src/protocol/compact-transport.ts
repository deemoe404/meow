import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from './base-n-digits';
import { ProtocolError } from './errors';

export const COMPACT_SYLLABLE_ALPHABET = [
  '喵', '咪', '呜', '嗷', '呼', '噜', '咕', '瞄',
  '喔', '唔', '哈', '嗯', '呣', '咿', '咻', '嗚',
  '猫', '貓', '苗', '眯', '爪', '尾', '毛', '鱼',
  '罐', '奶', '睡', '扑', '蹭', '舔', '窝', '团',
] as const;

const COMPACT_SYLLABLE_RADIX = COMPACT_SYLLABLE_ALPHABET.length;

export const COMPACT_BASE = COMPACT_SYLLABLE_RADIX * COMPACT_SYLLABLE_RADIX;

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
  if (cat.length % 2 !== 0) {
    throw new ProtocolError('compact 猫语短码长度必须是偶数。', 'invalid-input');
  }

  return cat.length / 2;
}

export function compactDigitToSymbol(digit: number): string {
  if (!Number.isInteger(digit) || digit < 0 || digit >= COMPACT_BASE) {
    throw new ProtocolError(`compact digit 超出 0..${COMPACT_BASE - 1} 范围。`, 'invalid-input');
  }

  const high = Math.floor(digit / COMPACT_SYLLABLE_RADIX);
  const low = digit % COMPACT_SYLLABLE_RADIX;

  return `${COMPACT_SYLLABLE_ALPHABET[high]}${COMPACT_SYLLABLE_ALPHABET[low]}`;
}

function compactSymbolToDigit(left: string, right: string): number {
  const high = COMPACT_SYLLABLE_TO_INDEX.get(left);
  const low = COMPACT_SYLLABLE_TO_INDEX.get(right);

  if (high === undefined || low === undefined) {
    throw new ProtocolError(`未知 compact 猫语音节: ${left}${right}`, 'invalid-input');
  }

  return high * COMPACT_SYLLABLE_RADIX + low;
}

export function encodeBytesToCompactCat(bytes: Uint8Array): string {
  const digits = bytesToBaseNDigitsNoPad(bytes, COMPACT_BASE);
  return digits.map(compactDigitToSymbol).join('');
}

export function decodeCompactCatToBytes(cat: string): Uint8Array {
  if (cat.length % 2 !== 0) {
    throw new ProtocolError('compact 猫语短码长度必须是偶数。', 'invalid-input');
  }

  const digits: number[] = [];

  for (let index = 0; index < cat.length; index += 2) {
    digits.push(compactSymbolToDigit(cat[index], cat[index + 1]));
  }

  return baseNDigitsToBytesNoPad(digits, COMPACT_BASE);
}
