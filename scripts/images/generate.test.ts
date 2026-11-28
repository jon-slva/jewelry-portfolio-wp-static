import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generateImage } from './generate.ts';

// Runs sharp for real on small images it creates itself, in a temp folder.

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'images-test-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('generateImage', () => {
  it('writes WebP sizes up to the original width, a JPEG fallback and the main color', async () => {
    const source = path.join(dir, 'red.png');
    await sharp({ create: { width: 1000, height: 500, channels: 3, background: '#cc0000' } })
      .png()
      .toFile(source);

    const info = await generateImage(source, 'img/test/red', dir, 'abc');

    expect(info).toMatchObject({ width: 1000, height: 500, animated: false, hash: 'abc' });
    expect(info.webp.map((v) => v.width)).toEqual([400, 800, 1000]);
    expect(info.fallback).toBe('img/test/red.jpg');
    // sharp rounds the main color to a palette, so just check it's clearly red.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(info.color.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(150);
    expect(Math.max(g, b)).toBeLessThan(50);
    for (const url of [info.fallback, ...info.webp.map((v) => v.url)]) {
      expect(existsSync(path.join(dir, url))).toBe(true);
    }
    expect((await sharp(path.join(dir, 'img/test/red-400.webp')).metadata()).width).toBe(400);
  });

  it('keeps animation and uses the smaller set of sizes for animated images', async () => {
    // Two 900×300 frames joined into an animated GIF.
    const frame = (background: string) =>
      sharp({ create: { width: 900, height: 300, channels: 3, background } })
        .png()
        .toBuffer();
    const source = path.join(dir, 'anim.gif');
    await sharp([await frame('#f00'), await frame('#00f')], { join: { animated: true } })
      .gif()
      .toFile(source);

    const info = await generateImage(source, 'img/test/anim', dir, 'def');

    expect(info).toMatchObject({ width: 900, height: 300, animated: true });
    expect(info.webp.map((v) => v.width)).toEqual([400, 800]);
    const output = await sharp(path.join(dir, 'img/test/anim-800.webp'), {
      animated: true,
    }).metadata();
    expect(output.pages).toBe(2);
  });
});
