import { ProtocolError } from './errors';

const BASE = 58;

function ensureDigit(digit: number): void {
  if (!Number.isInteger(digit) || digit < 0 || digit >= BASE) {
    throw new ProtocolError('digit 超出 0..57 范围。', 'invalid-input');
  }
}

export function bytesToBase58DigitsNoPad(bytes: Uint8Array): number[] {
  if (bytes.length === 0) {
    return [];
  }

  let leadingZeroBytes = 0;
  while (leadingZeroBytes < bytes.length && bytes[leadingZeroBytes] === 0) {
    leadingZeroBytes += 1;
  }

  const digits: number[] = [];

  for (let index = leadingZeroBytes; index < bytes.length; index += 1) {
    let carry = bytes[index];

    for (let digitIndex = digits.length - 1; digitIndex >= 0; digitIndex -= 1) {
      const value = digits[digitIndex] * 256 + carry;
      digits[digitIndex] = value % BASE;
      carry = Math.floor(value / BASE);
    }

    while (carry > 0) {
      digits.unshift(carry % BASE);
      carry = Math.floor(carry / BASE);
    }
  }

  return Array.from({ length: leadingZeroBytes }, () => 0).concat(digits);
}

export function base58DigitsToBytesNoPad(digits: number[]): Uint8Array {
  if (digits.length === 0) {
    return Uint8Array.of();
  }

  let leadingZeroDigits = 0;
  while (leadingZeroDigits < digits.length && digits[leadingZeroDigits] === 0) {
    leadingZeroDigits += 1;
  }

  const bytes: number[] = [];

  for (let index = leadingZeroDigits; index < digits.length; index += 1) {
    const digit = digits[index];
    ensureDigit(digit);

    let carry = digit;

    for (let byteIndex = bytes.length - 1; byteIndex >= 0; byteIndex -= 1) {
      const value = bytes[byteIndex] * BASE + carry;
      bytes[byteIndex] = value & 0xff;
      carry = Math.floor(value / 256);
    }

    while (carry > 0) {
      bytes.unshift(carry & 0xff);
      carry = Math.floor(carry / 256);
    }
  }

  for (let index = 0; index < leadingZeroDigits; index += 1) {
    bytes.unshift(0);
  }

  return Uint8Array.from(bytes);
}
