import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '..');
const publicRoot = resolve(projectRoot, 'public');

function pngDimensions(path: string): { width: number; height: number } {
  const data = readFileSync(path);
  expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

function meta(document: Document, key: string): string | null {
  return document
    .querySelector(`meta[property="${key}"], meta[name="${key}"]`)
    ?.getAttribute('content') ?? null;
}

describe('site metadata', () => {
  const html = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');
  const document = new DOMParser().parseFromString(html, 'text/html');

  test('declares canonical social preview metadata', () => {
    expect(document.querySelector('title')?.textContent).toBe('喵在说啥 | 可逆猫语翻译器');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://meow.dee.moe/',
    );
    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg');
    expect(document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe(
      '/apple-touch-icon.png',
    );
    expect(document.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe(
      '/site.webmanifest',
    );
    expect(meta(document, 'theme-color')).toBe('#fcfbf9');

    expect(meta(document, 'description')).toBe(
      '把人话变成可复制、可还原的猫语，也能一键翻回来。',
    );
    expect(meta(document, 'og:site_name')).toBe('喵在说啥');
    expect(meta(document, 'og:type')).toBe('website');
    expect(meta(document, 'og:locale')).toBe('zh_CN');
    expect(meta(document, 'og:url')).toBe('https://meow.dee.moe/');
    expect(meta(document, 'og:title')).toBe('喵在说啥 | 可逆猫语翻译器');
    expect(meta(document, 'og:description')).toBe(
      '把人话变成可复制、可还原的猫语，也能一键翻回来。',
    );
    expect(meta(document, 'og:image')).toBe('https://meow.dee.moe/og-image-v2.png');
    expect(meta(document, 'og:image:type')).toBe('image/png');
    expect(meta(document, 'og:image:width')).toBe('1200');
    expect(meta(document, 'og:image:height')).toBe('630');
    expect(meta(document, 'og:image:alt')).toBe('喵在说啥，可逆猫语翻译器');
    expect(meta(document, 'twitter:card')).toBe('summary_large_image');
    expect(meta(document, 'twitter:title')).toBe('喵在说啥 | 可逆猫语翻译器');
    expect(meta(document, 'twitter:description')).toBe(
      '把人话变成可复制、可还原的猫语，也能一键翻回来。',
    );
    expect(meta(document, 'twitter:image')).toBe('https://meow.dee.moe/og-image-v2.png');
    expect(meta(document, 'twitter:image:alt')).toBe('喵在说啥，可逆猫语翻译器');
  });

  test('ships social preview assets with expected dimensions', () => {
    expect(pngDimensions(resolve(publicRoot, 'og-image-v2.png'))).toEqual({
      width: 1200,
      height: 630,
    });
    expect(pngDimensions(resolve(publicRoot, 'apple-touch-icon.png'))).toEqual({
      width: 180,
      height: 180,
    });
    expect(pngDimensions(resolve(publicRoot, 'web-app-icon-192.png'))).toEqual({
      width: 192,
      height: 192,
    });
    expect(pngDimensions(resolve(publicRoot, 'web-app-icon-512.png'))).toEqual({
      width: 512,
      height: 512,
    });
    expect(readFileSync(resolve(publicRoot, 'favicon.svg'), 'utf8')).toContain('<svg');
    expect(JSON.parse(readFileSync(resolve(publicRoot, 'site.webmanifest'), 'utf8'))).toMatchObject({
      name: '喵在说啥',
      short_name: '喵在说啥',
    });
  });

  test('keeps generated social preview copy readable at link-card size', () => {
    const generator = readFileSync(resolve(projectRoot, 'scripts/generate_social_assets.swift'), 'utf8');

    expect(generator).toContain('og-image-v2.png');
    expect(generator).toContain('可逆猫语翻译器');
    expect(generator).not.toContain('把一句话变成可复制、可分享、可还原的猫语。');
    expect(generator).not.toContain('喵 嗷 呜 叭 呼 咕...');
    expect(generator).not.toContain('open the translator');
    expect(generator).not.toContain('nya128-zh9');
  });
});
