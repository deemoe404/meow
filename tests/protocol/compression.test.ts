import { describe, expect, it } from 'vitest';

import { createCompressionAdapter } from '../../src/protocol/compression';

function createBindings(compressed: Uint8Array) {
  return {
    async init() {
      return undefined;
    },
    createCCtx() {
      return 1;
    },
    freeCCtx() {
      return undefined;
    },
    createDCtx() {
      return 2;
    },
    freeDCtx() {
      return undefined;
    },
    compressUsingDict(_cctx: number, _raw: Uint8Array, _dict: Uint8Array) {
      return compressed;
    },
    decompressUsingDict(_dctx: number, payload: Uint8Array) {
      return Uint8Array.from(payload).reverse();
    },
  };
}

describe('compression adapter', () => {
  it('reports ready state after initialization', async () => {
    const adapter = createCompressionAdapter({
      dict: Uint8Array.from([1, 2, 3]),
      bindings: createBindings(Uint8Array.from([9])),
    });

    await expect(adapter.init()).resolves.toEqual({
      codecs: ['raw', 'zstd-dict'],
      wasmLoaded: true,
    });
  });

  it('keeps raw payload when compression is not shorter', async () => {
    const raw = Uint8Array.from([1, 2, 3]);
    const adapter = createCompressionAdapter({
      dict: Uint8Array.from([1]),
      bindings: createBindings(Uint8Array.from([9, 9, 9])),
    });

    expect(await adapter.choosePayload(raw)).toEqual({
      codec: 0,
      payload: raw,
    });
  });

  it('uses zstd-dict when compressed payload is shorter', async () => {
    const raw = Uint8Array.from([1, 2, 3, 4, 5]);
    const compressed = Uint8Array.from([7, 8]);
    const adapter = createCompressionAdapter({
      dict: Uint8Array.from([1]),
      bindings: createBindings(compressed),
    });

    expect(await adapter.choosePayload(raw)).toEqual({
      codec: 1,
      payload: compressed,
    });
  });

  it('returns raw payload directly for raw codec decode', async () => {
    const payload = Uint8Array.from([5, 4, 3]);
    const adapter = createCompressionAdapter({
      dict: Uint8Array.from([1]),
      bindings: createBindings(Uint8Array.from([9])),
    });

    await expect(adapter.decodePayload(0, payload)).resolves.toEqual(payload);
  });

  it('decompresses zstd payloads through the bindings', async () => {
    const adapter = createCompressionAdapter({
      dict: Uint8Array.from([1]),
      bindings: createBindings(Uint8Array.from([9])),
    });

    await expect(
      adapter.decodePayload(1, Uint8Array.from([1, 2, 3])),
    ).resolves.toEqual(Uint8Array.from([3, 2, 1]));
  });
});
