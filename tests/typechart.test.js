// Type matchups, including how the chart changed between generations.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSite } = require('./helpers');

const site = loadSite();
const hit = (atk, defTypes, gen) => site.run(`defenses(${JSON.stringify(defTypes)}, typeChartFor(${gen}))[${JSON.stringify(atk)}]`);

test('current chart: well-known matchups', () => {
  assert.equal(hit('fire', ['grass'], 9), 2);
  assert.equal(hit('water', ['fire', 'ground'], 9), 4);
  assert.equal(hit('electric', ['ground'], 9), 0);
  assert.equal(hit('fighting', ['fairy'], 9), 0.5);
  assert.equal(hit('dragon', ['fairy'], 9), 0);
  assert.equal(hit('ghost', ['steel'], 9), 1);
  assert.equal(hit('dark', ['steel'], 9), 1);
});

test('Gen 2–5: Steel also resisted Ghost and Dark', () => {
  for (const gen of [2, 3, 4, 5]) {
    assert.equal(hit('ghost', ['steel'], gen), 0.5, `Ghost vs Steel in Gen ${gen}`);
    assert.equal(hit('dark', ['steel'], gen), 0.5, `Dark vs Steel in Gen ${gen}`);
  }
  assert.equal(hit('ghost', ['psychic'], 2), 2);
  assert.equal(hit('ice', ['fire'], 2), 0.5);
});

test('Gen 1: the old quirks', () => {
  assert.equal(hit('ghost', ['psychic'], 1), 0, 'Ghost had no effect on Psychic');
  assert.equal(hit('bug', ['poison'], 1), 2, 'Bug was super effective on Poison');
  assert.equal(hit('poison', ['bug'], 1), 2, 'Poison was super effective on Bug');
  assert.equal(hit('ice', ['fire'], 1), 1, 'Ice did normal damage to Fire');
});

test('older charts are copies: the current chart is never changed', () => {
  site.run('typeChartFor(1); typeChartFor(3);');
  assert.equal(hit('ghost', ['psychic'], 9), 2);
  assert.equal(hit('bug', ['poison'], 9), 0.5);
  assert.equal(site.run('typeChartFor(6) === TYPE_CHART'), true);
});

test('types that did not exist yet are left out', () => {
  assert.deepEqual(site.run('typesOfGen(1).filter(t => ["dark", "steel", "fairy"].includes(t))'), []);
  assert.equal(site.run('typesOfGen(1).length'), 15);
  assert.equal(site.run('typesOfGen(2).includes("steel") && !typesOfGen(5).includes("fairy")'), true);
  assert.equal(site.run('typesOfGen(9).length'), 18);
});

test('a Pokémon\'s types in older games (Clefairy was Normal before Gen 6)', () => {
  const clefairy = JSON.stringify({
    types: [{ type: { name: 'fairy' } }],
    past_types: [{ generation: { name: 'generation-v' }, types: [{ type: { name: 'normal' } }] }],
  });
  assert.deepEqual(site.run(`typesInGen(${clefairy}, 1)`), ['normal']);
  assert.deepEqual(site.run(`typesInGen(${clefairy}, 5)`), ['normal']);
  assert.deepEqual(site.run(`typesInGen(${clefairy}, 6)`), ['fairy']);
});
