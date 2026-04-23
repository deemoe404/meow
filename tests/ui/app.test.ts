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
    async encode() {
      return {
        cat: '！喵喵mewMEW',
        meta: {
          codec: 1,
          tokenCount: 4,
        },
      };
    },
    async decode(cat) {
      return {
        text: `decoded:${cat}`,
        meta: {
          codec: 1,
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
  it('renders the feline translator workspace from the target design', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    await createTranslatorApp(root, createService());

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('喵在说啥');
    expect(root.textContent).toContain('THE FELINE CONNECTION');
    expect(root.querySelector('[data-role="source-label"]')?.textContent).toBe('Chinese');
    expect(root.querySelector('[data-role="target-label"]')?.textContent).toBe('Cat');
    expect(root.querySelector('[data-role="source-label"]')?.classList.contains('language-pill--chinese')).toBe(true);
    expect(root.querySelector('[data-role="target-label"]')?.classList.contains('language-pill--cat')).toBe(true);
    expect(root.querySelector('[data-role="stitch-cat"]')?.getAttribute('src')).toBe('stitch-cat.png');
    expect(root.querySelector('[data-role="translate"]')?.getAttribute('aria-label')).toBe('翻译');
    expect(root.querySelector('[data-role="copy"]')?.getAttribute('aria-label')).toBe('复制');
    expect(root.querySelector('[data-role="clear"]')?.textContent).toBe('清空');
    expect(root.querySelector('[data-role="sample"]')?.textContent).toBe('示例');
    expect(root.querySelector('[data-role="favorite"]')?.getAttribute('aria-label')).toBe('收藏');
    expect(root.querySelector('[data-role="share"]')?.getAttribute('aria-label')).toBe('分享');
    expect(root.querySelectorAll('svg.icon').length).toBeGreaterThanOrEqual(7);
    expect(root.textContent).not.toContain('pets');
    expect(root.textContent).not.toContain('east');
    expect(root.textContent).not.toContain('sync');
    expect(root.textContent).not.toContain('content_copy');
    expect(root.textContent).not.toContain('auto_awesome');
    expect(root.textContent).not.toContain('PURRFECT MATCH');
    expect(root.textContent).toContain('codec');
    expect(root.textContent).not.toContain('rawLength');
    expect(root.textContent).toContain('tokenCount');
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
    expect(input!.classList.contains('text-content--chinese')).toBe(true);
    expect(output!.classList.contains('text-content--cat')).toBe(true);

    input!.value = '你好，猫猫';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    translate!.click();
    await flush();

    expect(encode).toHaveBeenCalledWith('你好，猫猫');
    expect(output!.value).toBe('！喵喵mewMEW');
    expect(root.querySelector('[data-role="meta-codec"]')?.textContent).toBe('zstd-dict');
    expect(root.querySelector('[data-role="meta-token-count"]')?.textContent).toBe('4');
    expect(root.textContent).not.toContain('rawLength');
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
    const reverse = root.querySelector<HTMLButtonElement>('[data-role="direction-toggle"]');
    const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

    input!.value = '你好，猫猫';
    output!.value = '！喵喵mewMEW';
    reverse!.click();
    expect(root.querySelector('.feline-app')?.classList.contains('is-cat-to-human')).toBe(true);
    expect(root.querySelector('.feline-app')?.classList.contains('is-panel-swapping')).toBe(true);
    expect(input!.readOnly).toBe(false);
    expect(output!.readOnly).toBe(true);
    expect(input!.value).toBe('！喵喵mewMEW');
    expect(output!.value).toBe('你好，猫猫');
    expect(input!.classList.contains('text-content--cat')).toBe(true);
    expect(output!.classList.contains('text-content--chinese')).toBe(true);
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

  it('shows short feedback after copying output', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const service = createService({
      async encode() {
        return {
          cat: 'encoded-cat',
          meta: {
            codec: 1,
            tokenCount: 4,
          },
        };
      },
    });

    await createTranslatorApp(root, service);

    const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
    const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');
    const copy = root.querySelector<HTMLButtonElement>('[data-role="copy"]');

    input!.value = 'hello';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    translate!.click();
    await flush();

    copy!.click();
    await flush();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('encoded-cat');
    expect(copy!.getAttribute('aria-label')).toBe('已复制');
    expect(copy!.textContent).not.toContain('content_copy');
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
