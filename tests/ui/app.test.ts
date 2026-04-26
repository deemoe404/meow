import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import { TOKEN_TABLE } from '../../src/protocol/tokens';
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
  it('uses a playful pivot animation for the token vocabulary dialog', () => {
    const css = readFileSync('src/style.css', 'utf8');
    const enterAnimation = css.match(/@keyframes vocabulary-dialog-enter \{[\s\S]*?\n\}/)?.[0] ?? '';
    const exitAnimation = css.match(/@keyframes vocabulary-dialog-exit \{[\s\S]*?\n\}/)?.[0] ?? '';
    const tokenListRule = css.match(/\.token-vocabulary-list \{[\s\S]*?\n\}/)?.[0] ?? '';
    const tokenItemRule = css.match(/\.token-vocabulary-item \{[\s\S]*?\n\}/)?.[0] ?? '';

    expect(css).toContain('transform-origin: 42% 68%;');
    expect(enterAnimation).toContain('translate3d(-10px, calc(50svh + 56px), 0)');
    expect(enterAnimation).toContain('rotate(-6deg)');
    expect(enterAnimation).toContain('scale(0.96)');
    expect(exitAnimation).toContain('translate3d(-10px, calc(50svh + 56px), 0)');
    expect(enterAnimation).not.toContain('58%');
    expect(enterAnimation).not.toContain('rotate(-2deg)');
    expect(enterAnimation).not.toContain('rotate(1.4deg)');
    expect(enterAnimation).not.toContain('scale(1.006)');
    expect(css).toContain('vocabulary-dialog-enter 300ms');
    expect(css).toContain('vocabulary-dialog-exit 220ms');
    expect(css).toContain('contain: layout paint;');
    expect(css).not.toContain('vocabulary-list-enter');
    expect(css).not.toContain('backdrop-filter: blur(10px);');
    expect(css).not.toContain('scale(0.88)');
    expect(tokenListRule).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));');
    expect(tokenListRule).toContain('gap: 0;');
    expect(tokenItemRule).toContain('border-bottom: 1px solid');
    expect(tokenItemRule).not.toContain('border: 1px solid');
    expect(tokenItemRule).not.toContain('background: rgba(255, 250, 244');
    expect(tokenItemRule).not.toContain('border-radius');
  });

  it('renders the feline translator workspace from the target design', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    await createTranslatorApp(root, createService());
    await flush();

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('喵在说啥');
    expect(root.querySelector('[data-role="tagline-cat"]')?.textContent).toBe('！喵喵mewMEW');
    expect(root.textContent).not.toContain('THE FELINE CONNECTION');
    expect(root.textContent).not.toContain('动态地用目前的翻译程序，把“人在说啥”翻译成猫语。');
    expect(root.querySelector('[data-role="source-label"]')?.textContent).toBe('人话');
    expect(root.querySelector('[data-role="target-label"]')?.textContent).toBe('猫语');
    expect(root.querySelector('[data-role="source-label"]')?.classList.contains('language-pill--chinese')).toBe(true);
    expect(root.querySelector('[data-role="target-label"]')?.classList.contains('language-pill--cat')).toBe(true);
    expect(root.querySelector<HTMLTextAreaElement>('[data-role="input"]')?.placeholder).toBe('输入要翻译的人话...');
    expect(root.querySelector<HTMLTextAreaElement>('[data-role="output"]')?.placeholder).toBe('翻译后的猫语会出现在这里...');
    expect(root.querySelector('[data-role="stitch-cat"]')?.getAttribute('src')).toBe('stitch-cat.png');
    expect(root.querySelector('[data-role="translate"]')?.getAttribute('aria-label')).toBe('翻译');
    expect(root.querySelector('.feline-app [data-role="translate"]')).toBeNull();
    expect(root.querySelector('[data-role="translate"]')?.parentElement).toBe(root);
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
    expect(root.querySelector('[data-role="expanded-vocabulary-toggle"]')).toBeNull();
  });

  it('opens the current token vocabulary dialog from the capacity entry', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    await createTranslatorApp(root, createService());

    const trigger = root.querySelector<HTMLButtonElement>('[data-role="token-vocabulary-trigger"]');

    expect(trigger).not.toBeNull();
    expect(trigger!.textContent).toContain('词表');
    expect(trigger!.textContent).toContain(String(TOKEN_TABLE.length));
    expect(root.textContent).not.toContain('占用');
    expect(root.querySelector('[data-role="token-vocabulary-dialog"]')).toBeNull();

    trigger!.click();

    const dialog = root.querySelector<HTMLElement>('[data-role="token-vocabulary-dialog"]');
    const items = root.querySelectorAll('[data-role="token-list-item"]');
    const firstItem = root.querySelector<HTMLElement>('[data-token-index="0"]');
    const spaceIndex = TOKEN_TABLE.indexOf(' ');
    const newlineIndex = TOKEN_TABLE.indexOf('\n');
    const spaceItem = root.querySelector<HTMLElement>(`[data-token-index="${spaceIndex}"]`);
    const newlineItem = root.querySelector<HTMLElement>(`[data-token-index="${newlineIndex}"]`);
    const lastItem = root.querySelector<HTMLElement>(`[data-token-index="${TOKEN_TABLE.length - 1}"]`);

    expect(trigger!.getAttribute('aria-expanded')).toBe('true');
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('role')).toBe('dialog');
    expect(dialog!.getAttribute('aria-modal')).toBe('true');
    expect(dialog!.textContent).toContain(`当前词表 / ${TOKEN_TABLE.length} tokens`);
    expect(items).toHaveLength(TOKEN_TABLE.length);
    expect(firstItem?.textContent).toContain('0');
    expect(firstItem?.textContent).toContain(TOKEN_TABLE[0]);
    expect(spaceItem?.textContent).toContain(String(spaceIndex));
    expect(spaceItem?.textContent).toContain('空格 (" ")');
    expect(newlineItem?.textContent).toContain(String(newlineIndex));
    expect(newlineItem?.textContent).toContain('换行 ("\\n")');
    expect(lastItem?.textContent).toContain(String(TOKEN_TABLE.length - 1));
    expect(lastItem?.textContent).toContain(TOKEN_TABLE[TOKEN_TABLE.length - 1]);
  });

  it('animates the token vocabulary dialog closed before removing it and restoring focus', async () => {
    vi.useFakeTimers();
    try {
      const root = document.createElement('div');
      document.body.append(root);

      await createTranslatorApp(root, createService());

      const trigger = root.querySelector<HTMLButtonElement>('[data-role="token-vocabulary-trigger"]');

      trigger!.focus();
      trigger!.click();

      root.querySelector<HTMLButtonElement>('[data-role="token-vocabulary-close"]')!.click();

      const closingOverlay = root.querySelector<HTMLElement>('[data-role="token-vocabulary-overlay"]');
      expect(closingOverlay).not.toBeNull();
      expect(closingOverlay!.classList.contains('is-closing')).toBe(true);
      expect(root.querySelector('[data-role="token-vocabulary-dialog"]')).not.toBeNull();
      expect(trigger!.getAttribute('aria-expanded')).toBe('false');

      vi.advanceTimersByTime(220);

      expect(root.querySelector('[data-role="token-vocabulary-dialog"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);

      trigger!.click();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(root.querySelector('[data-role="token-vocabulary-overlay"]')?.classList.contains('is-closing')).toBe(true);

      vi.advanceTimersByTime(220);

      expect(root.querySelector('[data-role="token-vocabulary-dialog"]')).toBeNull();
      expect(trigger!.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
    } finally {
      vi.useRealTimers();
    }
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

  it('fades existing output out before revealing translated replacement text', async () => {
    vi.useFakeTimers();
    try {
      const root = document.createElement('div');
      document.body.append(root);

      let resolveEncode: ((value: Awaited<ReturnType<AppService['encode']>>) => void) | null = null;
      const encode = vi.fn(
        () =>
          new Promise<Awaited<ReturnType<AppService['encode']>>>((resolve) => {
            resolveEncode = resolve;
          }),
      );
      await createTranslatorApp(root, createService({ encode }));

      const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
      const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');
      const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

      input!.value = '你好，猫猫';
      output!.value = 'old cat text';
      translate!.click();
      await flush();

      expect(encode).toHaveBeenCalledWith('你好，猫猫');
      expect(output!.value).toBe('old cat text');
      expect(output!.classList.contains('is-output-replace-hiding')).toBe(true);

      resolveEncode!({
        cat: '！喵喵mewMEW',
        meta: {
          codec: 1,
          tokenCount: 4,
        },
      });
      await flush();
      vi.advanceTimersByTime(160);
      await flush();

      expect(output!.value).toBe('！喵喵mewMEW');
      expect(output!.classList.contains('is-output-replace-hiding')).toBe(false);
      expect(output!.classList.contains('is-output-replace-revealing')).toBe(true);

      vi.advanceTimersByTime(220);

      expect(output!.classList.contains('is-output-replace-revealing')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('switches direction before translating and does not render uppercase mode controls', async () => {
    vi.useFakeTimers();
    try {
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
      expect(input!.placeholder).toBe('输入要翻译的猫语...');
      expect(output!.placeholder).toBe('翻译后的人话会出现在这里...');

      vi.advanceTimersByTime(740);

      input!.dispatchEvent(new Event('input', { bubbles: true }));
      translate!.click();
      await flush();

      expect(decode).toHaveBeenCalledWith('！喵喵mewMEW');
      expect(output!.value).toBe('你好，猫猫');

      vi.advanceTimersByTime(160);
      await flush();

      expect(output!.value).toBe('decoded:！喵喵mewMEW');
      expect(root.querySelector('[data-role=\"upper-toggle\"]')).toBeNull();
      expect(root.textContent).not.toContain('大写模式');
    } finally {
      vi.useRealTimers();
    }
  });

  it('silently ignores non-cat clipboard text on window focus', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    vi.mocked(navigator.clipboard.readText).mockResolvedValueOnce('普通剪贴板内容');
    const decode = vi.fn(async () => {
      throw new Error('未知 token');
    });

    await createTranslatorApp(root, createService({ decode }));
    await flush();

    const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
    const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

    input!.value = '保留原输入';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    window.dispatchEvent(new FocusEvent('focus'));
    await flush();
    await flush();

    expect(navigator.clipboard.readText).toHaveBeenCalled();
    expect(decode).toHaveBeenCalledWith('普通剪贴板内容');
    expect(root.querySelector('.feline-app')?.classList.contains('is-cat-to-human')).toBe(false);
    expect(input!.value).toBe('保留原输入');
    expect(output!.value).toBe('');
    expect(root.querySelector('[data-role="error"]')?.textContent).toBe('');
  });

  it('translates valid cat-language clipboard text when the window receives focus', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const catClipboard = '！喵喵mewMEW';
    vi.mocked(navigator.clipboard.readText).mockResolvedValueOnce(catClipboard);
    const decode = vi.fn(async (cat: string) => ({
      text: `decoded:${cat}`,
      meta: {
        codec: 1 as const,
        tokenCount: 4,
      },
    }));

    await createTranslatorApp(root, createService({ decode }));
    await flush();

    const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
    const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

    input!.value = '原来的人话';
    output!.value = '原来的猫语';
    window.dispatchEvent(new FocusEvent('focus'));
    await flush();
    await flush();

    expect(navigator.clipboard.readText).toHaveBeenCalled();
    expect(decode).toHaveBeenCalledWith(catClipboard);
    expect(root.querySelector('.feline-app')?.classList.contains('is-cat-to-human')).toBe(true);
    expect(input!.value).toBe(catClipboard);
    expect(output!.value).toBe(`decoded:${catClipboard}`);
    expect(input!.classList.contains('text-content--cat')).toBe(true);
    expect(output!.classList.contains('text-content--chinese')).toBe(true);
    expect(input!.placeholder).toBe('输入要翻译的猫语...');
    expect(output!.placeholder).toBe('翻译后的人话会出现在这里...');
    expect(root.querySelector('[data-role="input-count"]')?.textContent).toBe(`${catClipboard.length} / 5000`);
    expect(root.querySelector('[data-role="meta-codec"]')?.textContent).toBe('zstd-dict');
    expect(root.querySelector('[data-role="meta-token-count"]')?.textContent).toBe('4');
  });

  it('renders two temporary text swap ghosts while switching filled panels', async () => {
    vi.useFakeTimers();
    try {
      const root = document.createElement('div');
      document.body.append(root);

      await createTranslatorApp(root, createService());

      const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
      const reverse = root.querySelector<HTMLButtonElement>('[data-role="direction-toggle"]');
      const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

      input!.value = '你好，猫猫';
      output!.value = '！喵喵mewMEW';
      reverse!.click();

      const ghosts = root.querySelectorAll('[data-role="text-swap-ghost"]');
      expect(ghosts).toHaveLength(2);
      expect([...ghosts].map((ghost) => ghost.textContent)).toEqual([
        '你好，猫猫',
        '！喵喵mewMEW',
      ]);
      expect(ghosts[0]?.getAttribute('aria-hidden')).toBe('true');
      expect(input!.classList.contains('is-text-swap-live-hidden')).toBe(true);
      expect(output!.classList.contains('is-text-swap-live-hidden')).toBe(true);

      vi.advanceTimersByTime(520);

      expect(root.querySelectorAll('[data-role="text-swap-ghost"]')).toHaveLength(0);
      expect(input!.classList.contains('is-text-swap-live-hidden')).toBe(false);
      expect(output!.classList.contains('is-text-swap-live-hidden')).toBe(false);
      expect(input!.classList.contains('is-text-swap-live-revealing')).toBe(true);
      expect(output!.classList.contains('is-text-swap-live-revealing')).toBe(true);

      vi.advanceTimersByTime(220);

      expect(input!.classList.contains('is-text-swap-live-revealing')).toBe(false);
      expect(output!.classList.contains('is-text-swap-live-revealing')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders only one text swap ghost when only one panel has text', async () => {
    vi.useFakeTimers();
    try {
      const root = document.createElement('div');
      document.body.append(root);

      await createTranslatorApp(root, createService());

      const reverse = root.querySelector<HTMLButtonElement>('[data-role="direction-toggle"]');
      const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

      output!.value = '！喵喵mewMEW';
      reverse!.click();

      const ghosts = root.querySelectorAll('[data-role="text-swap-ghost"]');
      expect(ghosts).toHaveLength(1);
      expect(ghosts[0]?.textContent).toBe('！喵喵mewMEW');

      vi.advanceTimersByTime(740);

      expect(root.querySelectorAll('[data-role="text-swap-ghost"]')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans up previous text swap ghosts during rapid direction switches', async () => {
    vi.useFakeTimers();
    try {
      const root = document.createElement('div');
      document.body.append(root);

      await createTranslatorApp(root, createService());

      const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
      const reverse = root.querySelector<HTMLButtonElement>('[data-role="direction-toggle"]');
      const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');

      input!.value = '你好，猫猫';
      output!.value = '！喵喵mewMEW';
      reverse!.click();
      expect(root.querySelectorAll('[data-role="text-swap-ghost"]')).toHaveLength(2);

      reverse!.click();

      const ghosts = root.querySelectorAll('[data-role="text-swap-ghost"]');
      expect(ghosts).toHaveLength(2);
      expect([...ghosts].map((ghost) => ghost.textContent)).toEqual([
        '！喵喵mewMEW',
        '你好，猫猫',
      ]);

      vi.advanceTimersByTime(740);

      expect(root.querySelectorAll('[data-role="text-swap-ghost"]')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
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
