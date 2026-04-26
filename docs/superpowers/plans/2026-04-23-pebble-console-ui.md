# Pebble Console UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current warm, rounded cat-themed translator page with the approved Pebble Console tool-first UI.

**Architecture:** Keep the protocol, worker, and service interfaces unchanged. Rework only the rendered DOM, interaction state feedback, CSS visual system, and focused UI tests so the first screen is a compact two-pane translator workbench with restrained pebble-shaped controls and status readouts.

**Tech Stack:** Vite, TypeScript, DOM APIs, CSS, Vitest, jsdom.

---

## File Structure

- Modify `src/ui/app.ts`: Update static markup, metadata rendering, copy feedback, and selectors while preserving the existing `AppService` API and translation flow.
- Modify `src/style.css`: Replace the warm card/hero design with the Pebble Console visual system, responsive workbench layout, pebble contours, motion, and compact status styling.
- Modify `tests/ui/app.test.ts`: Update tests for the new labels, runtime/status presentation, direction controls, copy feedback, and existing behavior.
- Read `docs/superpowers/specs/2026-04-23-pebble-console-ui-design.md`: Treat it as the source of truth for UI intent.

## Task 1: Rework App Markup And State Feedback

**Files:**
- Modify: `src/ui/app.ts`
- Test: `tests/ui/app.test.ts`

- [ ] **Step 1: Inspect current UI tests**

Run:

```bash
sed -n '1,260p' tests/ui/app.test.ts
```

Expected: tests reference current heading/action labels such as `输入区`, `输出区`, `开始翻译`, `复制结果`, `随机示例`, and runtime status text.

- [ ] **Step 2: Write failing tests for Pebble Console DOM**

Edit `tests/ui/app.test.ts` so the first render test expects:

```ts
expect(screen.getByRole('heading', { name: '猫语翻译器' })).toBeTruthy();
expect(screen.getByText('nya171-zh12')).toBeTruthy();
expect(screen.getByText(/本地可逆编码/)).toBeTruthy();
expect(screen.getByRole('heading', { name: '输入' })).toBeTruthy();
expect(screen.getByRole('heading', { name: '输出' })).toBeTruthy();
expect(screen.getByRole('button', { name: '翻译' })).toBeTruthy();
expect(screen.getByRole('button', { name: '复制' })).toBeTruthy();
expect(screen.getByRole('button', { name: '清空' })).toBeTruthy();
expect(screen.getByRole('button', { name: '示例' })).toBeTruthy();
expect(screen.getByText('codec')).toBeTruthy();
expect(screen.getByText('tokenCount')).toBeTruthy();
```

Also update direction button queries to:

```ts
const humanButton = screen.getByRole('button', { name: '人话 -> 猫语' });
const catButton = screen.getByRole('button', { name: '猫语 -> 人话' });
```

Add a copy-feedback test:

```ts
it('shows short feedback after copying output', async () => {
  const service = createService();
  await createTranslatorApp(root, service);
  await flushReady();

  const input = screen.getByLabelText('输入文本') as HTMLTextAreaElement;
  const translate = screen.getByRole('button', { name: '翻译' });
  input.value = 'hello';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  translate.click();
  await flushPromises();

  screen.getByRole('button', { name: '复制' }).click();
  await flushPromises();

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('encoded-cat');
  expect(screen.getByRole('button', { name: '已复制' })).toBeTruthy();
});
```

- [ ] **Step 3: Run UI tests to verify failure**

Run:

```bash
pnpm vitest run tests/ui/app.test.ts
```

Expected: FAIL because the new headings, labels, status labels, and copy feedback have not been implemented.

- [ ] **Step 4: Replace `root.innerHTML` with Pebble Console structure**

In `src/ui/app.ts`, replace the current HTML template inside `createTranslatorApp` with:

