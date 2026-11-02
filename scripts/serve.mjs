// scripts/serve.mjs — a tiny, dependency-free static file server for local development.
// Works the same on Windows, macOS and Linux (needs Node 18+). Usage: `npm start`
// Optional: PORT=3000 npm start  (PowerShell: $env:PORT=3000; npm start)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { urlPath = '/'; }
  const file = path.resolve(ROOT, '.' + (urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath));
  const inside = file === ROOT || file.startsWith(ROOT + path.sep);
  if (!inside || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Offer Engineering running at http://localhost:${PORT}/  (Ctrl+C to stop)`));
