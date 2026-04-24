# Pebble Console UI Design

## Context

The product is the `nya128-zh9` cat-language translator: a static browser app that reversibly encodes arbitrary Unicode text into a fixed 128-token cat-language protocol and decodes it back locally. The redesign should keep the app useful as a tool first. It should feel cartoon-cute and lightly Japanese, but still sparse, cold, and product-grade.

The selected direction is **A. Pebble Console**.

## Visual Thesis

Use a cold paper surface, deep ink-blue controls, and low-saturation sage and mist-pink accents. Express playfulness through slightly irregular pebble-like silhouettes on a few important surfaces, not through extra mascots, decorative clutter, or bright toy colors.

## Product Shape

The first screen is the translator workspace. There is no marketing hero. Users should immediately see where to paste text, where the result appears, how to switch direction, how to translate, and how to copy the output.

Primary structure:

- Compact top bar with product name, protocol badge, and runtime readiness.
- Two-column workbench on desktop: input on the left, output on the right.
- Single-column stacked workbench on mobile.
- Direction switch near the main action, with `人话 -> 猫语` and `猫语 -> 人话`.
- Primary translate action, secondary copy, clear, and sample actions.
- Compact protocol status area showing codec, raw length, and token count after a result.

## Component Design

### Top Bar

The top bar should be quiet and functional:

- `猫语翻译器` is the main label.
- `nya128-zh9` appears as a protocol chip.
- Runtime readiness appears as short utility text, for example `raw / zstd-dict ready`.

Do not use a large cat illustration in the top bar. A small irregular brand mark or text glyph is acceptable if it does not compete with the workspace.

### Workbench Panels

The input and output panels are the main visual mass. Their outer shells may use a subtle irregular polygon or large-radius asymmetric shape, like a polished pebble. The textarea itself should remain rectangular enough to preserve readability and selection behavior.

Panel requirements:

- Clear headings: `输入` and `输出`.
- Large textareas with stable height.
- No nested card stacks.
- No heavy borders around every child element.
- Empty output should show a restrained placeholder, not an illustration-heavy empty state.

### Actions

Use one deep ink-blue primary action for translation. Secondary actions should be quiet text or low-contrast buttons.

Shape rules:

- Primary and segmented buttons may use pebble contours.
- Avoid standard pills as the dominant shape.
- Avoid perfect circles unless used only for a tiny status dot.
- Hover should lift by 1-2 px and slightly sharpen contrast.

### Protocol Status

The current `details` block should become a compact status/readout area that supports trust without dominating the UI.

It should show:

- `codec`
- `tokenCount`

The full protocol summary can remain collapsible, but it should sit below the main workflow and default to visually quiet.

## Visual System

Palette:

- Background: cold off-white paper, not warm cream.
- Ink: deep blue-black.
- Accent: muted sage or blue-gray.
- Soft accent: mist pink used sparingly.
- Error: restrained red with clear contrast.

Typography:

- Use a modern sans-serif stack for the interface.
- Avoid making the whole app handwritten or calligraphic.
- Keep Chinese readable and aligned with the product-tool feel.

Shape:

- Use `clip-path` or border-radius asymmetry only on outer shells and buttons.
- Keep text input content areas predictable.
- Keep all tap targets at least 44 px high.

Motion:

- On load: subtle entrance for top bar and workbench panels.
- On hover: small lift and shadow change for actionable controls.
- On successful copy: short state feedback on the copy button text.

Motion must stay fast and restrained. No bouncing, wiggle loops, or decorative animation.

## Responsive Behavior

Desktop:

- Top bar stays compact.
- Input and output panels sit side by side.
- Protocol status is aligned under the output/actions area or spans the lower workbench depending on available width.

Mobile:

- Workbench stacks input, actions, then output.
- Buttons wrap without overlapping text.
- Long Chinese labels must remain readable.
- The page should not require horizontal scrolling.

## Error And Loading States

Runtime initialization:

- Disable the translate action until ready.
- Show one short readiness line.

Translation errors:

- Keep output empty.
- Show a concise error message near the actions or status row.
- Do not use cute failure copy that obscures the problem.

Clipboard errors:

- Keep the existing result.
- Show a concise error message.

## Testing And Verification

Implementation should keep existing protocol and worker behavior unchanged.

Required checks:

- Unit tests continue to pass with `pnpm test`.
- TypeScript/build check passes with `pnpm build`.
- Browser verification at desktop and mobile widths confirms:
  - The first screen is the usable translator.
  - Text does not overflow buttons or panels.
  - Input/output panels remain readable.
  - Runtime, error, copy, sample, and direction controls are reachable.

## Non-Goals

- No new protocol behavior.
- No new backend.
- No mascot-heavy redesign.
- No marketing-first landing page.
- No dense dashboard card grid.
