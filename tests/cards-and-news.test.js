// Trading card picture sources, the collection checklist and the news collector.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSite } = require('./helpers');
const news = require('../tools/fetch-news.js');

const site = loadSite();
const sources = card => site.run(`cardSources(${JSON.stringify(card)}, 'low')`);

test('card pictures: TCGdex first, then backups', () => {
  const own = sources({ id: 'base1-4', localId: '4', image: 'https://assets.tcgdex.net/en/base/base1/4' });
  assert.equal(own[0], 'https://assets.tcgdex.net/en/base/base1/4/low.webp');
  assert.equal(own[1], 'https://images.pokemontcg.io/base1/4.png', 'backup when the TCGdex picture fails');
});

test('card pictures for cards TCGdex has no image for', () => {
  assert.deepEqual(sources({ id: 'sm7.5-1', localId: '1' }), ['https://images.pokemontcg.io/sm75/1.png']);
  assert.deepEqual(sources({ id: 'sve-001', localId: '001' }), ['https://images.pokemontcg.io/sve/001.png', 'https://images.pokemontcg.io/sve/1.png']);
  assert.deepEqual(sources({ id: 'tk-xy-b-1', localId: '1' }), ['https://assets.tcgdex.net/it/tk/tk-xy-b/1/low.webp', 'https://assets.tcgdex.net/es/tk/tk-xy-b/1/low.webp']);
  assert.deepEqual(sources({ id: '2014xy-1', localId: '1' }), [], 'nowhere to look: shows "no picture"');
});

test('set ids on the Pokémon TCG API', () => {
  assert.equal(site.run('ptcgSetId("sv03.5")'), 'sv3pt5');
  assert.equal(site.run('ptcgSetId("sv01")'), 'sv1');
  assert.equal(site.run('ptcgSetId("sm7.5")'), 'sm75');
  assert.equal(site.run('ptcgSetId("swsh12.5")'), 'swsh12pt5');
  assert.equal(site.run('setIdOfCard("sv03.5-199")'), 'sv03.5');
  assert.equal(site.run('setIdOfCard("tk-hs-r-2")'), 'tk-hs-r');
});

test('collection: adding, ignoring bad entries and the progress text', () => {
  const s = loadSite();
  assert.equal(s.run('addValidCards(loadCollection(), { "base1-4": { n: "Charizard", l: "4" }, "x y": {}, "base1-4b": "nope" })'), 1);
  assert.equal(s.run('saveCollection()'), true);
  assert.match(s.store['pokeinfo-collection'], /"base1-4"/);
  assert.match(s.run('collectionProgress(12, 102)'), /You have 12 of 102 cards \(12%\)/);
});

const NOW = Date.parse('2026-11-03T12:00:00Z');
const RSS = `<?xml version="1.0"?><rss><channel>
  <item><title><![CDATA[New <b>Pokémon</b> game &amp; more]]></title><link>https://example.com/a</link>
    <pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>Big &#8220;news&#8221; today.</p><script>bad()</script>]]></description></item>
  <item><title>Zelda update</title><link>https://example.com/b</link><pubDate>Mon, 02 Nov 2026 09:00:00 GMT</pubDate></item>
  <item><title>Pikachu event</title><link>javascript:alert(1)</link><pubDate>Mon, 02 Nov 2026 08:00:00 GMT</pubDate></item>
  <item><title>Old Pokémon story</title><link>https://example.com/old</link><pubDate>Mon, 01 Sep 2026 08:00:00 GMT</pubDate></item>
</channel></rss>`;

test('news: RSS items become clean headlines', () => {
  const items = news.parseFeed(RSS, { id: 'x', lang: 'en' }, NOW);
  assert.equal(items[0].title, 'New Pokémon game & more');
  assert.equal(items[0].summary, 'Big “news” today.');
  assert.equal(items[0].link, 'https://example.com/a');
  assert.deepEqual(items.map(i => i.link), ['https://example.com/a', 'https://example.com/b'], 'bad links and old stories dropped');
});

test('news: sites that cover other games keep only Pokémon stories', () => {
  const items = news.parseFeed(RSS, { id: 'x', lang: 'en', filter: true }, NOW);
  assert.deepEqual(items.map(i => i.title), ['New Pokémon game & more']);
});

test('news: Atom feeds work too', () => {
  const atom = `<feed><entry><title>Pokémon Presents</title><link rel="alternate" href="https://example.com/p"/>
    <updated>2026-11-03T08:00:00Z</updated><summary>Watch it live</summary></entry></feed>`;
  assert.deepEqual(news.parseFeed(atom, { id: 'y', lang: 'en' }, NOW).map(i => [i.title, i.link, i.summary]),
    [['Pokémon Presents', 'https://example.com/p', 'Watch it live']]);
});

test('news: long summaries are shortened at a word', () => {
  const out = news.shorten('word '.repeat(100).trim(), 50);
  assert.ok(out.length <= 51 && out.endsWith('…'));
});
