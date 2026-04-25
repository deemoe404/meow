import type { DecodeResult, EncodeResult } from '../protocol/types';
import type { TokenVocabularyId } from '../protocol/tokens';
import type {
  WorkerReadyResult,
  WorkerRequest,
  WorkerResponse,
} from './messages';

interface PendingRequest {
  resolve(value: unknown): void;
  reject(reason?: unknown): void;
}

export interface WorkerClient {
  ready(): Promise<WorkerReadyResult>;
  encode(text: string, vocabulary?: TokenVocabularyId): Promise<EncodeResult>;
  decode(cat: string, vocabulary?: TokenVocabularyId): Promise<DecodeResult>;
  sample(): Promise<{ text: string }>;
  dispose(): void;
}

export function createWorkerClient(worker: Worker): WorkerClient {
  const pending = new Map<string, PendingRequest>();
  let nextId = 0;

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const task = pending.get(response.id);
    if (!task) {
      return;
    }

    pending.delete(response.id);

    if (response.status === 'ok') {
      task.resolve(response.result);
      return;
    }

    task.reject(new Error(response.error.message));
  };

  worker.onerror = (event: Event) => {
    const reason = event instanceof ErrorEvent ? event.message : 'Worker 运行失败。';
    for (const task of pending.values()) {
      task.reject(new Error(reason));
    }
    pending.clear();
  };

  function request<T>(buildRequest: (id: string) => WorkerRequest): Promise<T> {
    const id = `req-${nextId += 1}`;
    const payload = buildRequest(id);

    return new Promise<T>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage(payload);
    });
  }

  return {
    ready() {
      return request<WorkerReadyResult>((id) => ({ id, type: 'ready' }));
    },
    encode(text, vocabulary = 'default') {
      return request<EncodeResult>((id) => ({
        id,
        type: 'encode',
        payload: { text, vocabulary },
      }));
    },
    decode(cat, vocabulary = 'default') {
      return request<DecodeResult>((id) => ({
        id,
        type: 'decode',
        payload: { cat, vocabulary },
      }));
    },
    sample() {
      return request<{ text: string }>((id) => ({ id, type: 'sample' }));
    },
    dispose() {
      for (const task of pending.values()) {
        task.reject(new Error('Worker 已被释放。'));
      }
      pending.clear();
      worker.terminate();
    },
  };
}
