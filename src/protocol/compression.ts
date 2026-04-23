import { ProtocolError } from './errors';
import type {
  CodecName,
  CompressionAdapter,
  CompressionReadyState,
} from './types';

const DEFAULT_COMPRESSION_LEVEL = 10;
const READY_CODECS: CodecName[] = ['raw', 'zstd-dict'];

export interface ZstdBindings {
  init(): Promise<void>;
  createCCtx(): number;
  freeCCtx(cctx: number): void;
  createDCtx(): number;
  freeDCtx(dctx: number): void;
  compressUsingDict(
    cctx: number,
    raw: Uint8Array,
    dict: Uint8Array,
    level?: number,
  ): Uint8Array;
  decompressUsingDict(
    dctx: number,
    payload: Uint8Array,
    dict: Uint8Array,
  ): Uint8Array;
}

interface CompressionAdapterOptions {
  dict: Uint8Array;
  bindings: ZstdBindings;
  compressionLevel?: number;
}

export function createCompressionAdapter(
  options: CompressionAdapterOptions,
): CompressionAdapter {
  let readyPromise: Promise<CompressionReadyState> | null = null;

  async function ensureReady(): Promise<CompressionReadyState> {
    if (!readyPromise) {
      readyPromise = options.bindings.init().then(() => ({
        codecs: READY_CODECS,
        wasmLoaded: true,
      }));
    }

    return readyPromise;
  }

  return {
    init: ensureReady,
    async choosePayload(raw) {
      await ensureReady();

      const cctx = options.bindings.createCCtx();
      try {
        const compressed = options.bindings.compressUsingDict(
          cctx,
          raw,
          options.dict,
          options.compressionLevel ?? DEFAULT_COMPRESSION_LEVEL,
        );

        if (compressed.length < raw.length) {
          return {
            codec: 1,
            payload: compressed,
          };
        }

        return {
          codec: 0,
          payload: raw,
        };
      } finally {
        options.bindings.freeCCtx(cctx);
      }
    },
    async decodePayload(codec, payload) {
      await ensureReady();

      if (codec === 0) {
        return payload;
      }

      if (codec !== 1) {
        throw new ProtocolError(`不支持的 codec: ${codec}`, 'unsupported');
      }

      const dctx = options.bindings.createDCtx();
      try {
        return options.bindings.decompressUsingDict(dctx, payload, options.dict);
      } finally {
        options.bindings.freeDCtx(dctx);
      }
    },
  };
}
