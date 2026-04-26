import { afterEach, vi } from 'vitest';

afterEach(() => {
  document.body.innerHTML = '';
});

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    readText: vi.fn().mockResolvedValue(''),
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});
