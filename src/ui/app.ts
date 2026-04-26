import {
  getTokenTable,
  getVocabularySize,
} from '../protocol/tokens';
import type { EncodeResult, DecodeResult } from '../protocol/types';
import type { WorkerReadyResult } from '../worker/messages';

type Direction = 'human-to-cat' | 'cat-to-human';
const TOKEN_VOCABULARY_CLOSE_MS = 220;
const HERO_TAGLINE_SOURCE = '人在说啥';
const GITHUB_REPO_URL = 'https://github.com/deemoe404/meow';

export interface AppService {
  ready(): Promise<WorkerReadyResult>;
  encode(text: string): Promise<EncodeResult>;
  decode(cat: string): Promise<DecodeResult>;
  sample(): Promise<{ text: string }>;
}

function codecName(codec: number): string {
  switch (codec) {
    case 0:
      return 'raw';
    case 1:
      return 'zstd-dict';
    default:
      return `unknown(${codec})`;
  }
}

function buttonPressed(button: HTMLButtonElement, active: boolean): void {
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  button.classList.toggle('is-active', active);
}

function tokenDisplayValue(token: string): string {
  if (token === ' ') {
    return '空格 (" ")';
  }

  if (token === '\n') {
    return '换行 ("\\n")';
  }

  if (token.endsWith(' ')) {
    return `${tokenDisplayValue(token.slice(0, -1))} + 空格`;
  }

  return token;
}

type IconName = 'paw' | 'east' | 'sync' | 'copy' | 'star' | 'share' | 'github';

function icon(name: IconName): string {
  const icons: Record<IconName, string> = {
    paw: `
      <svg class="icon icon--paw" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M7.1 10.7c-1.35 0-2.45-1.32-2.45-2.95S5.75 4.8 7.1 4.8s2.45 1.32 2.45 2.95-1.1 2.95-2.45 2.95Z" />
        <path d="M16.9 10.7c-1.35 0-2.45-1.32-2.45-2.95s1.1-2.95 2.45-2.95 2.45 1.32 2.45 2.95-1.1 2.95-2.45 2.95Z" />
        <path d="M11.95 8.9c-1.35 0-2.45-1.42-2.45-3.17s1.1-3.17 2.45-3.17 2.45 1.42 2.45 3.17-1.1 3.17-2.45 3.17Z" />
        <path d="M5.05 15.05c-1.04 0-1.9-1.05-1.9-2.34s.86-2.34 1.9-2.34 1.9 1.05 1.9 2.34-.86 2.34-1.9 2.34Z" />
        <path d="M18.95 15.05c-1.04 0-1.9-1.05-1.9-2.34s.86-2.34 1.9-2.34 1.9 1.05 1.9 2.34-.86 2.34-1.9 2.34Z" />
        <path d="M12 11.2c2.02 0 5.52 3.48 5.52 6.06 0 1.6-1.22 2.58-2.72 2.58-.9 0-1.78-.5-2.8-.5s-1.9.5-2.8.5c-1.5 0-2.72-.98-2.72-2.58 0-2.58 3.5-6.06 5.52-6.06Z" />
      </svg>
    `,
    east: `
      <svg class="icon icon--east" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M13.2 5.4 19.8 12l-6.6 6.6-1.55-1.55 3.95-3.95H4.2v-2.2h11.4l-3.95-3.95L13.2 5.4Z" />
      </svg>
    `,
    sync: `
      <svg class="icon icon--sync" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M7.1 7.7A6.6 6.6 0 0 1 18.35 12h-2.2a4.4 4.4 0 0 0-7.5-3.1l1.95 1.95H4.55V4.8L7.1 7.7Z" />
        <path d="M16.9 16.3A6.6 6.6 0 0 1 5.65 12h2.2a4.4 4.4 0 0 0 7.5 3.1l-1.95-1.95h6.05v6.05l-2.55-2.9Z" />
      </svg>
    `,
    copy: `
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M8 7.5h9.5V19H8V7.5Zm2 2V17h5.5V9.5H10Z" />
        <path d="M5 4h9.5v2H7v8.5H5V4Z" />
      </svg>
    `,
    star: `
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="m12 3.8 2.4 5.05 5.55.72-4.05 3.85 1.02 5.5L12 16.2l-4.92 2.72 1.02-5.5-4.05-3.85 5.55-.72L12 3.8Z" />
      </svg>
    `,
    share: `
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M17.3 15.25c1.9 0 3.45 1.55 3.45 3.45s-1.55 3.45-3.45 3.45-3.45-1.55-3.45-3.45c0-.25.03-.5.08-.74l-6.5-3.4a3.42 3.42 0 0 1-2.48 1.06A3.46 3.46 0 0 1 1.5 12.17a3.46 3.46 0 0 1 3.45-3.45c.96 0 1.83.39 2.46 1.02l6.54-3.48a3.47 3.47 0 0 1-.1-.82 3.46 3.46 0 0 1 3.45-3.45 3.46 3.46 0 0 1 3.45 3.45 3.46 3.46 0 0 1-3.45 3.45c-.96 0-1.83-.39-2.46-1.02L8.3 11.35c.06.26.1.53.1.82 0 .27-.03.54-.1.79l6.52 3.41a3.42 3.42 0 0 1 2.48-1.12Zm0 2a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9ZM4.95 10.72a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9ZM17.3 3.99a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9Z" />
      </svg>
    `,
    github: `
      <svg class="icon icon--github" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M12 2.25c-5.38 0-9.75 4.37-9.75 9.75 0 4.3 2.79 7.95 6.66 9.24.49.09.67-.21.67-.47v-1.72c-2.71.59-3.28-1.17-3.28-1.17-.44-1.13-1.08-1.43-1.08-1.43-.89-.61.07-.6.07-.6.98.07 1.49 1.01 1.49 1.01.87 1.49 2.28 1.06 2.84.81.09-.63.34-1.06.62-1.3-2.16-.25-4.44-1.08-4.44-4.82 0-1.06.38-1.94 1.01-2.62-.1-.25-.44-1.24.1-2.58 0 0 .82-.26 2.68 1 .78-.22 1.6-.33 2.43-.33s1.65.11 2.43.33c1.86-1.26 2.68-1 2.68-1 .54 1.34.2 2.33.1 2.58.63.68 1.01 1.56 1.01 2.62 0 3.75-2.28 4.57-4.45 4.82.35.3.66.9.66 1.82v2.7c0 .26.18.57.68.47A9.76 9.76 0 0 0 21.75 12c0-5.38-4.37-9.75-9.75-9.75Z" />
      </svg>
    `,
  };

  return icons[name];
}

