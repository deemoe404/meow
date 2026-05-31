import {
  baseNDigitsToBytesNoPad,
  bytesToBaseNDigitsNoPad,
} from './base-n-digits';
import { ProtocolError } from './errors';

export const COMPACT_BASE = 0x4000;
export const COMPACT_OFFSET = 0x4e00;

const COMPACT_LIMIT = COMPACT_OFFSET + COMPACT_BASE;

export function getCompactVocabularySize(): number {
  return COMPACT_BASE;
}

export function getCompactCatDigitCount(cat: string): number {
  return cat.length;
}

export function compactDigitToSymbol(digit: number): string {
  if (!Number.isInteger(digit) || digit < 0 || digit >= COMPACT_BASE) {
    throw new ProtocolError(`compact digit 超出 0..${COMPACT_BASE - 1} 范围。`, 'invalid-input');
  }

  return String.fromCharCode(COMPACT_OFFSET + digit);
}

function compactSymbolToDigit(symbol: string): number {
  const code = symbol.charCodeAt(0);

  if (code < COMPACT_OFFSET || code >= COMPACT_LIMIT) {
    throw new ProtocolError(`未知 compact 短码字符: ${symbol}`, 'invalid-input');
  }

  return code - COMPACT_OFFSET;
}

export function encodeBytesToCompactCat(bytes: Uint8Array): string {
  const digits = bytesToBaseNDigitsNoPad(bytes, COMPACT_BASE);
  return digits.map(compactDigitToSymbol).join('');
}

export function decodeCompactCatToBytes(cat: string): Uint8Array {
  const digits: number[] = [];

  for (let index = 0; index < cat.length; index += 1) {
    digits.push(compactSymbolToDigit(cat[index]));
  }

  return baseNDigitsToBytesNoPad(digits, COMPACT_BASE);
}
