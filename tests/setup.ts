import { afterEach, vi } from 'vitest';

afterEach(() => {
  document.body.innerHTML = '';
});

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});
