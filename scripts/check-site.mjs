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
  if (!/<meta name="description" content="[^"]+"/.test(html)) err(`${page}: missing meta description`);
  if (!/<link rel="canonical" href="https:\/\/clickcircuits\.org\//.test(html)) err(`${page}: missing canonical link`);
  if (/[\u2014\u2013]/.test(html)) err(`${page}: contains an em or en dash`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) err(`${page}: image without alt text: ${m[0].slice(0, 70)}`);
  }
  const h1s = (html.match(/<h1\b/g) || []).length;
  if (h1s !== 1) err(`${page}: expected exactly one <h1>, found ${h1s}`);
  // Search engines and browsers pick up the site icon from these links.
  if (!/<link rel="icon" href="\/favicon\.ico"/.test(html)) err(`${page}: missing /favicon.ico icon link`);
  if (!/<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/.test(html)) err(`${page}: missing apple-touch-icon link`);
}

// Icon files must exist at the site root (Google looks for a square icon of at least 48x48).
for (const f of ['favicon.ico', 'favicon.svg', 'favicon-48.png', 'favicon-192.png', 'apple-touch-icon.png', 'site.webmanifest']) {
  if (!existsSync(join(root, f))) err(`missing icon file ${f}`);
}

// Every page should be listed in sitemap.xml.
if (existsSync(join(root, 'sitemap.xml'))) {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  for (const page of pages) {
    const loc = page === 'index.html' ? 'https://clickcircuits.org/<' : `https://clickcircuits.org/${page}<`;
    if (!sitemap.includes(loc)) err(`sitemap.xml: missing ${page}`);
  }
}

const js = readFileSync(join(root, 'js/main.js'), 'utf8');
if (/[\u2014\u2013]/.test(js)) err('js/main.js: contains an em or en dash');
for (const m of js.matchAll(/['"`]((?:images|videos)\/[^'"`]+)['"`]/g)) {
  if (!exists(m[1])) err(`js/main.js: missing media file "${m[1]}"`);
}

console.log(`Checked ${pages.length} pages. ${errors ? errors + ' error(s).' : 'OK.'}`);
process.exit(errors ? 1 : 0);
