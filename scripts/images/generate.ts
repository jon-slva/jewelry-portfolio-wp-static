import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  ANIMATED_WIDTHS,
  FALLBACK_WIDTH,
  IMAGE_WIDTHS,
  variantWidths,
  type ImageInfo,
} from '../../src/content/media.ts';

// Builds the web-ready copies of one original image with sharp.

const WEBP_QUALITY = 80;
const JPEG_QUALITY = 80;

/**
 * Writes WebP copies (one per width) and one JPEG fallback for an original.
 *
 * @param sourceFile  absolute path of the original
 * @param outputBase  public URL path without extension, e.g. "img/ring/front"
 * @param publicDir   absolute path of public/
 */
export async function generateImage(
  sourceFile: string,
  outputBase: string,
  publicDir: string,
  hash: string,
): Promise<ImageInfo> {
  // `animated: true` reads every frame of a GIF / animated WebP.
  const meta = await sharp(sourceFile, { animated: true }).metadata();
  const animated = (meta.pages ?? 1) > 1;
  // Camera orientations 5-8 are rotated 90°, so width and height swap once applied.
  const rotated = (meta.orientation ?? 1) >= 5;
  const storedWidth = meta.width ?? 0;
  const storedHeight = meta.pageHeight ?? meta.height ?? 0;
  const width = rotated ? storedHeight : storedWidth;
  const height = rotated ? storedWidth : storedHeight;

  await mkdir(path.dirname(path.join(publicDir, outputBase)), { recursive: true });

  const webp = [];
  for (const variantWidth of variantWidths(width, animated ? ANIMATED_WIDTHS : IMAGE_WIDTHS)) {
    const url = `${outputBase}-${variantWidth}.webp`;
    await sharp(sourceFile, { animated })
      .rotate() // apply the camera's orientation flag, if any
      .resize({ width: variantWidth })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(publicDir, url));
    webp.push({ width: variantWidth, url });
  }

  // First frame only. Transparent areas (none in the current images) become black, like the site.
  const fallback = `${outputBase}.jpg`;
  await sharp(sourceFile, { pages: 1 })
    .rotate()
    .resize({ width: Math.min(FALLBACK_WIDTH, width) })
    .flatten({ background: '#000' })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(path.join(publicDir, fallback));

  const { dominant } = await sharp(sourceFile, { pages: 1 }).stats();
  const color = `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;

  return { width, height, color, animated, webp, fallback, hash };
}
