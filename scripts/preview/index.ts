import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import path from 'node:path';
import { basePath } from '../../config/basePath.ts';
import { ROOT_DIR } from '../lib/content-files.ts';

// npm run preview: serves the last build (build/client/) the way GitHub Pages
// will, so it can be checked before deploying:
// - under the base path (BASE_PATH must match the build)
// - "/resume/" serves resume/index.html, and "/resume" redirects to "/resume/"
// - unknown addresses get 404.html with a 404 status
// - videos support range requests (Safari won't play them otherwise)

const OUT = path.join(ROOT_DIR, 'build/client');
const PORT = Number(process.env.PORT ?? 4173);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.data': 'text/x-script',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

if (!existsSync(OUT)) {
  console.error('No build found. Run `npm run build` first (with the same BASE_PATH).');
  process.exit(1);
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  if (!pathname.startsWith(basePath)) {
    response.writeHead(302, { Location: basePath }).end();
    return;
  }
  pathname = pathname.slice(basePath.length - 1);

  let file = path.join(OUT, pathname);
  if (!file.startsWith(OUT)) return send404(response); // no escaping the folder
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) {
      response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }
    file = path.join(file, 'index.html');
  }
  if (!existsSync(file)) return send404(response);

  const size = statSync(file).size;
  const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.range ?? '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : size - 1;
    response.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': end - start + 1,
      'Accept-Ranges': 'bytes',
    });
    createReadStream(file, { start, end }).pipe(response);
    return;
  }
  response.writeHead(200, {
    'Content-Type': type,
    'Content-Length': size,
    'Accept-Ranges': 'bytes',
  });
  createReadStream(file).pipe(response);
}).listen(PORT, () => {
  console.log(`Previewing build/client/ at http://localhost:${PORT}${basePath}`);
});

function send404(response: ServerResponse) {
  const page = path.join(OUT, '404.html');
  response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  if (existsSync(page)) createReadStream(page).pipe(response);
  else response.end('Not found');
}
