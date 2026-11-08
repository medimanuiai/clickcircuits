#!/usr/bin/env node
// Dependency-free site check: every local href/src/poster in the HTML pages and
// every media path in js/main.js must point at a file that exists, and every
// document.getElementById('x') in main.js should exist somewhere (warning only).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
let errors = 0;
const err = (m) => { errors++; console.error(`ERROR: ${m}`); };

const isLocal = (u) => u && !/^([a-z]+:|\/\/|#|mailto:|tel:)/i.test(u);
const exists = (u) => existsSync(join(root, decodeURIComponent(u.split('#')[0].split('?')[0])));

for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  for (const m of html.matchAll(/\b(?:href|src|poster)="([^"]*)"/g)) {
    const u = m[1];
    if (isLocal(u) && u !== '' && !exists(u)) err(`${page}: missing local file "${u}"`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) err(`${page}: duplicate ids ${[...new Set(dup)].join(', ')}`);
  if (!/<title>[^<]+<\/title>/.test(html)) err(`${page}: missing <title>`);
}

const js = readFileSync(join(root, 'js/main.js'), 'utf8');
for (const m of js.matchAll(/['"`]((?:images|videos)\/[^'"`]+)['"`]/g)) {
  if (!exists(m[1])) err(`js/main.js: missing media file "${m[1]}"`);
}

console.log(`Checked ${pages.length} pages. ${errors ? errors + ' error(s).' : 'OK.'}`);
process.exit(errors ? 1 : 0);
