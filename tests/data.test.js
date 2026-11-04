// The hand-written data (games, guides) and generated data (names) are consistent, and every site text is translated.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSite, trKeys } = require('./helpers');

const site = loadSite();

test('every guide belongs to a game and has a PokeAPI version group', () => {
  const missing = site.run('Object.keys(GUIDES).filter(id => !gameById(id) || !has(VERSION_GROUPS, id))');
  assert.deepEqual(missing, []);
});

test('guide data: gift Pokémon numbers and milestone types are valid', () => {
  const badGifts = site.run('Object.entries(GUIDES).flatMap(([id, g]) => g.gifts.filter(x => !Number.isInteger(x.id) || x.id < 1 || x.id > TOTAL || !x.where).map(x => id + ":" + x.id))');
  assert.deepEqual(badGifts, []);
  const badTypes = site.run('Object.entries(GUIDES).flatMap(([id, g]) => g.milestones.flatMap(s => s.list).filter(m => !m.who || (m.type && !has(TYPE_COLORS, m.type))).map(m => id + ":" + m.who))');
  assert.deepEqual(badTypes, []);
  const badItems = site.run('Object.entries(GUIDES).flatMap(([id, g]) => g.items.filter(i => !i.name || !i.where).map(() => id))');
  assert.deepEqual(badItems, []);
});

test('guide and game data contain no HTML (it is inserted without escaping)', () => {
  const text = site.run('JSON.stringify([GUIDES, GAMES, REGIONS])');
  assert.ok(!/[<>]/.test(text), 'found < or > in data.js / guides.js');
});

test('generated names file has English and Spanish names', () => {
  assert.equal(site.run('NAMES.en.moves["u-turn"]'), 'U-turn');
  assert.equal(site.run('NAMES.es.types.fire'), 'Fuego');
  assert.ok(site.run('Object.keys(NAMES.es.moves).length') > 500);
});

test('every site text has a Spanish translation without double quotes', () => {
  const es = site.run('ES');
  const missing = [...trKeys()].filter(k => !Object.prototype.hasOwnProperty.call(es, k));
  assert.deepEqual(missing, [], 'texts without Spanish');
  const quoted = Object.entries(es).filter(([, v]) => v.includes('"')).map(([k]) => k);
  assert.deepEqual(quoted, [], 'translations with double quotes');
});

test('tr() fills placeholders and falls back to English', () => {
  const es = loadSite({ lang: 'es-ES' });
  assert.equal(es.run('LANG'), 'es');
  assert.equal(es.run('tr("{n} cards", { n: 3 })'), '3 cartas');
  assert.equal(es.run('tr("Some text nobody translated")'), 'Some text nobody translated');
  assert.equal(loadSite({ lang: 'fr-FR' }).run('LANG'), 'en');
});

test('readable names from PokeAPI slugs', () => {
  assert.equal(site.run('rawPretty("mr-mime")'), 'Mr. Mime');
  assert.equal(site.run('rawPretty("great-ball")'), 'Great Ball');
  assert.equal(site.run('placeText("kanto-route-1-area")'), 'Route 1');
  assert.equal(site.run('placeText("mt-moon-b1f")'), 'Mt Moon B1F');
  assert.equal(loadSite({ lang: 'es' }).run('placeText("kanto-route-1")'), 'Ruta 1');
});
