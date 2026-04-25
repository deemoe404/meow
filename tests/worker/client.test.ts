import { describe, expect, it } from 'vitest';

import { createWorkerClient } from '../../src/worker/client';
import type { WorkerRequest, WorkerResponse } from '../../src/worker/messages';

class FakeWorker {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  posted: WorkerRequest[] = [];

  postMessage(request: WorkerRequest) {
    this.posted.push(request);
  }

  emit(response: WorkerResponse) {
    this.onmessage?.({ data: response } as MessageEvent<WorkerResponse>);
  }

  terminate() {
    return undefined;
  }
}

describe('worker client', () => {
  it('matches responses back to pending requests', async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient(worker as unknown as Worker);
    const pending = client.ready();
    const request = worker.posted[0];

    worker.emit({
      id: request.id,
      type: 'ready',
      status: 'ok',
      result: {
        codecs: [
          { id: 0, name: 'raw' },
          { id: 1, name: 'zstd-dict' },
        ],
        wasmLoaded: true,
      },
    });

    await expect(pending).resolves.toEqual({
      codecs: [
        { id: 0, name: 'raw' },
        { id: 1, name: 'zstd-dict' },
      ],
      wasmLoaded: true,
    });
  });

  it('rejects structured worker errors', async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient(worker as unknown as Worker);
    const pending = client.encode('hello');
    const request = worker.posted[0];

    worker.emit({
      id: request.id,
      type: 'encode',
      status: 'error',
      error: {
        kind: 'runtime-unavailable',
        message: 'boom',
      },
    });

    await expect(pending).rejects.toThrowError(/boom/);
  });

  it('sends the selected token vocabulary with encode and decode requests', () => {
    const worker = new FakeWorker();
    const client = createWorkerClient(worker as unknown as Worker);

    void client.encode('hello', 'expanded');
    void client.decode('mew!', 'expanded');

    expect(worker.posted).toEqual([
      {
        id: 'req-1',
        type: 'encode',
        payload: { text: 'hello', vocabulary: 'expanded' },
      },
      {
        id: 'req-2',
        type: 'decode',
        payload: { cat: 'mew!', vocabulary: 'expanded' },
      },
    ]);
  });
});