```ts
root.innerHTML = `
  <section class="app-shell" aria-labelledby="app-title">
    <header class="top-bar">
      <div class="brand-lockup">
        <span class="brand-mark" aria-hidden="true">nya</span>
        <div>
          <h1 id="app-title">猫语翻译器</h1>
          <p>本地可逆编码，把 Unicode 文本转换成 nya171-zh12 猫语串。</p>
        </div>
      </div>
      <div class="runtime-cluster" aria-live="polite">
        <span class="protocol-chip">nya171-zh12</span>
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
          <p>UTF-8 原文 -> raw/zstd-dict -> frame -> base171 digit -> 171-token 猫语表。</p>
        </details>
      </section>
    </main>
  </section>
`;
```

- [ ] **Step 5: Update DOM queries and meta rendering**

In `src/ui/app.ts`, replace the old `meta` element query with two metric queries:

```ts
const metaCodec = root.querySelector<HTMLElement>('[data-role="meta-codec"]');
const metaTokenCount = root.querySelector<HTMLElement>('[data-role="meta-token-count"]');
```

Update the null-check block to require `metaCodec` and `metaTokenCount` instead of `meta`.

Replace `setMeta` with:

```ts
const setMeta = (result: EncodeResult | DecodeResult | null) => {
  metaCodec.textContent = result ? codecName(result.meta.codec) : '-';
  metaTokenCount.textContent = result ? String(result.meta.tokenCount) : '-';
};
```

- [ ] **Step 6: Update copy feedback**

In `src/ui/app.ts`, update the copy click handler to:

```ts
copy.addEventListener('click', () => {
  void navigator.clipboard.writeText(output.value).then(() => {
    copy.textContent = '已复制';
    window.setTimeout(() => {
      copy.textContent = '复制';
    }, 1200);
  }).catch((err) => {
    setError(err instanceof Error ? err.message : '复制失败。');
  });
});
```

- [ ] **Step 7: Update runtime status copy**

In `src/ui/app.ts`, replace the success status assignment with:

```ts
status.textContent = `就绪：${ready.codecs.map((codec) => codec.name).join(' / ')}`;
```

Keep failure status concise:

```ts
status.textContent = '运行时不可用';
```

- [ ] **Step 8: Run UI tests**

Run:

