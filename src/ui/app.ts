import type { EncodeResult, DecodeResult } from '../protocol/types';
import type { WorkerReadyResult } from '../worker/messages';

type Direction = 'human-to-cat' | 'cat-to-human';

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

export async function createTranslatorApp(
  root: HTMLElement,
  service: AppService,
): Promise<void> {
  root.innerHTML = `
    <section class="app-shell" aria-labelledby="app-title">
      <header class="top-bar">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true">nya</span>
          <div>
            <h1 id="app-title">猫语翻译器</h1>
            <p>本地可逆编码，把 Unicode 文本转换成 nya58-zh3 猫语串。</p>
          </div>
        </div>
        <div class="runtime-cluster" aria-live="polite">
          <span class="protocol-chip">nya58-zh3</span>
          <span class="runtime-status" data-role="status">初始化中</span>
        </div>
      </header>

      <main class="workbench">
        <section class="pebble-panel pebble-panel--input" aria-labelledby="input-title">
          <div class="panel-head">
            <div>
              <p class="eyebrow">source</p>
              <h2 id="input-title">输入</h2>
            </div>
            <div class="direction-switch" aria-label="翻译方向">
              <button type="button" data-role="direction-human">人话 -> 猫语</button>
              <button type="button" data-role="direction-cat">猫语 -> 人话</button>
            </div>
          </div>
          <textarea
            data-role="input"
            aria-label="输入文本"
            rows="12"
            placeholder="输入人话或猫语"
          ></textarea>
          <div class="action-row">
            <button class="primary-action" type="button" data-role="translate">翻译</button>
            <button class="secondary-action" type="button" data-role="sample">示例</button>
            <button class="secondary-action" type="button" data-role="clear">清空</button>
          </div>
        </section>

        <section class="pebble-panel pebble-panel--output" aria-labelledby="output-title">
          <div class="panel-head">
            <div>
              <p class="eyebrow">result</p>
              <h2 id="output-title">输出</h2>
            </div>
            <button class="secondary-action copy-action" type="button" data-role="copy">复制</button>
          </div>
          <textarea
            data-role="output"
            aria-label="输出文本"
            rows="12"
            placeholder="等待翻译结果"
            readonly
          ></textarea>
          <p class="error" data-role="error" hidden></p>
        </section>

        <section class="protocol-strip" aria-label="协议状态">
          <div class="metric">
            <span>codec</span>
            <strong data-role="meta-codec">-</strong>
          </div>
          <div class="metric">
            <span>tokenCount</span>
            <strong data-role="meta-token-count">-</strong>
          </div>
          <details class="protocol-details">
            <summary>协议摘要</summary>
            <p>UTF-8 原文 -> raw/zstd-dict -> codec frame -> base58 digit -> 58-token 猫语表。</p>
          </details>
        </section>
      </main>
    </section>
  `;

  const input = root.querySelector<HTMLTextAreaElement>('[data-role="input"]');
  const output = root.querySelector<HTMLTextAreaElement>('[data-role="output"]');
  const translate = root.querySelector<HTMLButtonElement>('[data-role="translate"]');
  const copy = root.querySelector<HTMLButtonElement>('[data-role="copy"]');
  const clear = root.querySelector<HTMLButtonElement>('[data-role="clear"]');
  const sample = root.querySelector<HTMLButtonElement>('[data-role="sample"]');
  const directionHuman = root.querySelector<HTMLButtonElement>('[data-role="direction-human"]');
  const directionCat = root.querySelector<HTMLButtonElement>('[data-role="direction-cat"]');
  const status = root.querySelector<HTMLElement>('[data-role="status"]');
  const error = root.querySelector<HTMLElement>('[data-role="error"]');
  const metaCodec = root.querySelector<HTMLElement>('[data-role="meta-codec"]');
  const metaTokenCount = root.querySelector<HTMLElement>('[data-role="meta-token-count"]');

  if (
    !input ||
    !output ||
    !translate ||
    !copy ||
    !clear ||
    !sample ||
    !directionHuman ||
    !directionCat ||
    !status ||
    !error ||
    !metaCodec ||
    !metaTokenCount
  ) {
    throw new Error('app DOM 初始化失败');
  }

  let direction: Direction = 'human-to-cat';
  let copyResetTimer: number | null = null;
  translate.disabled = true;

  const renderDirection = () => {
    buttonPressed(directionHuman, direction === 'human-to-cat');
    buttonPressed(directionCat, direction === 'cat-to-human');
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

  const runTranslate = async () => {
    const source = input.value;
    setError(null);

    try {
      if (direction === 'human-to-cat') {
        const result = await service.encode(source);
        output.value = result.cat;
        setMeta(result);
      } else {
        const result = await service.decode(source);
        output.value = result.text;
        setMeta(result);
      }
    } catch (err) {
      output.value = '';
      setMeta(null);
      setError(err instanceof Error ? err.message : '翻译失败。');
    }
  };

  directionHuman.addEventListener('click', () => {
    direction = 'human-to-cat';
    renderDirection();
  });

  directionCat.addEventListener('click', () => {
    direction = 'cat-to-human';
    renderDirection();
  });

  translate.addEventListener('click', () => {
    void runTranslate();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    setMeta(null);
    setError(null);
  });

  sample.addEventListener('click', () => {
    void service.sample().then((result) => {
      input.value = result.text;
      setError(null);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : '示例加载失败。');
    });
  });

  copy.addEventListener('click', () => {
    void navigator.clipboard.writeText(output.value).then(() => {
      copy.textContent = '已复制';
      if (copyResetTimer !== null) {
        window.clearTimeout(copyResetTimer);
      }
      copyResetTimer = window.setTimeout(() => {
        copy.textContent = '复制';
        copyResetTimer = null;
      }, 1200);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : '复制失败。');
    });
  });

  renderDirection();

  try {
    const ready = await service.ready();
    status.textContent = `就绪：${ready.codecs.map((codec) => codec.name).join(' / ')}`;
    translate.disabled = false;
  } catch (err) {
    status.textContent = '运行时不可用';
    setError(err instanceof Error ? err.message : '运行时初始化失败。');
    translate.disabled = true;
  }
}
