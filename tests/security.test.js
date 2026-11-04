// The site's safety rules: outside text is escaped, links and addresses are checked, saved data is validated.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSite } = require('./helpers');

const site = loadSite();
const EVIL = '<img src=x onerror=alert(1)>"\'&';

test('esc() turns HTML into harmless text', () => {
  assert.equal(site.run(`esc(${JSON.stringify(EVIL)})`), '&lt;img src=x onerror=alert(1)&gt;&quot;&#39;&amp;');
});

test('names from PokeAPI are escaped before going into HTML', () => {
  for (const fn of ['prettyName', 'placeName']) {
    const out = site.run(`${fn}(${JSON.stringify(EVIL)})`);
    assert.ok(!/[<>"]/.test(out), `${fn} left HTML in: ${out}`);
  }
  assert.ok(!/</.test(site.run(`typeBadge(${JSON.stringify(EVIL)})`)
    .replace(/^<span class="tipo" style="background:#888">/, '').replace(/<\/span>$/, '')));
});

test('own-property lookups ignore built-in names', () => {
  assert.equal(site.run('has({ a: 1 }, "constructor")'), false);
  assert.equal(site.run('has({ a: 1 }, "__proto__")'), false);
  assert.equal(site.run('has({ a: 1 }, "a")'), true);
  assert.equal(site.run('rawPretty("constructor")'), 'Constructor');
});

test('malformed links do not crash the router', () => {
  assert.equal(site.run('safeDecode("%E0")'), '');
  assert.equal(site.run('safeDecode("mr%20mime")'), 'mr mime');
});

test('api() only talks to the allowed sites', async () => {
  for (const url of ['https://evil.example/x', 'http://pokeapi.co/api/v2/pokemon/1', 'https://raw.githubusercontent.com/someone-else/repo/main/x.json']) {
    await assert.rejects(site.run(`api(${JSON.stringify(url)})`), /Blocked request/, url);
  }
});

test('news links must be http(s)', () => {
  assert.equal(site.run('safeLink("javascript:alert(1)")'), '');
  assert.equal(site.run('safeLink("data:text/html,hi")'), '');
  assert.equal(site.run('safeLink("https://example.com/a?b=1")'), 'https://example.com/a?b=1');
});

test('card picture addresses only point at the two image servers', () => {
  const sources = site.run(`cardSources({ id: 'sm7.5-1', localId: '1', name: 'x', image: 'https://evil.example/x' }, 'low')`);
  assert.ok(sources.length > 0);
  for (const u of sources) assert.match(u, /^https:\/\/(assets\.tcgdex\.net|images\.pokemontcg\.io)\//);
  assert.deepEqual(site.run(`cardSources({ id: '"><script>', localId: '1' })`), []);
});

test('saved collection data is checked before use', () => {
  const s = loadSite({ storage: { 'pokeinfo-collection': JSON.stringify({ cards: {
    'base1-4': { n: 'Charizard', l: '4', i: 'https://assets.tcgdex.net/en/base/base1/4' },
    'bad id!': { n: 'x' },
    'base1-2': { n: 'Blastoise', l: '2', i: 'javascript:alert(1)' },
  } }) } });
  assert.equal(s.run('loadCollection().size'), 2);
  assert.equal(s.run('isOwned("base1-4")'), true);
  assert.equal(s.run('loadCollection().get("base1-2").i'), '', 'unsafe image address dropped');
  const broken = loadSite({ storage: { 'pokeinfo-collection': 'not json' } });
  assert.equal(broken.run('loadCollection().size'), 0);
});

test('saved Nuzlocke runs are checked before use', () => {
  const s = loadSite({ storage: { 'pokeinfo-nuzlocke': JSON.stringify({ runs: {
    'red-blue': { enc: { 'kanto-route-1': { id: 16, nick: 'Birdie', status: 'caught' }, 'bad slug!': { id: 1, status: 'caught' }, 'kanto-route-2': { id: 99999, status: 'caught' } } },
    'not-a-game': { enc: {} },
  } }) } });
  const runs = s.run('loadRuns()');
  assert.deepEqual(Object.keys(runs), ['red-blue']);
  assert.deepEqual(Object.keys(runs['red-blue'].enc), ['kanto-route-1']);
});
