import { describe, expect, it } from 'vitest';

import { createWorkerHandler } from '../../src/worker/handler';
import type { WorkerRequest } from '../../src/worker/messages';

function createHandler() {
  const requests: string[] = [];

  const handler = createWorkerHandler({
    async ready() {
      requests.push('ready');
      return {
        codecs: [
          { id: 0, name: 'raw' },
          { id: 1, name: 'zstd-dict' },
        ],
        wasmLoaded: true,
      };
    },
    async encode(text) {
      requests.push(`encode:${text}`);
      return {
        cat: '！喵喵mew',
        meta: { codec: 0, tokenCount: 3 },
      };
    },
    async decode(cat) {
      requests.push(`decode:${cat}`);
      return {
        text: 'decoded',
        meta: { codec: 1, tokenCount: 9 },
      };
    },
    sample() {
      requests.push('sample');
      return { text: '随机猫叫示例' };
    },
  });

  return { handler, requests };
}

describe('worker handler', () => {
  it('responds to ready requests', async () => {
    const { handler } = createHandler();
    const request: WorkerRequest = { id: '1', type: 'ready' };

    await expect(handler(request)).resolves.toEqual({
      id: '1',
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
  });

  it('routes encode/decode/sample requests', async () => {
    const { handler, requests } = createHandler();

    await handler({ id: '2', type: 'encode', payload: { text: 'hello' } });
    await handler({ id: '3', type: 'decode', payload: { cat: '！喵喵mew' } });
    await handler({ id: '4', type: 'sample' });

    expect(requests).toEqual([
      'encode:hello',
      'decode:！喵喵mew',
      'sample',
    ]);
  });

  it('wraps thrown errors as structured worker errors', async () => {
    const handler = createWorkerHandler({
      async ready() {
        return { codecs: [], wasmLoaded: false };
      },
      async encode() {
        throw new Error('boom');
      },
      async decode() {
        throw new Error('boom');
      },
      sample() {
        throw new Error('boom');
      },
    });

    await expect(
      handler({ id: '5', type: 'encode', payload: { text: 'x' } }),
    ).resolves.toEqual({
      id: '5',
      type: 'encode',
      status: 'error',
      error: {
        kind: 'runtime-unavailable',
        message: 'boom',
      },
    });
  });
});
