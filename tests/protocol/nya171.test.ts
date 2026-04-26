import { describe, expect, it } from 'vitest';

import { createNya171Codec } from '../../src/protocol/nya171';
import { decodeCatToDigits } from '../../src/protocol/tokens';
import type { CompressionAdapter } from '../../src/protocol/types';

function createCompressionAdapter(): CompressionAdapter {
  const cache = new Map<string, Uint8Array>();

  return {
    async init() {
      return { codecs: ['raw', 'zstd-dict'], wasmLoaded: true };
    },
    async choosePayload(raw) {
      if (raw.length > 6) {
        const payload = Uint8Array.from([9, 9, raw.length]);
        cache.set(Array.from(payload).join(','), raw);
        return {
          codec: 1,
          payload,
        };
      }

      return {
        codec: 0,
        payload: raw,
      };
    },
    async decodePayload(codec, payload) {
      if (codec === 0) {
        return payload;
      }

      const restored = cache.get(Array.from(payload).join(','));
      if (!restored) {
        throw new Error('missing compressed payload mapping');
      }

      return restored;
    },
  };
}

function createRawCompressionAdapter(): CompressionAdapter {
  return {
    async init() {
      return { codecs: ['raw'], wasmLoaded: true };
    },
    async choosePayload(raw) {
      return {
        codec: 0,
        payload: raw,
      };
    },
    async decodePayload(_codec, payload) {
      return payload;
    },
  };
}

describe('nya171 codec', () => {
  it('round-trips mixed unicode text without normalization', async () => {
    const codec = createNya171Codec(createCompressionAdapter());
    const text = '喵！Hello～〜!😺\n第二行';
    const encoded = await codec.encode(text);
    const decoded = await codec.decode(encoded.cat);

    expect(decoded.text).toBe(text);
    expect(encoded.meta.tokenCount).toBe(decodeCatToDigits(encoded.cat).length);
    expect(decoded.meta.tokenCount).toBe(decodeCatToDigits(encoded.cat).length);
    expect(encoded.meta).not.toHaveProperty('vocabulary');
    expect(decoded.meta).not.toHaveProperty('vocabulary');
  });

  it('selects zstd-dict when the adapter produces a shorter payload', async () => {
    const codec = createNya171Codec(createCompressionAdapter());
    const encoded = await codec.encode('这是一段会被字典压缩的文本');

    expect(encoded.meta.codec).toBe(1);
  });

  it('keeps raw when compression is not shorter', async () => {
    const codec = createNya171Codec(createCompressionAdapter());
    const encoded = await codec.encode('short');

    expect(encoded.meta.codec).toBe(0);
  });

  it('uses a one-byte codec frame for short raw text', async () => {
    const codec = createNya171Codec(createRawCompressionAdapter());
    const encoded = await codec.encode('你好');
    const decoded = await codec.decode(encoded.cat);

    expect(decoded.text).toBe('你好');
    expect(encoded.meta.codec).toBe(0);
    expect(encoded.meta).not.toHaveProperty('rawLength');
    expect(encoded.meta.tokenCount).toBe(decodeCatToDigits(encoded.cat).length);
  });

  it('reports token counts from base171 digits for fixed raw samples', async () => {
    const codec = createNya171Codec(createRawCompressionAdapter());
    const shortText = 'short';
    const longText = '在一个理想的猫语翻译器里，协议层和外观层必须明确分开。协议层负责把任意 Unicode 文本安全地转成 UTF-8 字节，再经过 raw 或 zstd-dict 选择、frame 打包、base171 digit 切片和固定 token 表映射，最后得到一串可以公开传播的猫语。';

    const shortEncoded = await codec.encode(shortText);
    const longEncoded = await codec.encode(longText);

    expect(await codec.decode(shortEncoded.cat)).toMatchObject({ text: shortText });
    expect(await codec.decode(longEncoded.cat)).toMatchObject({ text: longText });
    expect(shortEncoded.meta.tokenCount).toBe(decodeCatToDigits(shortEncoded.cat).length);
    expect(longEncoded.meta.tokenCount).toBe(decodeCatToDigits(longEncoded.cat).length);
  });

});
