import type { CodecId, CodecName, DecodeResult, EncodeResult } from '../protocol/types';

export interface CodecInfo {
  id: CodecId;
  name: CodecName;
}

export interface WorkerReadyResult {
  codecs: CodecInfo[];
  wasmLoaded: boolean;
}

export type WorkerRequest =
  | { id: string; type: 'ready' }
  | { id: string; type: 'encode'; payload: { text: string } }
  | { id: string; type: 'decode'; payload: { cat: string } }
  | { id: string; type: 'sample' };

export type WorkerResultMap = {
  ready: WorkerReadyResult;
  encode: EncodeResult;
  decode: DecodeResult;
  sample: { text: string };
};

export interface WorkerErrorShape {
  kind:
    | 'invalid-input'
    | 'corrupted-data'
    | 'unsupported'
    | 'runtime-unavailable';
  message: string;
}

export type WorkerResponse =
  | {
      [K in keyof WorkerResultMap]: {
        id: string;
        type: K;
        status: 'ok';
        result: WorkerResultMap[K];
      };
    }[keyof WorkerResultMap]
  | {
      id: string;
      type: WorkerRequest['type'];
      status: 'error';
      error: WorkerErrorShape;
    };
