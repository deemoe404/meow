import { ProtocolError } from './errors';
import { TOKEN_TABLE } from './tokens';

const DEFAULT_BASE: number = TOKEN_TABLE.length;

function ensureBase(base: number): void {
  if (!Number.isInteger(base) || base < 2) {
    throw new ProtocolError('base 必须是大于 1 的整数。', 'invalid-input');
  }
}

function ensureDigit(digit: number, base: number): void {
  if (!Number.isInteger(digit) || digit < 0 || digit >= base) {
    throw new ProtocolError(`digit 超出 0..${base - 1} 范围。`, 'invalid-input');
  }
}

export function bytesToBaseNDigitsNoPad(
  bytes: Uint8Array,
  base: number = DEFAULT_BASE,
): number[] {
  ensureBase(base);

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
      digits[digitIndex] = value % base;
      carry = Math.floor(value / base);
    }

    while (carry > 0) {
      digits.unshift(carry % base);
      carry = Math.floor(carry / base);
    }
  }

  return Array.from({ length: leadingZeroBytes }, () => 0).concat(digits);
}

export function baseNDigitsToBytesNoPad(
  digits: number[],
  base: number = DEFAULT_BASE,
): Uint8Array {
  ensureBase(base);

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
    ensureDigit(digit, base);

    let carry = digit;

    for (let byteIndex = bytes.length - 1; byteIndex >= 0; byteIndex -= 1) {
      const value = bytes[byteIndex] * base + carry;
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
