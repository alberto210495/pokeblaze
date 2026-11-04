// Team links, saved teams, move learnsets and move stats in older games.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSite } = require('./helpers');

const site = loadSite();
const team = text => site.run(`parseTeam(${JSON.stringify(text)})`);

test('team links: members, moves and limits', () => {
  assert.deepEqual(team('6.flamethrower.air-slash,25'), [{ id: 6, moves: ['flamethrower', 'air-slash'] }, { id: 25, moves: [] }]);
  assert.equal(team('1,2,3,4,5,6,7,8').length, 6, 'at most 6 members');
  assert.deepEqual(team('6.a.b.c.d.e')[0].moves, ['a', 'b', 'c', 'd'], 'at most 4 moves');
  assert.deepEqual(team('25,25,0,9999,abc').map(m => m.id), [25], 'duplicates and bad numbers skipped');
  assert.deepEqual(team('130.<script>.ok')[0].moves, ['ok'], 'bad move names skipped');
  assert.deepEqual(team(''), []);
});

test('team links survive a round trip', () => {
  const text = '6.flamethrower,25.thunderbolt.quick-attack,130';
  assert.equal(site.run(`teamPath(parseTeam(${JSON.stringify(text)}))`), text);
});

test('teams saved by older versions (plain numbers) still load', () => {
  const s = loadSite({ storage: { 'pokeinfo-team': '[6,25]' } });
  assert.deepEqual(s.run('loadSavedTeam()'), [{ id: 6, moves: [] }, { id: 25, moves: [] }]);
  assert.deepEqual(loadSite({ storage: { 'pokeinfo-team': '{oops' } }).run('loadSavedTeam()'), []);
});

// Tackle: 35 power / 95% accuracy until Black & White, 50 power until Sun & Moon, 40 now (PokeAPI past_values).
const TACKLE = JSON.stringify({ type: 'normal', cls: 'physical', power: 40, accuracy: 100, pp: 35,
  past: [{ vg: 'black-white', power: 35, accuracy: 95 }, { vg: 'sun-moon', power: 50, accuracy: null }] });
const asOf = (move, vg) => site.run(`(() => { const i = VG_LIST.findIndex(x => x.vg === ${JSON.stringify(vg)}); return moveAsOf(${move}, i, VG_LIST[i].game.gen); })()`);

test('move stats as they were in each game', () => {
  assert.deepEqual([asOf(TACKLE, 'red-blue').power, asOf(TACKLE, 'red-blue').accuracy], [35, 95]);
  assert.deepEqual([asOf(TACKLE, 'x-y').power, asOf(TACKLE, 'x-y').accuracy], [50, 100]);
  assert.deepEqual([asOf(TACKLE, 'scarlet-violet').power, asOf(TACKLE, 'scarlet-violet').accuracy], [40, 100]);
});

test('before Gen 4, physical or special depended on the type', () => {
  const bite = JSON.stringify({ type: 'dark', cls: 'physical', power: 60, accuracy: 100, pp: 25, past: [{ vg: 'gold-silver', type: 'normal' }] });
  assert.equal(asOf(bite, 'red-blue').type, 'normal');
  assert.equal(asOf(bite, 'gold-silver').cls, 'special', 'Dark was a special type');
  assert.equal(asOf(bite, 'diamond-pearl').cls, 'physical');
});

test('learnsets are split by how the move is learned', () => {
  const p = JSON.stringify({ moves: [
    { move: { name: 'tackle' }, version_group_details: [{ level_learned_at: 1, move_learn_method: { name: 'level-up' }, version_group: { name: 'red-blue' } }] },
    { move: { name: 'cut' }, version_group_details: [{ level_learned_at: 0, move_learn_method: { name: 'machine' }, version_group: { name: 'red-blue' } }] },
    { move: { name: 'petal-dance' }, version_group_details: [{ level_learned_at: 0, move_learn_method: { name: 'egg' }, version_group: { name: 'gold-silver' } }] },
  ] });
  const sets = site.run(`learnset(${p}, 'red-blue')`);
  assert.deepEqual(sets['level-up'], [{ slug: 'tackle', level: 1 }]);
  assert.deepEqual(sets.machine.map(m => m.slug), ['cut']);
  assert.deepEqual(sets.egg, [], 'egg move belongs to another game');
});
