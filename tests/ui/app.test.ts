import { describe, expect, it, vi } from 'vitest';

import { createTranslatorApp } from '../../src/ui/app';
import type { AppService } from '../../src/ui/app';

function createService(overrides: Partial<AppService> = {}): AppService {
  return {
    async ready() {
      return {
        codecs: [
          { id: 0, name: 'raw' },
          { id: 1, name: 'zstd-dict' },
        ],
        wasmLoaded: true,
      };
    },
    async encode(text) {
      return {
        cat: '！喵喵mewMEW',
        meta: {
          codec: 1,
          rawLength: text.length,
          tokenCount: 4,
        },
      };
    },
    async decode(cat) {
      return {
        text: `decoded:${cat}`,
        meta: {
          codec: 1,
          rawLength: cat.length,
          tokenCount: 4,
        },
      };
    },
    async sample() {
      return { text: '随机猫叫示例' };
    },
    ...overrides,
  };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('translator app', () => {
  it('renders the core translator controls', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    await createTranslatorApp(root, createService());

    expect(root.textContent).toContain('nya58-zh2');
    expect(root.textContent).toContain('猫语翻译器');
    expect(root.textContent).toContain('人话 -> 猫语');
    expect(root.textContent).toContain('猫语 -> 人话');
    expect(root.textContent).toContain('协议摘要');
  });

  it('encodes human text and updates output/meta', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const encode = vi.fn(createService().encode);
    await createTranslatorApp(root, createService({ encode }));

    const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
    const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');
    const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

    expect(input).not.toBeNull();
    expect(translate).not.toBeNull();
    expect(output).not.toBeNull();

    input!.value = '你好，猫猫';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    translate!.click();
    await flush();

    expect(encode).toHaveBeenCalledWith('你好，猫猫');
    expect(output!.value).toBe('！喵喵mewMEW');
    expect(root.textContent).toContain('raw');
    expect(root.textContent).toContain('rawLength');
    expect(root.textContent).toContain('tokenCount');
    expect(root.textContent).not.toContain('dictId');
    expect(root.textContent).not.toContain('payloadLength');
  });

  it('switches direction before translating and does not render uppercase mode controls', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const decode = vi.fn(createService().decode);
    await createTranslatorApp(root, createService({ decode }));

    const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
    const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');
    const reverse = root.querySelector<HTMLButtonElement>('[data-role="direction-cat"]');
    const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

    reverse!.click();
    input!.value = '！喵喵mewMEW';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    translate!.click();
    await flush();

    expect(decode).toHaveBeenCalledWith('！喵喵mewMEW');
    expect(output!.value).toBe('decoded:！喵喵mewMEW');
    expect(root.querySelector('[data-role=\"upper-toggle\"]')).toBeNull();
    expect(root.textContent).not.toContain('大写模式');
  });

  it('fills a random sample and copies the current output', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    await createTranslatorApp(root, createService());

    const sample = root.querySelector<HTMLButtonElement>('[data-role="sample"]');
    const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');
    const copy = root.querySelector<HTMLButtonElement>('[data-role="copy"]');
    const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');

    sample!.click();
    await flush();
    expect(input!.value).toBe('随机猫叫示例');

    translate!.click();
    await flush();
    copy!.click();
    await flush();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('！喵喵mewMEW');
  });

  it('shows translated errors to the user', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    await createTranslatorApp(
      root,
      createService({
        async encode() {
          throw new Error('worker 初始化失败');
        },
      }),
    );

    const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
    const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');

    input!.value = 'hello';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    translate!.click();
    await flush();

    expect(root.textContent).toContain('worker 初始化失败');
  });
});
