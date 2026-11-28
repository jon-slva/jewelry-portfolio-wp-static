import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { CONTENT_DIR } from '../lib/content-files.ts';

// Turns an animated GIF into a looping MP4 (usually 5-6× smaller at the same
// look) plus a still poster image of its first frame.
//
//   npm run gif-to-video -- media/<slug>/<name>.gif
//   npm run gif-to-video -- media/<slug>/<name>.gif --width 400   (smaller copy, e.g. for a grid tile)
//
// Writes media/<slug>/<name>.mp4 and media/<slug>/<name>-poster.jpg next to
// the GIF. Then replace the GIF in the item file with a "video" entry (printed
// below) and delete the GIF. Needs ffmpeg (macOS: `brew install ffmpeg`); the
// site build itself doesn't.

/** H.264 quality: lower is better and bigger. 26 looked identical to the GIFs at a quarter of the size of 20. */
const CRF = '26';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { width: { type: 'string' } },
});
const contentPath = positionals[0];
if (!contentPath?.endsWith('.gif'))
  fail('Pass the GIF to convert, e.g. media/my-ring/turnaround.gif');

const source = path.join(CONTENT_DIR, contentPath);
if (!existsSync(source)) fail(`Not found: src/content/${contentPath}`);
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  fail('ffmpeg is needed for this. On macOS: brew install ffmpeg');
}

const base = contentPath.replace(/\.gif$/, '');
const videoPath = `${base}.mp4`;
const posterPath = `${base}-poster.jpg`;

// Video dimensions must be even numbers for H.264.
const scale = values.width
  ? `scale=${Number(values.width)}:-2`
  : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
execFileSync('ffmpeg', [
  '-y',
  '-loglevel', 'error',
  '-i', source,
  '-an', // no audio track
  '-vf', scale,
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', CRF,
  '-pix_fmt', 'yuv420p', // the pixel format every browser can play
  '-movflags', '+faststart', // metadata first, so playback starts before the whole file arrives
  path.join(CONTENT_DIR, videoPath),
]); // prettier-ignore

await sharp(source, { pages: 1 }).jpeg({ quality: 90 }).toFile(path.join(CONTENT_DIR, posterPath));

const megabytes = (file: string) =>
  `${(statSync(path.join(CONTENT_DIR, file)).size / 1024 / 1024).toFixed(2)} MB`;
console.log(`GIF    ${contentPath}  ${megabytes(contentPath)}`);
console.log(`Video  ${videoPath}  ${megabytes(videoPath)}`);
console.log(`Poster ${posterPath}  ${megabytes(posterPath)}`);
console.log('\nIn the item file, replace the GIF entry with:');
console.log(
  JSON.stringify(
    { type: 'video', file: videoPath, poster: posterPath, alt: '', size: 'normal' },
    null,
    2,
  ),
);
console.log('or, for a grid tile, set "coverVideo" to the video and "cover" to the poster.');

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
