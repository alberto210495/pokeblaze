// Collects Pokémon news headlines from several sites' RSS/Atom feeds into one JSON file for the News page.
// Run by the "Update news" GitHub Action (.github/workflows/news.yml) every 6 hours; you can also run it yourself:
//   node tools/fetch-news.js news.json
// Needs Node.js 18 or newer. Only headlines, dates and a short summary are kept; each item links to the full article.

const fs = require('fs');
const path = require('path');

// filter: only keep stories that mention Pokémon (for sites that cover all games).
const SOURCES = [
  { id: 'pokejungle', name: 'PokéJungle', site: 'https://pokejungle.net', feed: 'https://pokejungle.net/feed/', lang: 'en' },
  { id: 'pokemonblog', name: 'Pokémon Blog', site: 'https://pokemonblog.com', feed: 'https://pokemonblog.com/feed/', lang: 'en' },
  { id: 'dexerto', name: 'Dexerto', site: 'https://www.dexerto.com/pokemon/', feed: 'https://www.dexerto.com/pokemon/feed/', lang: 'en' },
  { id: 'gohub', name: 'Pokémon GO Hub', site: 'https://pokemongohub.net', feed: 'https://pokemongohub.net/feed/', lang: 'en' },
  { id: 'nintendolife', name: 'Nintendo Life', site: 'https://www.nintendolife.com', feed: 'https://www.nintendolife.com/feeds/news', lang: 'en', filter: true },
  { id: 'siliconera', name: 'Siliconera', site: 'https://www.siliconera.com', feed: 'https://www.siliconera.com/feed/', lang: 'en', filter: true },
  { id: 'nintenderos', name: 'Nintenderos', site: 'https://www.nintenderos.com', feed: 'https://www.nintenderos.com/feed/', lang: 'es', filter: true },
];

const MAX_AGE_DAYS = 14;
const MAX_ITEMS = 150;
const PER_SOURCE = 40;
const POKEMON = /pok[eé]mon|pikachu|paldea|kanto|nuzlocke|tcg pocket/i;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', eacute: 'é', Eacute: 'É' };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') {
    const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
  }
  return Object.prototype.hasOwnProperty.call(ENTITIES, e) ? ENTITIES[e] : m;
});
const unwrap = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
// Feed text → plain text: no tags, no entities, single spaces.
const plain = s => decode(unwrap(s).replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

function tag(xml, names) {
  for (const name of names) {
    const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
    if (m) return m[1];
  }
  return '';
}

function linkOf(xml) {
  const rss = plain(tag(xml, ['link']));
  if (rss) return rss;
  const atom = xml.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || xml.match(/<link\b[^>]*href=["']([^"']+)["']/i);
  return atom ? decode(atom[1]) : '';
}

const safeUrl = u => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
};

const shorten = (s, max) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[\s,.;:–—-]+$/, '') + '…';
};

async function readFeed(src) {
  const res = await fetch(src.feed, {
    headers: { 'user-agent': 'PokeBlazeNews/1.0 (+https://github.com/alberto210495/pokemon-web)', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text(), src);
}

// Feed XML → news items for one source (kept separate from fetching so the tests can use it).
function parseFeed(xml, src, now = Date.now()) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  const cutoff = now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return blocks.map(b => {
    const title = shorten(plain(tag(b, ['title'])), 200);
    const link = safeUrl(linkOf(b));
    const date = Date.parse(plain(tag(b, ['pubDate', 'dc:date', 'published', 'updated'])));
    const summary = shorten(plain(tag(b, ['description', 'summary', 'content:encoded', 'content'])), 240);
    return { title, link, date, summary, source: src.id, lang: src.lang };
  })
    .filter(it => it.title && it.link && Number.isFinite(it.date) && it.date >= cutoff && it.date <= now + 36e5)
    .filter(it => !src.filter || POKEMON.test(`${it.title} ${it.summary}`))
    .slice(0, PER_SOURCE);
}

async function main() {
  const outFile = process.argv[2] || 'news.json';
  const results = await Promise.all(SOURCES.map(src => readFeed(src)
    .then(items => { console.log(`${src.name}: ${items.length}`); return items; })
    .catch(err => { console.warn(`${src.name}: failed (${err.message})`); return null; })));
  if (results.every(r => r === null)) throw new Error('every feed failed; keeping the previous news');

  const seen = new Set();
  const items = results.flat().filter(Boolean)
    .sort((a, b) => b.date - a.date)
    .filter(it => {
      const key = it.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (seen.has(it.link) || seen.has(key)) return false;
      seen.add(it.link); seen.add(key);
      return true;
    })
    .slice(0, MAX_ITEMS)
    .map(it => ({ ...it, date: new Date(it.date).toISOString() }));

  const data = {
    updated: new Date().toISOString(),
    sources: SOURCES.map(({ id, name, site, lang }, i) => ({ id, name, site, lang, ok: results[i] !== null })),
    items,
  };
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 1));
  console.log(`Wrote ${items.length} items to ${outFile}`);
}

if (require.main === module) main().catch(err => { console.error(err.message); process.exit(1); });

module.exports = { parseFeed, plain, decode, safeUrl, shorten, SOURCES };
