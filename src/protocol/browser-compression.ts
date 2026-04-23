import dictUrl from '../assets/dict_v1.bin?url';

import { createCompressionAdapter } from './compression';
import { ProtocolError } from './errors';

async function fetchBinary(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ProtocolError(`无法加载字典资源：${response.status}`, 'runtime-unavailable');
  }

  return new Uint8Array(await response.arrayBuffer());
}

export function createBrowserCompressionAdapter() {
  let adapterPromise: ReturnType<typeof createCompressionAdapter> | null = null;
  let initPromise: Promise<ReturnType<typeof createCompressionAdapter>> | null = null;

  async function ensureAdapter() {
    if (adapterPromise) {
      return adapterPromise;
    }

    if (!initPromise) {
      initPromise = (async () => {
        try {
          const [{ init, createCCtx, freeCCtx, createDCtx, freeDCtx, compressUsingDict, decompressUsingDict }, dict] =
            await Promise.all([
              import('@bokuweb/zstd-wasm'),
              fetchBinary(dictUrl),
            ]);

          await init();
          adapterPromise = createCompressionAdapter({
            dict,
            bindings: {
              init: async () => undefined,
              createCCtx,
              freeCCtx,
              createDCtx,
              freeDCtx,
              compressUsingDict,
              decompressUsingDict,
            },
          });
          return adapterPromise;
        } catch (error) {
          throw new ProtocolError(
            error instanceof Error ? error.message : '浏览器压缩运行时初始化失败。',
            'runtime-unavailable',
          );
        }
      })();
    }

    return initPromise;
  }

  return {
    async init() {
      return (await ensureAdapter()).init();
    },
    async choosePayload(raw: Uint8Array) {
      return (await ensureAdapter()).choosePayload(raw);
    },
    async decodePayload(codec: 0 | 1 | 2, payload: Uint8Array) {
      return (await ensureAdapter()).decodePayload(codec, payload);
    },
  };
}
