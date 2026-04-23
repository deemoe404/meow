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
    case 2:
      return 'cmix';
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
    <section class="page-shell">
      <header class="hero">
        <div class="hero__badge">nya58-zh2</div>
        <h1>猫语翻译器</h1>
        <p>把任意 Unicode 文本编码成严格可逆的猫语串。</p>
      </header>

      <main class="translator-card">
        <section class="panel">
          <div class="panel__heading">
            <h2>输入区</h2>
          </div>
          <textarea
            data-role="input"
            rows="8"
            placeholder="输入人话或猫语"
          ></textarea>
          <div class="panel__actions">
            <button type="button" data-role="direction-human">人话 -> 猫语</button>
            <button type="button" data-role="direction-cat">猫语 -> 人话</button>
          </div>
        </section>

        <section class="panel panel--result">
          <div class="panel__heading">
            <h2>输出区</h2>
            <button type="button" data-role="copy">复制结果</button>
          </div>
          <textarea data-role="output" rows="8" readonly></textarea>
          <div class="panel__actions">
            <button type="button" data-role="translate">开始翻译</button>
            <button type="button" data-role="clear">清空输入</button>
            <button type="button" data-role="sample">随机示例</button>
          </div>
        </section>

        <p class="status" data-role="status">正在初始化运行时…</p>
        <p class="error" data-role="error" hidden></p>

        <details class="protocol-summary" open>
          <summary>协议摘要</summary>
          <p>UTF-8 原文 -> raw/zstd-dict -> frame -> base58 digit -> 58-token 猫语表。</p>
          <pre data-role="meta">等待首个翻译结果…</pre>
        </details>
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
  const meta = root.querySelector<HTMLElement>('[data-role="meta"]');

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
    !meta
  ) {
    throw new Error('app DOM 初始化失败');
  }

  let direction: Direction = 'human-to-cat';
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
    if (!result) {
      meta.textContent = '等待首个翻译结果…';
      return;
    }

    meta.textContent = [
      `codec: ${codecName(result.meta.codec)}`,
      `rawLength: ${result.meta.rawLength}`,
      `tokenCount: ${result.meta.tokenCount}`,
    ].join('\n');
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
    void navigator.clipboard.writeText(output.value).catch((err) => {
      setError(err instanceof Error ? err.message : '复制失败。');
    });
  });

  renderDirection();

  try {
    const ready = await service.ready();
    status.textContent = `运行时就绪：${ready.codecs.map((codec) => codec.name).join(' / ')}`;
    translate.disabled = false;
  } catch (err) {
    status.textContent = '运行时不可用';
    setError(err instanceof Error ? err.message : '运行时初始化失败。');
    translate.disabled = true;
  }
}
