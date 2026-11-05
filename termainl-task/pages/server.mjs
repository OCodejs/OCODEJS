import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.gif': 'image/gif' };

const safeFile = (relative) => {
  const file = normalize(join(root, relative));
  if (!file.startsWith(root)) throw new Error('forbidden');
  return file;
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const candidates = pathname === '/manus-routes.json'
      ? ['public/manus-routes.json']
      : [relative, `public/${relative}`];
    let file;
    let body;
    for (const candidate of candidates) {
      try {
        file = safeFile(candidate);
        body = await readFile(file);
        break;
      } catch {
        file = undefined;
      }
    }
    if (!file || !body) throw new Error('not found');
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => console.log(`OCODEJS CLI listening on 0.0.0.0:${port}`));
