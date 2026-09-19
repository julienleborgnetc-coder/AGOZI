import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.name.startsWith('.') ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const pages = walk(root).filter(p => p.endsWith('.html'));
const localFile = pathname => path.join(root, pathname.endsWith('/') ? pathname + 'index.html' : pathname);

test('published pages preserve headings, canonical URLs and valid JSON-LD', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const headings = [...html.matchAll(/<h1(?:\s|>)/g)].length;
    // Existing bilingual legal/about pages contain one heading per language.
    assert.ok(headings >= 1, file);
    if (html.includes('<body class="home">')) assert.equal(headings, 1, file);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description"/);
    if (!file.endsWith('404.html')) {
      const route = '/' + path.relative(root, file).replace(/index\.html$/, '');
      assert.ok(html.includes('rel="canonical" href="https://www.agozi.eu' + route + '"'), file);
    }
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'duplicate IDs: ' + file);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
  }
});

test('local links, fragment targets, images and stylesheets resolve', () => {
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8');
    const route = '/' + path.relative(root, file).replace(/index\.html$/, '');
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(m[1], 'https://www.agozi.eu' + route);
      if (url.origin !== 'https://www.agozi.eu') continue;
      const target = localFile(url.pathname);
      assert.ok(fs.existsSync(target), file + ': ' + m[1]);
      if (url.hash && target.endsWith('.html')) {
        assert.ok(fs.readFileSync(target, 'utf8').includes('id="' + decodeURIComponent(url.hash.slice(1)) + '"'), file + ': missing fragment ' + m[1]);
      }
    }
  }
});

test('sitemap preserves thirteen canonical pages and language pairs', () => {
  const sitemap = read('sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(urls.length, 13);
  for (const url of urls) {
    assert.equal(new URL(url).origin, 'https://www.agozi.eu');
    assert.ok(fs.existsSync(localFile(new URL(url).pathname)), url);
  }
  for (const [fr, en] of [['', 'en/'], ['fonctionnement/', 'en/how-it-works/'], ['usages/entretien-maison/', 'en/use-cases/home-maintenance/'], ['usages/entretien-voiture/', 'en/use-cases/car-maintenance/']]) {
    for (const p of [fr, en]) {
      assert.ok(read(p + 'index.html').includes('hreflang="fr" href="https://www.agozi.eu/' + fr + '"'));
      assert.ok(read(p + 'index.html').includes('hreflang="en" href="https://www.agozi.eu/' + en + '"'));
    }
  }
  assert.match(read('robots.txt'), /Sitemap: https:\/\/www\.agozi\.eu\/sitemap\.xml/);
});

test('real screenshots, honest availability and self-hosted assets', () => {
  for (const p of ['index.html', 'en/index.html']) {
    const html = read(p);
    assert.equal([...html.matchAll(/class="screen-link"/g)].length, 3);
    assert.equal([...html.matchAll(/loading="lazy"/g)].length, 2);
    assert.equal([...html.matchAll(/fetchpriority="high"/g)].length, 1);
    assert.doesNotMatch(html, /mock-card|hero-logo|float-card|<span class="button/);
    for (const m of html.matchAll(/<img[^>]+>/g)) {
      assert.match(m[0], /alt="[^"]*"/);
      if (m[0].includes('/screenshots/')) assert.match(m[0], /width="709" height="1536"/);
    }
  }
  assert.match(read('index.html'), /Pas encore disponible publiquement/);
  assert.match(read('en/index.html'), /Not yet publicly available/);
  assert.match(read('en/index.html'), /Real app screenshot in French/);
  assert.match(read('assets/styles.css'), /prefers-reduced-motion/);
  assert.match(read('assets/styles.css'), /:focus-visible/);
  assert.match(read('assets/styles.css'), /font-display: swap/);
  assert.doesNotMatch(read('assets/styles.css'), /url\(["']?https?:/);
  assert.equal(fs.readFileSync(path.join(root, 'assets/fonts/InterVariable.woff2')).subarray(0, 4).toString(), 'wOF2');
});

const element = () => {
  const classes = new Set();
  return {
    attrs: {}, events: {}, id: '', focused: false,
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle(x, force) { const yes = force ?? !classes.has(x); yes ? classes.add(x) : classes.delete(x); return yes; } },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(k, fn) { this.events[k] = fn; },
    contains(target) { return target === this; },
    focus() { this.focused = true; }
  };
};
for (const lang of ['fr', 'en']) test('mobile menu opens, closes, restores focus: ' + lang, () => {
  const header = element(), btn = element(), nav = element(), link = element(), year = element(), doc = element(), media = element();
  nav.querySelectorAll = () => [link];
  doc.documentElement = { ...element(), lang };
  doc.querySelector = selector => ({ '.site-header': header, '.menu-button': btn, '.nav-links': nav })[selector];
  doc.querySelectorAll = () => [year];
  const win = { ...element(), scrollY: 10, matchMedia: () => media };
  vm.runInNewContext(read('assets/app.js'), { document: doc, window: win, Date });
  assert.equal(btn.attrs['aria-controls'], 'site-navigation');
  assert.equal(header.classList.contains('scrolled'), true);
  btn.events.click();
  assert.equal(btn.attrs['aria-expanded'], 'true');
  assert.equal(btn.attrs['aria-label'], lang === 'fr' ? 'Fermer le menu' : 'Close menu');
  doc.events.keydown({ key: 'Escape' });
  assert.equal(btn.attrs['aria-expanded'], 'false');
  assert.equal(btn.focused, true);
  btn.events.click(); link.events.click();
  assert.equal(nav.classList.contains('open'), false);
  btn.events.click(); doc.events.click({ target: {} });
  assert.equal(nav.classList.contains('open'), false);
  btn.events.click(); media.events.change();
  assert.equal(nav.classList.contains('open'), false);
});
