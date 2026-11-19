import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative as relativePath, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const developerHome = fileURLToPath(new URL('../../home/index.html', import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const safeFile = (requestedPath) => {
  const file = resolve(root, requestedPath);
  const fromRoot = relativePath(root, file);
  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    throw new Error('forbidden');
  }
  return file;
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\\/+/, '');
    const isDeveloperHome = pathname === '/home' || pathname === '/home/';
    const candidates = pathname === '/manus-routes.json'
      ? ['public/manus-routes.json']
      : [relative, `public/${relative}`];
    let file;
    let body;
    if (isDeveloperHome) {
      file = developerHome;
      body = await readFile(developerHome);
    }
    for (const candidate of isDeveloperHome ? [] : candidates) {
      try {
        file = safeFile(candidate);
        body = await readFile(file);
        break;
      } catch {
        file = undefined;
      }
    }
    if (!file || !body) throw new Error('not found');
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => console.log(`OCODEJS CLI listening on 0.0.0.0:${port}`));
