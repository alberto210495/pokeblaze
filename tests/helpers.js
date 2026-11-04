// Loads the site's real script files into a sandbox with a pretend browser (no network, no real page),
// so tests can call the same functions the site uses. Run all tests with:  node --test "tests/*.test.js"
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
// Same order as the <script> tags in index.html.
const SCRIPTS = ['js/data.js', 'js/guides.js', 'js/names.js', 'js/i18n.js', 'js/icons.js', 'js/cards.js', 'js/collection.js', 'js/news.js', 'js/app.js'];

// A do-nothing page element: enough for the site's start-up code to run.
function fakeElement() {
  return {
    innerHTML: '', textContent: '', hidden: false, disabled: false, value: '', title: '',
    dataset: {}, style: {}, children: [], isConnected: false,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {},
    querySelector: () => null, querySelectorAll: () => [], contains: () => false,
    append() {}, remove() {}, replaceWith() {}, focus() {}, click() {},
  };
}

function loadSite({ lang = 'en', storage = {} } = {}) {
  const store = { ...storage };
  const ctx = {
    console, URL, URLSearchParams, AbortSignal, Blob, setTimeout, clearTimeout, Intl, Promise,
    location: { hash: '', protocol: 'file:' },
    history: { replaceState() {} },
    navigator: { language: lang, languages: [lang], onLine: true },
    localStorage: {
      getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    fetch: () => Promise.reject(new Error('no network in tests')),
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    scrollTo() {}, alert() {}, confirm: () => false,
    HTMLImageElement: class {}, Event: class { constructor(type) { this.type = type; } },
    document: {
      getElementById: () => fakeElement(), querySelector: () => null, querySelectorAll: () => [],
      addEventListener() {}, createElement: fakeElement, body: fakeElement(),
      documentElement: { dataset: {}, lang: 'en' }, title: '',
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of SCRIPTS) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file });
  }
  // Top-level const/let in the scripts aren't properties of ctx; run() evaluates code inside the sandbox.
  // Objects and arrays are copied out as plain data (sandbox arrays aren't "the same kind" as the test's own,
  // which strict comparisons reject); promises are returned as they are.
  ctx.run = code => {
    const value = vm.runInContext(code, ctx);
    if (value && typeof value === 'object' && typeof value.then !== 'function') return JSON.parse(JSON.stringify(value));
    return value;
  };
  ctx.store = store;
  return ctx;
}

// Every English text passed to tr('…') in the site's code.
function trKeys() {
  const keys = new Set();
  for (const file of ['js/app.js', 'js/cards.js', 'js/collection.js', 'js/news.js']) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of src.matchAll(/tr\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g)) keys.add(m[2].replace(/\\(['"`])/g, '$1'));
  }
  return keys;
}

module.exports = { loadSite, trKeys, ROOT };