export async function createTranslatorApp(
  root: HTMLElement,
  service: AppService,
): Promise<void> {
  root.innerHTML = `
    <section class="feline-app" aria-labelledby="app-title">
      <div class="feline-pattern" aria-hidden="true"></div>
      <div class="ambient ambient--sun" aria-hidden="true"></div>
      <div class="ambient ambient--sand" aria-hidden="true"></div>

      <div class="vocabulary-controls" data-role="vocabulary-controls">
        <a
          class="github-repo-link"
          data-role="github-repo-link"
          href="${GITHUB_REPO_URL}"
          target="_blank"
          rel="noreferrer"
          aria-label="在 GitHub 打开 meow 仓库"
        >
          ${icon('github')}
        </a>
        <button
          class="token-vocabulary-trigger"
          type="button"
          data-role="token-vocabulary-trigger"
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-label="查看当前词表，共 ${getVocabularySize()} 个 token"
        >
          <span>词表</span>
          <strong data-role="token-vocabulary-count">${getVocabularySize()}</strong>
        </button>
      </div>

      <header class="hero">
        <div class="hero-inner">
          <div class="hero-mark">
            <span class="paw-float">${icon('paw')}</span>
            <span class="whisker-line" aria-hidden="true"></span>
          </div>
          <h1 id="app-title">喵在说啥</h1>
          <p class="tagline">
            <span aria-hidden="true"></span>
            <strong class="tagline-cat" data-role="tagline-cat" aria-label="人在说啥的猫语翻译">...</strong>
            <span aria-hidden="true"></span>
          </p>
        </div>
      </header>

      <main class="translator-stage">
        <section class="outer-pebble" aria-label="猫语翻译器">
          <div class="language-row" aria-label="翻译方向">
            <button class="language-pill language-pill--source language-pill--chinese" type="button" data-role="source-label">人话</button>
            <span class="language-arrow">${icon('east')}</span>
            <button class="language-pill language-pill--target language-pill--cat" type="button" data-role="target-label">猫语</button>
          </div>

          <div class="editor-grid">
            <button class="sync-button" type="button" data-role="direction-toggle" aria-label="切换翻译方向">
              ${icon('sync')}
            </button>

            <section class="text-panel text-panel--input" aria-labelledby="input-title">
              <h2 id="input-title" class="sr-only">输入</h2>
              <textarea
                data-role="input"
                aria-label="输入文本"
                maxlength="5000"
                rows="12"
                placeholder="输入要翻译的人话..."
              ></textarea>
              <div class="input-footer">
                <span data-role="input-count">0 / 5000</span>
              </div>
            </section>

            <section class="text-panel text-panel--output" aria-labelledby="output-title">
              <h2 id="output-title" class="sr-only">输出</h2>
              <textarea
                data-role="output"
                aria-label="输出文本"
                rows="12"
                placeholder="Meow, purr purr... meow? 🐾"
                readonly
              ></textarea>
              <div class="output-footer">
                <div class="icon-actions" aria-label="输出操作">
                  <button type="button" data-role="copy" aria-label="复制">
                    ${icon('copy')}
                  </button>
                  <button type="button" data-role="favorite" aria-label="收藏">
                    ${icon('star')}
                  </button>
                  <button type="button" data-role="share" aria-label="分享">
                    ${icon('share')}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <img class="stitch-cat" data-role="stitch-cat" src="stitch-cat.png" alt="Peeking cat" />
          <p class="error" data-role="error" hidden></p>
          <div class="meta-row" aria-live="polite">
            <span class="runtime-status" data-role="status">初始化中</span>
            <span>codec <strong data-role="meta-codec">-</strong></span>
            <span>tokenCount <strong data-role="meta-token-count">-</strong></span>
          </div>
          <div class="sr-only">
            <button type="button" data-role="sample">示例</button>
            <button type="button" data-role="clear">清空</button>
          </div>
        </section>
      </main>

    </section>

    <button class="floating-paw-action" type="button" data-role="translate" aria-label="翻译">
      ${icon('paw')}
    </button>
  `;

  const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
  const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');
  const heroTagline = root.querySelector<HTMLElement>('[data-role="tagline-cat"]');
  const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');
  const copy = root.querySelector<HTMLButtonElement>('[data-role="copy"]');
  const clear = root.querySelector<HTMLButtonElement>('[data-role="clear"]');
  const sample = root.querySelector<HTMLButtonElement>('[data-role="sample"]');
  const directionToggle = root.querySelector<HTMLButtonElement>('[data-role="direction-toggle"]');
  const sourceLabel = root.querySelector<HTMLButtonElement>('[data-role="source-label"]');
  const targetLabel = root.querySelector<HTMLButtonElement>('[data-role="target-label"]');
  const status = root.querySelector<HTMLElement>('[data-role="status"]');
  const error = root.querySelector<HTMLElement>('[data-role="error"]');
  const metaCodec = root.querySelector<HTMLElement>('[data-role="meta-codec"]');
  const metaTokenCount = root.querySelector<HTMLElement>('[data-role="meta-token-count"]');
  const inputCount = root.querySelector<HTMLElement>('[data-role="input-count"]');
  const tokenVocabularyTrigger = root.querySelector<HTMLButtonElement>(
    '[data-role="token-vocabulary-trigger"]',
  );
  const tokenVocabularyCount = root.querySelector<HTMLElement>('[data-role="token-vocabulary-count"]');
  const app = root.querySelector<HTMLElement>('.feline-app');

  if (
    !app ||
    !input ||
    !output ||
    !heroTagline ||
    !translate ||
    !copy ||
    !clear ||
    !sample ||
    !directionToggle ||
    !sourceLabel ||
    !targetLabel ||
    !status ||
    !error ||
    !metaCodec ||
    !metaTokenCount ||
    !inputCount ||
    !tokenVocabularyTrigger ||
    !tokenVocabularyCount
  ) {
    throw new Error('app DOM 初始化失败');
  }

  let direction: Direction = 'human-to-cat';
  let copyResetTimer: number | null = null;
  let swapResetTimer: number | null = null;
  let textSwapResetTimer: number | null = null;
  let textSwapRevealTimer: number | null = null;
  let outputReplaceHideTimer: number | null = null;
  let outputReplaceRevealTimer: number | null = null;
  let tokenVocabularyOverlay: HTMLElement | null = null;
  let tokenVocabularyCloseTimer: number | null = null;
  let translateRunId = 0;
  let heroRunId = 0;
  let clipboardFocusRunId = 0;
  let runtimeReady = false;
  translate.disabled = true;

  const prefersReducedMotion = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const cleanupTextSwapGhosts = (revealLiveText = false) => {
    if (textSwapResetTimer !== null) {
      window.clearTimeout(textSwapResetTimer);
      textSwapResetTimer = null;
    }
    if (textSwapRevealTimer !== null) {
      window.clearTimeout(textSwapRevealTimer);
      textSwapRevealTimer = null;
    }
    root.querySelectorAll('.text-swap-ghost').forEach((ghost) => ghost.remove());
    input.classList.remove('is-text-swap-live-hidden');
    output.classList.remove('is-text-swap-live-hidden');
    input.classList.remove('is-text-swap-live-revealing');
    output.classList.remove('is-text-swap-live-revealing');

    if (!revealLiveText) {
      return;
    }

    input.classList.add('is-text-swap-live-revealing');
    output.classList.add('is-text-swap-live-revealing');
    textSwapRevealTimer = window.setTimeout(() => {
      input.classList.remove('is-text-swap-live-revealing');
      output.classList.remove('is-text-swap-live-revealing');
      textSwapRevealTimer = null;
    }, 220);
  };

  const cleanupOutputReplaceTransition = () => {
    if (outputReplaceHideTimer !== null) {
      window.clearTimeout(outputReplaceHideTimer);
      outputReplaceHideTimer = null;
    }
    if (outputReplaceRevealTimer !== null) {
      window.clearTimeout(outputReplaceRevealTimer);
      outputReplaceRevealTimer = null;
    }
    output.classList.remove('is-output-replace-hiding', 'is-output-replace-revealing');
  };

  const closeTokenVocabularyDialog = (restoreFocus = true) => {
    if (!tokenVocabularyOverlay) {
      return;
    }
    if (tokenVocabularyCloseTimer !== null) {
      return;
    }

    const overlay = tokenVocabularyOverlay;
    overlay.classList.add('is-closing');
    tokenVocabularyTrigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleTokenVocabularyKeydown);

    tokenVocabularyCloseTimer = window.setTimeout(
      () => {
        overlay.remove();
        if (tokenVocabularyOverlay === overlay) {
          tokenVocabularyOverlay = null;
        }
        tokenVocabularyCloseTimer = null;

        if (restoreFocus) {
          tokenVocabularyTrigger.focus();
        }
      },
      prefersReducedMotion() ? 1 : TOKEN_VOCABULARY_CLOSE_MS,
    );
  };

  const buildTokenVocabularyDialog = () => {
    const tokenTable = getTokenTable();
    const overlay = document.createElement('div');
    overlay.className = 'token-vocabulary-overlay';
    overlay.dataset.role = 'token-vocabulary-overlay';

    const dialog = document.createElement('section');
    dialog.className = 'token-vocabulary-dialog';
    dialog.dataset.role = 'token-vocabulary-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'token-vocabulary-title');

    const header = document.createElement('div');
    header.className = 'token-vocabulary-header';

    const title = document.createElement('h2');
    title.id = 'token-vocabulary-title';
    title.textContent = `当前词表 / ${tokenTable.length} tokens`;

    const close = document.createElement('button');
    close.className = 'token-vocabulary-close';
    close.type = 'button';
    close.dataset.role = 'token-vocabulary-close';
    close.setAttribute('aria-label', '关闭词表');
    close.textContent = '关闭';
    close.addEventListener('click', () => closeTokenVocabularyDialog());

    header.append(title, close);

    const list = document.createElement('div');
    list.className = 'token-vocabulary-list';
    list.dataset.role = 'token-vocabulary-list';
    list.setAttribute('role', 'list');

    tokenTable.forEach((token, index) => {
      const item = document.createElement('div');
      item.className = 'token-vocabulary-item';
      item.dataset.role = 'token-list-item';
      item.dataset.tokenIndex = String(index);
      item.setAttribute('role', 'listitem');

      const indexLabel = document.createElement('span');
      indexLabel.className = 'token-vocabulary-index';
      indexLabel.textContent = String(index);

      const value = document.createElement('span');
      value.className = 'token-vocabulary-value';
      value.textContent = tokenDisplayValue(token);

      item.append(indexLabel, value);
      list.append(item);
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeTokenVocabularyDialog();
      }
    });

    dialog.append(header, list);
    overlay.append(dialog);

    return {
      overlay,
      close,
    };
  };

  function handleTokenVocabularyKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeTokenVocabularyDialog();
    }
  }

  const openTokenVocabularyDialog = () => {
    if (tokenVocabularyOverlay) {
      return;
    }

    const { overlay, close } = buildTokenVocabularyDialog();
    tokenVocabularyOverlay = overlay;
    tokenVocabularyTrigger.setAttribute('aria-expanded', 'true');
    app.append(overlay);
    document.addEventListener('keydown', handleTokenVocabularyKeydown);
    close.focus();
  };

  const waitForOutputFadeOut = () =>
    new Promise<void>((resolve) => {
      outputReplaceHideTimer = window.setTimeout(() => {
        outputReplaceHideTimer = null;
        resolve();
      }, 160);
    });

  const revealOutputReplacement = () => {
    output.classList.remove('is-output-replace-hiding');
    output.classList.add('is-output-replace-revealing');
    outputReplaceRevealTimer = window.setTimeout(() => {
      output.classList.remove('is-output-replace-revealing');
      outputReplaceRevealTimer = null;
    }, 220);
  };

  const beginOutputReplaceTransition = () => {
    const shouldFadeOut = output.value.length > 0 && !prefersReducedMotion();

    cleanupOutputReplaceTransition();

    if (!shouldFadeOut) {
      return null;
    }

    output.classList.add('is-output-replace-hiding');
    return waitForOutputFadeOut();
  };

  const replaceOutputValue = async (
    nextValue: string,
    result: EncodeResult | DecodeResult | null,
    runId: number,
    fadeOut: Promise<void> | null,
  ) => {
    if (fadeOut) {
      await fadeOut;
    }
    if (runId !== translateRunId) {
      return;
    }

    output.value = nextValue;
    setMeta(result);

    if (!prefersReducedMotion()) {
      revealOutputReplacement();
    }
  };

  const createTextSwapGhost = (
    text: string,
    contentClass: 'text-content--cat' | 'text-content--chinese',
    from: DOMRect,
    to: DOMRect,
    source: HTMLTextAreaElement,
  ) => {
    const sourceStyle = window.getComputedStyle(source);
    const ghost = document.createElement('div');
    ghost.className = `text-swap-ghost ${contentClass}`;
    ghost.setAttribute('aria-hidden', 'true');
    ghost.dataset.role = 'text-swap-ghost';
    ghost.textContent = text;
    ghost.style.fontFamily = sourceStyle.fontFamily;
    ghost.style.fontSize = sourceStyle.fontSize;
    ghost.style.fontStyle = sourceStyle.fontStyle;
    ghost.style.fontWeight = sourceStyle.fontWeight;
    ghost.style.lineHeight = sourceStyle.lineHeight;
    ghost.style.left = `${from.left}px`;
    ghost.style.top = `${from.top}px`;
    ghost.style.width = `${from.width}px`;
    ghost.style.height = `${from.height}px`;
    ghost.style.setProperty('--text-swap-x', `${to.left - from.left}px`);
    ghost.style.setProperty('--text-swap-y', `${to.top - from.top}px`);
    root.append(ghost);
  };

  const runTextSwapGhosts = (
    previousInput: string,
    previousOutput: string,
    previousInputClass: 'text-content--cat' | 'text-content--chinese',
    previousOutputClass: 'text-content--cat' | 'text-content--chinese',
    inputBefore: DOMRect,
    outputBefore: DOMRect,
  ) => {
    cleanupTextSwapGhosts();

    if (prefersReducedMotion() || (!previousInput && !previousOutput)) {
      return;
    }

    input.classList.add('is-text-swap-live-hidden');
    output.classList.add('is-text-swap-live-hidden');

    if (previousInput) {
      createTextSwapGhost(previousInput, previousInputClass, inputBefore, outputBefore, input);
    }
    if (previousOutput) {
      createTextSwapGhost(previousOutput, previousOutputClass, outputBefore, inputBefore, output);
    }

    textSwapResetTimer = window.setTimeout(() => cleanupTextSwapGhosts(true), 520);
  };

  const animateSwap = (nextDirection: Direction) => {
    const sourceBefore = sourceLabel.getBoundingClientRect();
    const targetBefore = targetLabel.getBoundingClientRect();
    const inputBefore = input.getBoundingClientRect();
    const outputBefore = output.getBoundingClientRect();
    const previousInput = input.value;
    const previousOutput = output.value;
    const previousInputClass = input.classList.contains('text-content--cat')
      ? 'text-content--cat'
      : 'text-content--chinese';
    const previousOutputClass = output.classList.contains('text-content--cat')
      ? 'text-content--cat'
      : 'text-content--chinese';

    app.classList.remove(
      'is-panel-swapping',
      'is-panel-swapping-to-human',
      'is-panel-swapping-to-cat',
    );
    void app.offsetWidth;
    app.classList.add(
      'is-panel-swapping',
      nextDirection === 'cat-to-human'
        ? 'is-panel-swapping-to-human'
        : 'is-panel-swapping-to-cat',
    );

    input.value = output.value;
    output.value = previousInput;
    updateInputCount();

    renderDirection();
    runTextSwapGhosts(
      previousInput,
      previousOutput,
      previousInputClass,
      previousOutputClass,
      inputBefore,
      outputBefore,
    );

    const sourceAfter = sourceLabel.getBoundingClientRect();
    const targetAfter = targetLabel.getBoundingClientRect();
    sourceLabel.style.setProperty('--language-slide-x', `${sourceBefore.left - sourceAfter.left}px`);
    targetLabel.style.setProperty('--language-slide-x', `${targetBefore.left - targetAfter.left}px`);
    sourceLabel.classList.remove('is-language-swapping');
    targetLabel.classList.remove('is-language-swapping');
    void sourceLabel.offsetWidth;
    sourceLabel.classList.add('is-language-swapping');
    targetLabel.classList.add('is-language-swapping');

    if (swapResetTimer !== null) {
      window.clearTimeout(swapResetTimer);
    }
    swapResetTimer = window.setTimeout(() => {
      app.classList.remove(
        'is-panel-swapping',
        'is-panel-swapping-to-human',
        'is-panel-swapping-to-cat',
      );
      sourceLabel.classList.remove('is-language-swapping');
      targetLabel.classList.remove('is-language-swapping');
      sourceLabel.style.removeProperty('--language-slide-x');
      targetLabel.style.removeProperty('--language-slide-x');
      swapResetTimer = null;
    }, 620);
  };

  const renderDirection = () => {
    const inputIsCat = direction === 'cat-to-human';
    app.classList.toggle('is-cat-to-human', direction === 'cat-to-human');
    input.classList.toggle('text-content--cat', inputIsCat);
    input.classList.toggle('text-content--chinese', !inputIsCat);
    output.classList.toggle('text-content--cat', !inputIsCat);
    output.classList.toggle('text-content--chinese', inputIsCat);
    input.placeholder = inputIsCat ? '输入要翻译的猫语...' : '输入要翻译的人话...';
    output.placeholder = inputIsCat ? '翻译后的人话会出现在这里...' : '翻译后的猫语会出现在这里...';
    buttonPressed(sourceLabel, direction === 'human-to-cat');
    buttonPressed(targetLabel, direction === 'cat-to-human');
  };

  const setError = (message: string | null) => {
    if (message) {
      error.hidden = false;
      error.textContent = message;
    } else {
      error.hidden = true;
      error.textContent = '';
    }
  };

  const setMeta = (result: EncodeResult | DecodeResult | null) => {
    metaCodec.textContent = result ? codecName(result.meta.codec) : '-';
    metaTokenCount.textContent = result ? String(result.meta.tokenCount) : '-';
  };

  const renderVocabularyControls = () => {
    const count = getVocabularySize();

    tokenVocabularyTrigger.setAttribute('aria-label', `查看当前词表，共 ${count} 个 token`);
    tokenVocabularyCount.textContent = String(count);
  };

  const runTranslate = async () => {
    const source = input.value;
    const runId = ++translateRunId;
    const outputFadeOut = beginOutputReplaceTransition();
    setError(null);

    try {
      if (direction === 'human-to-cat') {
        const result = await service.encode(source);
        await replaceOutputValue(result.cat, result, runId, outputFadeOut);
      } else {
        const result = await service.decode(source);
        await replaceOutputValue(result.text, result, runId, outputFadeOut);
      }
    } catch (err) {
      await replaceOutputValue('', null, runId, outputFadeOut);
      if (runId === translateRunId) {
        setError(err instanceof Error ? err.message : '翻译失败。');
      }
    }
  };

  const applyClipboardDecode = (
    cat: string,
    result: DecodeResult,
  ) => {
    translateRunId += 1;
    cleanupOutputReplaceTransition();
    setError(null);

    if (direction !== 'cat-to-human') {
      direction = 'cat-to-human';
      renderDirection();
    }

    input.value = cat;
    output.value = result.text;
    updateInputCount();
    setMeta(result);
  };

  const tryDecodeClipboardOnFocus = async () => {
    if (!runtimeReady || !root.isConnected || document.hidden) {
      return;
    }

    const readText = navigator.clipboard?.readText;
    if (typeof readText !== 'function') {
      return;
    }

    const runId = ++clipboardFocusRunId;
    let clipboardText: string;
    try {
      clipboardText = await readText.call(navigator.clipboard);
    } catch {
      return;
    }

    if (
      runId !== clipboardFocusRunId ||
      !root.isConnected ||
      clipboardText.length === 0 ||
      clipboardText.length > input.maxLength
    ) {
      return;
    }

    try {
      const result = await service.decode(clipboardText);
      if (runId === clipboardFocusRunId && root.isConnected) {
        applyClipboardDecode(clipboardText, result);
      }
    } catch {
      // Most clipboard contents are not cat-language payloads. Leave the current workspace untouched.
    }
  };

  const updateInputCount = () => {
    inputCount.textContent = `${input.value.length} / 5000`;
  };

  const updateHeroTagline = () => {
    const runId = ++heroRunId;
    void service.encode(HERO_TAGLINE_SOURCE).then((result) => {
      if (runId === heroRunId) {
        heroTagline.textContent = result.cat;
      }
    }).catch(() => {
      if (runId === heroRunId) {
        heroTagline.textContent = '';
      }
    });
  };

  sourceLabel.addEventListener('click', () => {
    if (direction === 'cat-to-human') {
      direction = 'human-to-cat';
      animateSwap(direction);
    }
  });

  targetLabel.addEventListener('click', () => {
    if (direction === 'human-to-cat') {
      direction = 'cat-to-human';
      animateSwap(direction);
    }
  });

  directionToggle.addEventListener('click', () => {
    const nextDirection = direction === 'human-to-cat' ? 'cat-to-human' : 'human-to-cat';
    direction = nextDirection;
    animateSwap(nextDirection);
  });

  input.addEventListener('input', updateInputCount);

  tokenVocabularyTrigger.addEventListener('click', openTokenVocabularyDialog);

  translate.addEventListener('click', () => {
    void runTranslate();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    updateInputCount();
    setMeta(null);
    setError(null);
  });

  sample.addEventListener('click', () => {
    void service.sample().then((result) => {
      input.value = result.text;
      updateInputCount();
      setError(null);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : '示例加载失败。');
    });
  });

  copy.addEventListener('click', () => {
    void navigator.clipboard.writeText(output.value).then(() => {
      copy.setAttribute('aria-label', '已复制');
      copy.classList.add('is-copied');
      if (copyResetTimer !== null) {
        window.clearTimeout(copyResetTimer);
      }
      copyResetTimer = window.setTimeout(() => {
        copy.setAttribute('aria-label', '复制');
        copy.classList.remove('is-copied');
        copyResetTimer = null;
      }, 1200);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : '复制失败。');
    });
  });

  renderDirection();
  renderVocabularyControls();
  updateInputCount();

  try {
    const ready = await service.ready();
    status.textContent = `就绪：${ready.codecs.map((codec) => codec.name).join(' / ')}`;
    translate.disabled = false;
    runtimeReady = true;
    window.addEventListener('focus', () => {
      void tryDecodeClipboardOnFocus();
    });
    updateHeroTagline();
  } catch (err) {
    status.textContent = '运行时不可用';
    setError(err instanceof Error ? err.message : '运行时初始化失败。');
    translate.disabled = true;
  }
}
