import type { TokenVocabularyId } from './tokens';

export type CodecId = 0 | 1;

export type CodecName = 'raw' | 'zstd-dict';

export interface CompressionChoice {
  codec: CodecId;
  payload: Uint8Array;
}

export interface CompressionReadyState {
  codecs: CodecName[];
  wasmLoaded: boolean;
}

export interface CompressionAdapter {
  init(): Promise<CompressionReadyState>;
  choosePayload(raw: Uint8Array): Promise<CompressionChoice>;
  decodePayload(
    codec: CodecId,
    payload: Uint8Array,
  ): Promise<Uint8Array>;
}

export interface ProtocolMeta {
  codec: CodecId;
  tokenCount: number;
  vocabulary: TokenVocabularyId;
}

export interface EncodeResult {
  cat: string;
  meta: ProtocolMeta;
}

export interface DecodeResult {
  text: string;
  meta: ProtocolMeta;
}

export interface FrameInput {
  codec: CodecId;
  payload: Uint8Array;
}

export type FrameData = FrameInput;