```bash
pnpm vitest run tests/ui/app.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit markup and test changes**

Run:

```bash
git add src/ui/app.ts tests/ui/app.test.ts
git commit -m "feat: rework translator console markup"
```

Expected: commit succeeds.

## Task 2: Implement Pebble Console Styling

**Files:**
- Modify: `src/style.css`
- Test: `tests/ui/app.test.ts`

- [ ] **Step 1: Run current UI tests before styling**

Run:

```bash
pnpm vitest run tests/ui/app.test.ts
```

Expected: PASS from Task 1.

- [ ] **Step 2: Replace CSS variables and global surface**

In `src/style.css`, replace the existing warm variables and body background with a cold paper palette:

```css
:root {
  --paper: #f7f8f4;
  --paper-strong: #fffefa;
  --ink: #172033;
  --ink-soft: #34415b;
  --muted: #6a7280;
  --line: rgba(23, 32, 51, 0.13);
  --line-strong: rgba(23, 32, 51, 0.22);
  --sage: #dce7df;
  --sage-strong: #9cafaa;
  --mist: #eadfe1;
  --primary: #22314d;
  --primary-hover: #17243b;
  --danger: #a44747;
  --shadow: 0 24px 80px rgba(23, 32, 51, 0.12);
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: var(--ink);
  background: var(--paper);
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  background:
    linear-gradient(120deg, rgba(220, 231, 223, 0.46), transparent 34%),
    linear-gradient(300deg, rgba(234, 223, 225, 0.42), transparent 30%),
    var(--paper);
}
```

- [ ] **Step 3: Add layout styles**

Replace `.page-shell`, `.hero`, `.translator-card`, `.panel`, `.protocol-summary`, and related old rules with:

```css
.app-shell {
  width: min(1180px, calc(100vw - 32px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 28px 0 40px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 78px;
  animation: rise-in 420ms var(--ease) both;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  width: 54px;
  height: 46px;
  place-items: center;
  flex: 0 0 auto;
  color: #fff;
  background: var(--primary);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  clip-path: polygon(12% 8%, 48% 0, 92% 12%, 100% 58%, 78% 100%, 24% 90%, 0 56%);
}

.brand-lockup h1 {
  margin: 0;
  font-size: clamp(1.7rem, 4vw, 3rem);
  line-height: 1;
  letter-spacing: 0;
}

.brand-lockup p {
  margin: 8px 0 0;
  max-width: 34rem;
  color: var(--muted);
  line-height: 1.5;
}

.runtime-cluster {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 0.92rem;
}

.protocol-chip {
  min-height: 34px;
  padding: 8px 13px;
  color: var(--primary);
  background: rgba(255, 254, 250, 0.76);
  border: 1px solid var(--line);
  clip-path: polygon(7% 0, 100% 8%, 93% 100%, 0 88%);
}

.workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas:
    "input output"
    "status status";
  gap: 18px;
  margin-top: 24px;
}
```

- [ ] **Step 4: Add panel and textarea styles**

Append:

```css
.pebble-panel {
  position: relative;
  min-width: 0;
  padding: 22px;
  background: rgba(255, 254, 250, 0.88);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  animation: rise-in 520ms var(--ease) both;
}

.pebble-panel--input {
  grid-area: input;
  clip-path: polygon(1.5% 0, 97% 2%, 100% 92%, 94% 100%, 0 97%, 0 8%);
}

.pebble-panel--output {
  grid-area: output;
  clip-path: polygon(3% 2%, 100% 0, 98% 96%, 88% 100%, 0 94%, 1% 6%);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.eyebrow {
  margin: 0 0 5px;
  color: var(--sage-strong);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: 0;
}

.pebble-panel textarea {
  width: 100%;
  min-height: 280px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  outline: none;
  resize: vertical;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  line-height: 1.65;
}

.pebble-panel textarea:focus {
  border-color: var(--line-strong);
  box-shadow: 0 0 0 4px rgba(156, 175, 170, 0.18);
}
```

- [ ] **Step 5: Add action, status, responsive, and motion styles**

Append:

```css
.direction-switch,
.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.direction-switch {
  padding: 4px;
  background: rgba(220, 231, 223, 0.55);
  clip-path: polygon(3% 0, 100% 8%, 96% 100%, 0 90%);
}

.direction-switch button,
.secondary-action,
.primary-action {
  min-height: 44px;
  border: 0;
  transition: transform 160ms var(--ease), box-shadow 160ms var(--ease), background 160ms var(--ease), color 160ms var(--ease);
}

.direction-switch button,
.secondary-action {
  padding: 10px 15px;
  color: var(--ink-soft);
  background: transparent;
  clip-path: polygon(8% 0, 100% 12%, 92% 100%, 0 86%);
}

.direction-switch button.is-active,
.primary-action {
  color: #fff;
  background: var(--primary);
  box-shadow: 0 14px 34px rgba(34, 49, 77, 0.18);
}

.primary-action {
  min-width: 132px;
  padding: 12px 22px;
  font-weight: 800;
  clip-path: polygon(7% 0, 96% 7%, 100% 64%, 84% 100%, 9% 92%, 0 38%);
}

.copy-action {
  background: rgba(220, 231, 223, 0.68);
}

.direction-switch button:hover,
.secondary-action:hover,
.primary-action:hover {
  transform: translateY(-1px);
}

.primary-action:hover {
  background: var(--primary-hover);
}

.protocol-strip {
  grid-area: status;
  display: grid;
  grid-template-columns: repeat(3, minmax(110px, 1fr)) minmax(220px, 1.4fr);
  gap: 12px;
  align-items: stretch;
  padding: 14px;
  background: rgba(255, 254, 250, 0.58);
  border: 1px solid var(--line);
  clip-path: polygon(1% 0, 99% 4%, 100% 92%, 94% 100%, 0 96%, 0 8%);
}

.metric,
.protocol-details {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.58);
}

.metric span {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 0.76rem;
}

.metric strong {
  font-size: 1rem;
  color: var(--ink);
}

.protocol-details summary {
  cursor: pointer;
  color: var(--ink-soft);
  font-weight: 800;
}

.protocol-details p {
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.status,
.error {
  margin: 14px 0 0;
  line-height: 1.5;
}

.runtime-status,
.status {
  color: var(--muted);
}

.error {
  color: var(--danger);
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 860px) {
  .app-shell {
    width: min(100vw - 24px, 680px);
    padding-top: 18px;
  }

  .top-bar,
  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .runtime-cluster {
    justify-content: flex-start;
  }

  .workbench {
    grid-template-columns: 1fr;
    grid-template-areas:
      "input"
      "output"
      "status";
  }

  .pebble-panel {
    padding: 18px;
    clip-path: none;
    border-radius: 18px;
  }

  .protocol-strip {
    grid-template-columns: 1fr;
    clip-path: none;
    border-radius: 18px;
  }
}
```

- [ ] **Step 6: Run UI tests after styling**

Run:

```bash
pnpm vitest run tests/ui/app.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit styling**

Run:

```bash
git add src/style.css
git commit -m "style: apply pebble console visual system"
```

Expected: commit succeeds.

## Task 3: Full Verification And Browser Review

**Files:**
- Modify only if verification reveals defects: `src/ui/app.ts`, `src/style.css`, `tests/ui/app.test.ts`

- [ ] **Step 1: Run full tests**

Run:

```bash
pnpm test
```

Expected: all Vitest suites pass.

- [ ] **Step 2: Run production build**

Run:

```bash
pnpm build
```

Expected: TypeScript build and Vite production build pass.

- [ ] **Step 3: Start local dev server**

Run:

```bash
pnpm dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: Verify desktop layout in browser**

Open the dev server URL at a desktop viewport around `1440x1000`.

Check:

- First screen is the usable translator workbench.
- Top bar is compact and not a marketing hero.
- Input and output panels sit side by side.
- Primary action uses a non-regular pebble shape.
- Button text does not overflow.
- Protocol strip is visually quiet.

- [ ] **Step 5: Verify mobile layout in browser**

Set viewport to around `390x844`.

Check:

- No horizontal scroll.
- Input, actions, output, and protocol status stack in that order.
- Direction buttons and action buttons wrap without overlap.
- Long Chinese labels remain readable.

- [ ] **Step 6: Verify translation flow manually**

In the browser:

1. Enter `你好，meow!`.
2. Click `翻译`.
3. Confirm output becomes a cat-language token string.
4. Confirm `codec` and `tokenCount` update.
5. Click `复制`.
6. Confirm the button briefly changes to `已复制`.
7. Switch to `猫语 -> 人话`.
8. Paste or keep the cat-language output in the input.
9. Click `翻译`.
10. Confirm decoded text is `你好，meow!`.

- [ ] **Step 7: Fix verification defects if found**

If a defect appears, make the smallest scoped change in the relevant file and rerun:

```bash
pnpm vitest run tests/ui/app.test.ts
pnpm test
pnpm build
```

Expected: all commands pass after the fix.

- [ ] **Step 8: Commit verification fixes if any**

Only if Step 7 changed files, run:

```bash
git add src/ui/app.ts src/style.css tests/ui/app.test.ts
git commit -m "fix: polish pebble console verification issues"
```

Expected: commit succeeds if there were fixes; otherwise skip this step.

## Self-Review

Spec coverage:

- Tool-first first screen: Task 1 markup and Task 2 layout.
- Compact top bar with name, protocol badge, and runtime: Task 1 Steps 4 and 7, Task 2 Step 3.
- Two-column desktop and one-column mobile: Task 2 Steps 3 and 5.
- Direction switch, translate, copy, clear, sample: Task 1 Steps 2 and 4.
- Compact protocol status: Task 1 Steps 4 and 5, Task 2 Step 5.
- Cold restrained visual system: Task 2 Steps 2-5.
- Copy feedback motion/state: Task 1 Step 6.
- Error/loading states: Task 1 Steps 4 and 7, existing `setError` flow retained.
- Verification: Task 3.

Placeholder scan: This plan intentionally contains no TBD/TODO/fill-in placeholders. The only optional path is verification-fix work that is explicitly gated on observed defects.

Type consistency: The plan keeps `AppService`, `EncodeResult`, `DecodeResult`, `Direction`, `setError`, and `buttonPressed` unchanged. New DOM roles are `meta-codec` and `meta-token-count`.
