import './style.css';

import { createTranslatorApp } from './ui/app';
import { createWorkerClient } from './worker/client';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('#app root not found');
}

const worker = new Worker(new URL('./worker/protocol.worker.ts', import.meta.url), {
  type: 'module',
});
const client = createWorkerClient(worker);

void createTranslatorApp(root, {
  ready: () => client.ready(),
  encode: (text) => client.encode(text),
  decode: (cat) => client.decode(cat),
  sample: () => client.sample(),
});
