import { ProtocolError } from '../protocol/errors';
import type { DecodeResult, EncodeResult } from '../protocol/types';
import type { TokenVocabularyId } from '../protocol/tokens';
import type {
  WorkerErrorShape,
  WorkerReadyResult,
  WorkerRequest,
  WorkerResponse,
} from './messages';

export interface WorkerService {
  ready(): Promise<WorkerReadyResult>;
  encode(text: string, vocabulary: TokenVocabularyId): Promise<EncodeResult>;
  decode(cat: string, vocabulary: TokenVocabularyId): Promise<DecodeResult>;
  sample(): { text: string } | Promise<{ text: string }>;
}

function normalizeWorkerError(error: unknown): WorkerErrorShape {
  if (error instanceof ProtocolError) {
    return {
      kind: error.code,
      message: error.message,
    };
  }

  return {
    kind: 'runtime-unavailable',
    message: error instanceof Error ? error.message : '未知 Worker 错误。',
  };
}

export function createWorkerHandler(service: WorkerService) {
  return async function handleWorkerRequest(
    request: WorkerRequest,
  ): Promise<WorkerResponse> {
    try {
      switch (request.type) {
        case 'ready':
          return {
            id: request.id,
            type: request.type,
            status: 'ok',
            result: await service.ready(),
          };
        case 'encode':
          return {
            id: request.id,
            type: request.type,
            status: 'ok',
            result: await service.encode(request.payload.text, request.payload.vocabulary ?? 'default'),
          };
        case 'decode':
          return {
            id: request.id,
            type: request.type,
            status: 'ok',
            result: await service.decode(request.payload.cat, request.payload.vocabulary ?? 'default'),
          };
        case 'sample':
          return {
            id: request.id,
            type: request.type,
            status: 'ok',
            result: await service.sample(),
          };
      }
    } catch (error) {
      return {
        id: request.id,
        type: request.type,
        status: 'error',
        error: normalizeWorkerError(error),
      };
    }
  };
}
