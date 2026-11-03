// PokéInfo — single-page app with hash routing.
// Routes: #/  #/pokedex[?gen=&type=&q=]  #/pokemon/:id  #/regions  #/region/:id
//         #/games  #/game/:id  #/compare[/:a/:b]
//         #/guides  #/guide/:id[/walkthrough|locations|items]
//         #/team[/:id,:id,…[/:game]]

const API = 'https://pokeapi.co/api/v2';
const TOTAL = 1025;
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

const app = document.getElementById('app');
const cache = new Map();

// ---------- Helpers ----------

// API responses are kept in memory for this visit and saved in the browser for a week,
// using the Cache API when available (served over http/https) and localStorage otherwise.
const STORE_NAME = 'pokeinfo-v1';
const STORE_PREFIX = 'pokeinfo:';
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

async function readStored(url) {
  let store;
  try { store = await caches.open(STORE_NAME); } catch { /* Cache API unavailable (e.g. file://): fall back to localStorage */ }
  if (store) {
    try {
      const res = await store.match(url);
      if (res && Date.now() - Number(res.headers.get('x-saved')) < MAX_AGE) return await res.json();
    } catch { store.delete(url).catch(() => {}); } // damaged entry: drop it and fetch again
    return null;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_PREFIX + url));
    return saved && Date.now() - saved.t < MAX_AGE ? saved.d : null;
  } catch { return null; }
}

async function writeStored(url, data) {
  const body = JSON.stringify(data);
  try {
    const store = await caches.open(STORE_NAME);
    await store.put(url, new Response(body, { headers: { 'x-saved': String(Date.now()) } }));
    return;
  } catch { /* fall back to localStorage */ }
  const key = STORE_PREFIX + url;
  const value = JSON.stringify({ t: Date.now(), d: data });
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full: drop our saved responses and try once more.
    try {
      Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX)).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, value);
    } catch { /* not cached; that's fine */ }
  }
}

const TIMEOUT = 15000; // give up on a request after 15 s instead of showing "Loading…" forever

// `pick`, if given, trims a response before it is cached (used for big records like moves).
// Always call the same URL with the same pick.
function api(url, pick) {
  const full = url.startsWith('http') ? url : API + url;
  // Only ever talk to PokeAPI, even if a response contains a link somewhere else.
  if (!full.startsWith(API + '/')) return Promise.reject(new Error(`Blocked request to ${full}`));
  if (!cache.has(full)) {
    const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(TIMEOUT) : undefined;
    const req = readStored(full)
      .then(saved => saved || fetch(full, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => { const kept = pick ? pick(data) : data; writeStored(full, kept); return kept; }))
      .catch(err => { cache.delete(full); throw err; });
    cache.set(full, req);
  }
  return cache.get(full);
}

// Damage multiplier of each attacking type against a Pokémon with the given types.
const defenses = types => Object.fromEntries(Object.entries(TYPE_CHART).map(([atk, eff]) => [atk,
  types.reduce((m, t) => m * (eff.zero.includes(t) ? 0 : eff.double.includes(t) ? 2 : eff.half.includes(t) ? 0.5 : 1), 1)]));

const sprite = id => `${SPRITES}/${id}.png`;
const artwork = (id, shiny = false) => `${SPRITES}/other/official-artwork/${shiny ? 'shiny/' : ''}${id}.png`;
const pad = id => '#' + String(id).padStart(4, '0');
const idFromUrl = url => Number(url.split('/').filter(Boolean).pop());
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// Security rule: every piece of text that comes from PokeAPI or the URL goes through esc() before it is
// put into HTML. The hand-written data in data.js and guides.js is trusted and contains no HTML.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s).replace(/[&<>"']/g, c => ESCAPES[c]);

const NAME_FIXES = {
  'nidoran-f': 'Nidoran♀', 'nidoran-m': 'Nidoran♂', 'mr-mime': 'Mr. Mime', 'mime-jr': 'Mime Jr.',
  'mr-rime': 'Mr. Rime', farfetchd: "Farfetch'd", sirfetchd: "Sirfetch'd", 'type-null': 'Type: Null',
  'ho-oh': 'Ho-Oh', 'porygon-z': 'Porygon-Z', 'jangmo-o': 'Jangmo-o', 'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o', flabebe: 'Flabébé', 'chi-yu': 'Chi-Yu', 'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu', 'wo-chien': 'Wo-Chien',
};
const rawPretty = slug => (has(NAME_FIXES, slug) && NAME_FIXES[slug]) || String(slug).split('-').map(cap).join(' ');
const prettyName = slug => esc(rawPretty(slug)); // for HTML

// Full species list (id + name), loaded once. Names are stored as plain text.
let speciesNames = null;
async function loadSpecies() {
  if (!speciesNames) {
    const data = await api(`/pokemon-species?limit=${TOTAL}`);
    speciesNames = new Map(
      data.results
        .map(s => [idFromUrl(s.url), rawPretty(s.name)])
        .filter(([id]) => Number.isInteger(id) && id >= 1 && id <= TOTAL)
        .sort((a, b) => a[0] - b[0])
    );
  }
  return speciesNames;
}
const rawNameOf = id => (speciesNames && speciesNames.get(id)) || pad(id); // plain text (search, messages)
const nameOf = id => esc(rawNameOf(id)); // for HTML

// Own-property check, so keys from the URL like "constructor" or "__proto__" never match built-in object members.
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const genOf = id => GENERATIONS.find(g => id >= g.from && id <= g.to);
const regionById = id => REGIONS.find(r => r.id === id);
const gameById = id => GAMES.find(g => g.id === id);

// ---------- Reusable components ----------

// Some small sprites are missing; those images fall back to the official artwork.
// Handled by one listener (see the bottom of this file) instead of inline onerror="…" code.
const imgFallback = id => `data-fallback="${artwork(id)}"`;

const pokeCard = id => `
  <a class="poke" href="#/pokemon/${id}" data-id="${id}">
    <img loading="lazy" src="${sprite(id)}" alt="${nameOf(id)}" ${imgFallback(id)}>
    <div class="num">${pad(id)}</div>
    <div class="nom">${nameOf(id)}</div>
  </a>`;

const miniList = ids => `<div class="mini">${ids.map(id => `
  <a href="#/pokemon/${id}" title="${nameOf(id)}">
    <img loading="lazy" src="${sprite(id)}" alt="${nameOf(id)}" ${imgFallback(id)}>
    <div>${nameOf(id)}</div>
  </a>`).join('')}</div>`;

const typeBadge = t => `<span class="tipo" style="background:${has(TYPE_COLORS, t) ? TYPE_COLORS[t] : '#888'}">${esc(cap(t))}</span>`;
const list = items => `<ul class="lista">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
const loading = (msg = 'Loading…') => `<div class="cargando">${msg}</div>`;

// PokeAPI location slugs look like "kanto-route-1" or "mt-moon-b1f".
const REGION_PREFIX = /^(kanto|johto|hoenn|sinnoh|unova|kalos|alola|galar|hisui|paldea)-/;
const placeName = slug => esc(String(slug).replace(REGION_PREFIX, '').replace(/-area$/, '').split('-')
  .map(w => /^b?\d+f$/.test(w) ? w.toUpperCase() : cap(w)).join(' '));

// Display name of each PokeAPI version slug of a game ("red" → "Red").
const versionLabels = (g, guide) => Object.fromEntries(guide.versions.map((v, i) =>
  [v, g.versions && g.versions.length === guide.versions.length ? g.versions[i].name : g.name]));

// ---------- Views ----------
// Each view returns an HTML string or { html, mount } (mount runs after render).

function home() {
  const featured = [25, 6, 150, 384, 448, 658][Math.floor(Math.random() * 6)];
  return {
    html: `
      <section class="hero">
        <div>
          <h1>Welcome to PokéInfo</h1>
          <p>Your guide to the Pokémon world: details on every Pokémon, every region and every main-series game, plus what makes each version different.</p>
          <a class="btn sec" href="#/pokedex">Explore the Pokédex</a>
          <button class="btn sec" id="randomBtn">🎲 Random Pokémon</button>
        </div>
        <img src="${artwork(featured)}" alt="Featured Pokémon">
      </section>

      <div class="cifras tarjeta">
        <div class="cifra"><b>${TOTAL}</b><span>Pokémon</span></div>
        <div class="cifra"><b>${GENERATIONS.length}</b><span>Generations</span></div>
        <div class="cifra"><b>${REGIONS.length}</b><span>Regions</span></div>
        <div class="cifra"><b>${GAMES.length}</b><span>Main games</span></div>
      </div>

      <div class="secciones">
        <a class="tarjeta seccion" href="#/pokedex"><div class="ico">📕</div><h3>Pokédex</h3><p>Stats, types, abilities and evolutions for all ${TOTAL} Pokémon.</p></a>
        <a class="tarjeta seccion" href="#/regions"><div class="ico">🗺️</div><h3>Regions</h3><p>From Kanto to Paldea: inspiration, professors, starters and legendaries.</p></a>
        <a class="tarjeta seccion" href="#/games"><div class="ico">🎮</div><h3>Games</h3><p>Every main-series game, its new features and version exclusives.</p></a>
        <a class="tarjeta seccion" href="#/guides"><div class="ico">📖</div><h3>Guides</h3><p>Walkthroughs, routes, wild Pokémon locations and key items for each game.</p></a>
        <a class="tarjeta seccion" href="#/team"><div class="ico">🛡️</div><h3>Team builder</h3><p>Build a team of six and spot its weaknesses and coverage gaps.</p></a>
        <a class="tarjeta seccion" href="#/compare"><div class="ico">⚖️</div><h3>Compare</h3><p>Put two games side by side and see how they differ.</p></a>
      </div>`,
    mount() {
      document.getElementById('randomBtn').onclick = () => {
        location.hash = `#/pokemon/${1 + Math.floor(Math.random() * TOTAL)}`;
      };
    },
  };
}

// Pokédex filters persist while navigating.
// Filters live in the URL (#/pokedex?gen=3&type=water&q=pika) so they can be bookmarked and shared.
// A bare #/pokedex keeps the last filters used in this visit.
const dex = { q: '', gen: '', type: '' };

function readDexQuery(genParam) {
  const query = location.hash.split('?')[1];
  if (!query && !genParam) return;
  const p = new URLSearchParams(query);
  const gen = genParam || p.get('gen') || ''; // #/pokedex/3 is the old form of ?gen=3
  const type = p.get('type') || '';
  dex.gen = GENERATIONS.some(g => String(g.n) === gen) ? gen : '';
  dex.type = has(TYPE_COLORS, type) ? type : '';
  dex.q = p.get('q') || '';
}

function dexHash() {
  const p = new URLSearchParams();
  if (dex.gen) p.set('gen', dex.gen);
  if (dex.type) p.set('type', dex.type);
  if (dex.q.trim()) p.set('q', dex.q.trim());
  const query = p.toString();
  return '#/pokedex' + (query ? '?' + query : '');
}

async function pokedex(genParam) {
  readDexQuery(genParam);
  await loadSpecies();

  return {
    html: `
      <h1>Pokédex</h1>
      <p class="subtitulo">Search by name or number, or filter by generation and type.</p>
      <div class="filtros">
        <input id="q" type="search" placeholder="Search: Pikachu, 25…" aria-label="Search by name or number" value="${esc(dex.q)}">
        <select id="gen" aria-label="Generation">
          <option value="">All generations</option>
          ${GENERATIONS.map(g => `<option value="${g.n}" ${dex.gen == g.n ? 'selected' : ''}>Gen ${g.n} — ${regionById(g.region).name}</option>`).join('')}
        </select>
        <select id="type" aria-label="Type">
          <option value="">All types</option>
          ${Object.keys(TYPE_COLORS).map(t => `<option value="${t}" ${dex.type === t ? 'selected' : ''}>${cap(t)}</option>`).join('')}
        </select>
        <button class="btn sec" id="clear">Clear</button>
      </div>
      <div class="contador" id="count" aria-live="polite"></div>
      <p class="subtitulo" id="dexMsg" hidden></p>
      <div class="rejilla" id="grid">${[...speciesNames.keys()].map(pokeCard).join('')}</div>`,
    mount() {
      const q = document.getElementById('q');
      const gen = document.getElementById('gen');
      const type = document.getElementById('type');
      let timer;
      q.oninput = () => { clearTimeout(timer); timer = setTimeout(() => { dex.q = q.value; applyFilters(); }, 150); };
      gen.onchange = () => { dex.gen = gen.value; applyFilters(); };
      type.onchange = () => { dex.type = type.value; applyFilters(); };
      document.getElementById('clear').onclick = () => {
        dex.q = dex.gen = dex.type = '';
        q.value = gen.value = type.value = '';
        applyFilters();
      };
      applyFilters();
    },
  };
}

// The grid is built once; filtering only hides and shows cards, so images already loaded stay loaded.
let filterToken = 0;
async function applyFilters() {
  const grid = document.getElementById('grid');
  if (!grid) return; // a delayed search fired after the user left the Pokédex
  const count = document.getElementById('count');
  const msg = document.getElementById('dexMsg');
  if (location.hash !== dexHash()) history.replaceState(null, '', dexHash()); // replace, so typing doesn't flood history
  const token = ++filterToken;

  let ofType = null;
  if (dex.type) {
    count.textContent = 'Filtering by type…';
    try {
      const data = await api(`/type/${dex.type}`);
      ofType = new Set(data.pokemon.map(p => idFromUrl(p.pokemon.url)));
    } catch {
      ofType = undefined;
    }
    if (token !== filterToken || !grid.isConnected) return; // a newer filter or page took over
  }

  const g = dex.gen && GENERATIONS.find(x => String(x.n) === String(dex.gen));
  const q = dex.q.trim().toLowerCase().replace(/^#0*/, '');
  let shown = 0;
  for (const card of grid.children) {
    const id = Number(card.dataset.id);
    const show = ofType !== undefined
      && (!g || (id >= g.from && id <= g.to))
      && (!ofType || ofType.has(id))
      && (!q || rawNameOf(id).toLowerCase().includes(q) || String(id) === q);
    card.hidden = !show;
    if (show) shown++;
  }
  count.textContent = ofType === undefined ? '' : `${shown} Pokémon`;
  msg.hidden = shown > 0;
  msg.textContent = ofType === undefined ? 'Could not load the type filter. Check your connection and try again.' : 'No Pokémon match your search.';
}

function evolutionStages(node, depth = 0, out = []) {
  (out[depth] = out[depth] || []).push(idFromUrl(node.species.url));
  node.evolves_to.forEach(n => evolutionStages(n, depth + 1, out));
  return out;
}

async function pokemonDetail(param) {
  const id = parseInt(param, 10);
  if (!id || id < 1 || id > TOTAL) return notFound();

  const [p, s] = await Promise.all([api(`/pokemon/${id}`), api(`/pokemon-species/${id}`), loadSpecies()]);
  const chain = s.evolution_chain ? await api(s.evolution_chain.url).catch(() => null) : null;

  const en = arr => (arr || []).filter(x => x.language.name === 'en');
  const name = esc((en(s.names)[0] || {}).name || rawNameOf(id));
  const genus = esc((en(s.genera)[0] || {}).genus || '');
  const flavors = en(s.flavor_text_entries);
  const flavor = flavors.length ? esc(flavors[flavors.length - 1].flavor_text.replace(/[\f\n\r]+/g, ' ')) : '';
  const gen = genOf(id);
  const region = regionById(gen.region);
  const totalStats = p.stats.reduce((sum, st) => sum + (Number(st.base_stat) || 0), 0);
  const mult = defenses(p.types.map(t => t.type.name));
  const matchups = [[4, 'Takes ×4 from'], [2, 'Takes ×2 from'], [0.5, 'Takes ×½ from'], [0.25, 'Takes ×¼ from'], [0, 'Immune to']]
    .map(([m, label]) => [label, Object.keys(mult).filter(t => mult[t] === m)])
    .filter(([, types]) => types.length);
  const cryUrl = p.cries && (p.cries.latest || p.cries.legacy);
  const cry = typeof cryUrl === 'string' && cryUrl.startsWith('https://raw.githubusercontent.com/PokeAPI/') ? cryUrl : null;
  const stages = chain ? evolutionStages(chain.chain).map(st => st.filter(x => x <= TOTAL)) : [];
  const exclusiveIn = GAMES.flatMap(g => (g.versions || [])
    .filter(v => v.pokemon.includes(id) && !g.versions.every(o => o.pokemon.includes(id)))
    .map(v => `<a class="chip" href="#/game/${g.id}">Pokémon ${v.name}</a>`));

  const tags = [];
  if (s.is_legendary) tags.push('<span class="chip">⭐ Legendary</span>');
  if (s.is_mythical) tags.push('<span class="chip">✨ Mythical</span>');
  if (s.is_baby) tags.push('<span class="chip">🍼 Baby</span>');

  return {
    html: `
      <a class="volver" href="#/pokedex">← Back to Pokédex</a>
      <div class="detalle">
        <div class="tarjeta ficha">
          <div class="num">${pad(id)}</div>
          <h1>${name}</h1>
          <p class="genero">${genus}</p>
          <img class="arte" id="art" src="${artwork(id)}" alt="${name}">
          <div class="tipos">${p.types.map(t => typeBadge(t.type.name)).join('')}</div>
          ${tags.length ? `<div class="lista-chips" style="justify-content:center">${tags.join('')}</div>` : ''}
          <div class="acciones">
            <button class="btn sec" id="shinyBtn">✨ View shiny</button>
            ${cry ? '<button class="btn sec" id="cryBtn">🔊 Cry</button>' : ''}
            <button class="btn sec" id="teamBtn">➕ Add to team</button>
          </div>
        </div>

        <div>
          <div class="tarjeta">
            <p style="margin-top:0">${flavor}</p>
            <div class="datos">
              <div class="dato"><small>Height</small><b>${(p.height / 10).toFixed(1)} m</b></div>
              <div class="dato"><small>Weight</small><b>${(p.weight / 10).toFixed(1)} kg</b></div>
              <div class="dato"><small>Generation</small><b>Gen ${gen.n}</b></div>
              <div class="dato"><small>Region</small><b><a href="#/region/${region.id}">${region.name}</a></b></div>
              <div class="dato"><small>Catch rate</small><b>${Number(s.capture_rate) || '—'}</b></div>
              <div class="dato"><small>Egg groups</small><b>${s.egg_groups.map(e => prettyName(e.name)).join(', ') || '—'}</b></div>
            </div>
            <h2>Abilities</h2>
            <div class="lista-chips">
              ${p.abilities.map(a => `<span class="chip">${prettyName(a.ability.name)}${a.is_hidden ? ' (hidden)' : ''}</span>`).join('')}
            </div>
          </div>

          <div class="tarjeta" style="margin-top:16px">
            <h2 style="margin-top:0">Base stats <small style="color:var(--suave)">(total ${totalStats})</small></h2>
            ${p.stats.map(st => {
              const v = Number(st.base_stat) || 0;
              const color = v < 60 ? '#f34444' : v < 90 ? '#ffb000' : v < 120 ? '#3fa129' : '#2980ef';
              return `<div class="stat"><span>${has(STAT_NAMES, st.stat.name) ? STAT_NAMES[st.stat.name] : prettyName(st.stat.name)}</span><b>${v}</b>
                <div class="barra"><div style="width:${Math.min(100, v / 2.55)}%;background:${color}"></div></div></div>`;
            }).join('')}
          </div>

          <div class="tarjeta" style="margin-top:16px">
            <h2 style="margin-top:0">Type effectiveness</h2>
            ${matchups.map(([label, types]) => `
              <div class="eficacia"><span>${label}</span><div class="tipos-fila">${types.map(typeBadge).join('')}</div></div>`).join('')}
            <p class="nota">Based on type only; abilities like Levitate or Flash Fire can change this.</p>
          </div>
        </div>
      </div>

      ${stages.length > 1 ? `
        <h2>Evolution chain</h2>
        <div class="evoluciones">
          ${stages.map(st => `<div class="evoluciones">${st.map(pokeCard).join('')}</div>`).join('<span class="flecha">→</span>')}
        </div>` : ''}

      ${exclusiveIn.length ? `<h2>Version exclusive in</h2><div class="lista-chips">${exclusiveIn.join('')}</div>` : ''}

      <h2>Where to find</h2>
      <div id="donde">${loading('Loading locations…')}</div>

      <h2>Moves</h2>
      <details class="tarjeta desplegable" id="movesBox">
        <summary>Show the moves ${name} can learn <small>by game: level-up, TM/HM, egg and tutor</small></summary>
        <div class="cuerpo-lugar" id="moves"></div>
      </details>

      <div class="navpoke">
        ${id > 1 ? `<a class="btn sec" href="#/pokemon/${id - 1}">← ${pad(id - 1)} ${nameOf(id - 1)}</a>` : '<span></span>'}
        ${id < TOTAL ? `<a class="btn sec" href="#/pokemon/${id + 1}">${nameOf(id + 1)} ${pad(id + 1)} →</a>` : ''}
      </div>`,
    mount() {
      let shiny = false;
      const art = document.getElementById('art');
      const btn = document.getElementById('shinyBtn');
      btn.onclick = () => {
        shiny = !shiny;
        art.src = artwork(id, shiny);
        btn.textContent = shiny ? '🎨 View normal' : '✨ View shiny';
      };
      const cryBtn = document.getElementById('cryBtn');
      if (cryBtn) cryBtn.onclick = () => {
        const a = new Audio(cry);
        a.volume = 0.4;
        a.play().catch(() => { cryBtn.textContent = '🔇 Cry unavailable'; cryBtn.disabled = true; });
      };
      document.getElementById('teamBtn').onclick = () => {
        const ids = loadSavedTeam();
        if (ids.length >= TEAM_SIZE && !ids.includes(id)) { alert('Your team is full. Remove a Pokémon first.'); return; }
        location.hash = teamHash([...new Set([...ids, id])], loadSavedGame());
      };
      loadWhereToFind(id);
      const movesBox = document.getElementById('movesBox');
      movesBox.addEventListener('toggle', () => {
        if (movesBox.open && !movesBox.dataset.loaded) { movesBox.dataset.loaded = '1'; renderMoves(p); }
      });
    },
  };
}

// ---------- Moves ----------
// The move list for every game comes with /pokemon/{id}. Type, power and so on need one /move request
// per move, so they are only fetched for the tab being shown (a few at a time) and cached trimmed.

const MOVE_TABS = { 'level-up': 'Level-up', machine: 'TM / HM', egg: 'Egg moves', tutor: 'Tutor' };
const VG_LIST = GAMES.filter(g => has(VERSION_GROUPS, g.id)).map(g => ({ vg: VERSION_GROUPS[g.id], game: g })); // oldest first
// Before Gen 4, a damaging move was physical or special depending on its type.
const PHYSICAL_TYPES = new Set(['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel']);
const CATEGORY = { physical: 'Physical', special: 'Special', status: 'Status' };
const movesView = { vg: '', tab: 'level-up' }; // remembered while browsing, so the next Pokémon opens the same way

// Full move records are 50–120 KB (mostly the list of every Pokémon that learns them); keep only what the table shows.
const slimMove = m => ({
  name: ((m.names || []).find(n => n.language.name === 'en') || {}).name || rawPretty(m.name),
  type: m.type && m.type.name,
  cls: m.damage_class && m.damage_class.name,
  power: m.power, accuracy: m.accuracy, pp: m.pp,
  past: (m.past_values || []).map(v => ({ vg: v.version_group.name, type: v.type && v.type.name, power: v.power, accuracy: v.accuracy, pp: v.pp })),
});
const moveInfo = slug => api(`/move/${encodeURIComponent(slug)}`, slimMove);

// A move's stats as they were in one game. PokeAPI's past values hold what applied *before* their version group,
// so apply every change made after this game, newest first, over the current values.
function moveAsOf(m, vgIndex, gen) {
  const out = { type: m.type, power: m.power, accuracy: m.accuracy, pp: m.pp };
  m.past
    .map(v => ({ ...v, i: VG_LIST.findIndex(x => x.vg === v.vg) }))
    .filter(v => v.i > vgIndex)
    .sort((a, b) => b.i - a.i)
    .forEach(v => { for (const k of ['type', 'power', 'accuracy', 'pp']) if (v[k] != null) out[k] = v[k]; });
  out.cls = m.cls !== 'status' && gen < 4 ? (PHYSICAL_TYPES.has(out.type) ? 'physical' : 'special') : m.cls;
  return out;
}

// Moves a Pokémon learns in one version group, by method.
function learnset(p, vg) {
  const out = Object.fromEntries(Object.keys(MOVE_TABS).map(k => [k, []]));
  for (const m of p.moves || []) {
    for (const d of m.version_group_details) {
      const method = d.move_learn_method.name;
      if (d.version_group.name !== vg || !has(out, method)) continue;
      const level = Number(d.level_learned_at) || 0;
      if (method === 'level-up' || !out[method].some(x => x.slug === m.move.name)) out[method].push({ slug: m.move.name, level });
    }
  }
  return out;
}

// Run fn over items with at most `limit` requests in flight; failures become null.
async function mapLimit(items, limit, fn, onDone) {
  const results = new Array(items.length);
  let next = 0, done = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]).catch(() => null);
      if (onDone) onDone(++done);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

let movesToken = 0;
function renderMoves(p, focusSelector) {
  const box = document.getElementById('moves');
  if (!box) return;
  const inGames = new Set((p.moves || []).flatMap(m => m.version_group_details.map(d => d.version_group.name)));
  const options = VG_LIST.filter(x => inGames.has(x.vg)).reverse(); // newest first
  if (!options.length) { box.innerHTML = '<p class="subtitulo">PokeAPI has no move data for this Pokémon.</p>'; return; }
  if (!options.some(x => x.vg === movesView.vg)) movesView.vg = options[0].vg;

  const sets = learnset(p, movesView.vg);
  if (!sets[movesView.tab].length) movesView.tab = Object.keys(MOVE_TABS).find(k => sets[k].length) || 'level-up';

  box.innerHTML = `
    <div class="filtros" style="margin:12px 0 4px">
      <select id="movesGame" aria-label="Game">
        ${options.map(x => `<option value="${x.vg}" ${x.vg === movesView.vg ? 'selected' : ''}>${x.game.name} (${x.game.year})</option>`).join('')}
      </select>
    </div>
    <div class="pestanas" role="group" aria-label="How the move is learned">
      ${Object.entries(MOVE_TABS).map(([k, label]) => `
        <button type="button" data-tab="${k}" class="${k === movesView.tab ? 'activa' : ''}" aria-pressed="${k === movesView.tab}" ${sets[k].length ? '' : 'disabled'}>
          ${label} <small>(${sets[k].length})</small>
        </button>`).join('')}
    </div>
    <div id="movesTable"></div>`;

  document.getElementById('movesGame').onchange = e => { movesView.vg = e.target.value; renderMoves(p, '#movesGame'); };
  box.querySelectorAll('.pestanas button').forEach(b => {
    b.onclick = () => { movesView.tab = b.dataset.tab; renderMoves(p, `[data-tab="${b.dataset.tab}"]`); };
  });
  // Redrawing replaced the control that was used; give it focus back for keyboard users.
  const again = focusSelector && box.querySelector(focusSelector);
  if (again && !again.disabled) again.focus();
  renderMoveTable(sets[movesView.tab], movesView.tab, movesView.vg);
}

async function renderMoveTable(rows, tab, vg) {
  const table = document.getElementById('movesTable');
  if (!rows.length) { table.innerHTML = '<p class="subtitulo">No moves learned this way in this game.</p>'; return; }
  const token = ++movesToken;
  table.innerHTML = loading(`Loading ${rows.length} moves…`);

  const slugs = [...new Set(rows.map(r => r.slug))];
  const infos = await mapLimit(slugs, 6, moveInfo, done => {
    if (token === movesToken && table.isConnected) table.firstElementChild.textContent = `Loading moves… ${done}/${slugs.length}`;
  });
  if (token !== movesToken || !table.isConnected) return; // another game, tab or page took over

  const vgIndex = VG_LIST.findIndex(x => x.vg === vg);
  const gen = VG_LIST[vgIndex].game.gen;
  const bySlug = new Map(slugs.map((s, i) => [s, infos[i] && { name: infos[i].name, ...moveAsOf(infos[i], vgIndex, gen) }]));
  const full = rows.map(r => ({ ...r, info: bySlug.get(r.slug) }));
  const nameOfMove = r => (r.info ? r.info.name : rawPretty(r.slug));
  full.sort((a, b) => (tab === 'level-up' ? a.level - b.level : 0) || nameOfMove(a).localeCompare(nameOfMove(b)));

  const dash = v => (v == null ? '—' : esc(Number(v)));
  const failed = full.filter(r => !r.info).length;
  table.innerHTML = `
    <div class="tabla-wrap">
      <table class="encuentros movimientos">
        <thead><tr>${tab === 'level-up' ? '<th>Lv.</th>' : ''}<th>Move</th><th>Type</th><th>Category</th><th>Power</th><th>Acc.</th><th>PP</th></tr></thead>
        <tbody>${full.map(r => `
          <tr>
            ${tab === 'level-up' ? `<td>${r.level === 0 ? 'Evo' : r.level}</td>` : ''}
            <td><b>${esc(nameOfMove(r))}</b></td>
            <td>${r.info && r.info.type ? typeBadge(r.info.type) : '—'}</td>
            <td>${r.info && has(CATEGORY, r.info.cls) ? CATEGORY[r.info.cls] : '—'}</td>
            <td>${r.info ? dash(r.info.power) : '—'}</td>
            <td>${r.info ? (r.info.accuracy == null ? '—' : `${dash(r.info.accuracy)}%`) : '—'}</td>
            <td>${r.info ? dash(r.info.pp) : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${tab === 'level-up' && full.some(r => r.level === 0) ? '<p class="nota">Evo: learned when it evolves into this Pokémon.</p>' : ''}
    ${failed ? `<p class="nota">Details for ${failed} move${failed > 1 ? 's' : ''} couldn't be loaded. Close and reopen Moves to retry.</p>` : ''}
    <p class="nota">Power, accuracy and type are shown as they were in this game. "—" means it has no fixed value.</p>`;
}

async function loadWhereToFind(id) {
  let encs;
  try { encs = await api(`/pokemon/${id}/encounters`); } catch { encs = null; }
  const box = document.getElementById('donde');
  if (!box) return; // user navigated away
  if (!encs) { box.innerHTML = '<p class="subtitulo">Could not load location data.</p>'; return; }

  const blocks = GAMES.filter(g => GUIDES[g.id]).map(g => {
    const guide = GUIDES[g.id];
    const places = encs.map(e => {
      const details = e.version_details.filter(vd => guide.versions.includes(vd.version.name)).flatMap(vd => vd.encounter_details);
      if (!details.length) return null;
      const min = Math.min(...details.map(d => d.min_level));
      const max = Math.max(...details.map(d => d.max_level));
      const methods = [...new Set(details.map(d => prettyName(d.method.name)))].join(', ');
      return `<li><b>${placeName(e.location_area.name)}</b> — ${methods}, Lv. ${min === max ? min : `${min}–${max}`}</li>`;
    }).filter(Boolean);
    guide.gifts.filter(gift => gift.id === id).forEach(gift => places.push(`<li><b>Gift</b> — ${gift.where}</li>`));
    if (!places.length) return '';
    return `
      <details class="tarjeta desplegable">
        <summary>Pokémon ${g.name} <small>${places.length} location${places.length > 1 ? 's' : ''}</small></summary>
        ${list(places)}
        <a class="chip" href="#/guide/${g.id}/locations">Open the ${g.name} guide</a>
      </details>`;
  }).join('');

  box.innerHTML = blocks || '<p class="subtitulo">No wild encounters recorded. It may only be obtainable by evolving, breeding, trading or events.</p>';
}

async function regions() {
  await loadSpecies().catch(() => {});
  return `
    <h1>Regions</h1>
    <p class="subtitulo">Each generation introduces a new region, inspired by a real-world place.</p>
    <div class="regiones">
      ${REGIONS.map(r => `
        <a class="tarjeta region" href="#/region/${r.id}">
          <div class="banda" style="background:${r.color}"></div>
          <div class="cuerpo">
            <h3>${r.name}</h3>
            <div class="meta">Gen ${r.gen} · Based on ${r.basedOn}</div>
            <div class="sprites">${r.starters.map(id => `<img loading="lazy" src="${sprite(id)}" alt="${nameOf(id)}">`).join('')}</div>
          </div>
        </a>`).join('')}
    </div>`;
}

async function regionDetail(id) {
  const r = regionById(id);
  if (!r) return notFound();
  await loadSpecies().catch(() => {});
  const gen = GENERATIONS.find(g => g.region === r.id);

  return `
    <a class="volver" href="#/regions">← All regions</a>
    <div class="cabecera-region" style="border-color:${r.color}">
      <h1>${r.name}</h1>
      <p class="subtitulo" style="margin:0">Generation ${r.gen} · Based on ${r.basedOn} · ${r.professor}</p>
    </div>
    <div class="tarjeta">
      <p style="margin-top:0">${r.description}</p>
      ${list(r.facts)}
    </div>

    <h2>Starter Pokémon</h2>
    ${miniList(r.starters)}

    <h2>Legendary & Mythical Pokémon</h2>
    ${miniList(r.legendaries)}

    <h2>Games set in ${r.name}</h2>
    <div class="lista-chips">
      ${r.games.map(gid => { const g = gameById(gid); return `<a class="chip" href="#/game/${g.id}">${g.name} (${g.year})</a>`; }).join('')}
    </div>

    ${gen ? `<h2>Pokédex</h2><a class="btn" href="#/pokedex?gen=${gen.n}">View the ${gen.to - gen.from + 1} Pokémon introduced in Gen ${gen.n}</a>` : ''}`;
}

async function games() {
  await loadSpecies().catch(() => {});
  const gens = [...new Set(GAMES.map(g => g.gen))];
  return `
    <h1>Games</h1>
    <p class="subtitulo">All main-series games in release order. Click one to see its features and version differences.</p>
    ${gens.map(n => `
      <section class="linea-gen">
        <h2>Generation ${n} <a class="chip" href="#/region/${GENERATIONS[n - 1].region}">${regionById(GENERATIONS[n - 1].region).name}</a></h2>
        <div class="juegos">
          ${GAMES.filter(g => g.gen === n).map(g => gameCard(g)).join('')}
        </div>
      </section>`).join('')}`;
}

const gameCard = (g, href = `#/game/${g.id}`) => `
  <a class="tarjeta juego" href="${href}">
    <div class="portadas">${g.cover.map(id => `<img loading="lazy" src="${artwork(id)}" alt="${nameOf(id)}">`).join('')}</div>
    <div>
      <h3>Pokémon ${g.name}</h3>
      <small>${g.year} · ${g.platform}</small><br>
      <span class="etiqueta">${g.type}</span>
    </div>
  </a>`;

async function gameDetail(id) {
  const g = gameById(id);
  if (!g) return notFound();
  await loadSpecies().catch(() => {});
  const region = regionById(g.region);
  const others = GAMES.filter(x => x.region === g.region && x.id !== g.id);

  return `
    <a class="volver" href="#/games">← All games</a>
    <div class="tarjeta juego" style="margin-bottom:20px">
      <div class="portadas">${g.cover.map(cid => `<img src="${artwork(cid)}" alt="${nameOf(cid)}" style="width:90px;height:90px">`).join('')}</div>
      <div>
        <h1>Pokémon ${g.name}</h1>
        <p class="subtitulo" style="margin:0">${g.year} · ${g.platform} · Generation ${g.gen} · <a href="#/region/${region.id}">${region.name}</a> · <span class="etiqueta">${g.type}</span></p>
        ${GUIDES[g.id] ? `<a class="btn" href="#/guide/${g.id}" style="margin-top:10px">📖 Open game guide</a>` : ''}
      </div>
    </div>

    <div class="tarjeta">
      <p style="margin-top:0">${g.summary}</p>
      <p><b>Key mechanic:</b> ${g.mechanic}</p>
      <h2>What's new</h2>
      ${list(g.features)}
      <h2>Differences</h2>
      ${list(g.differences)}
    </div>

    ${g.versions ? `
      <h2>Version exclusives</h2>
      <div class="versiones">
        ${g.versions.map(v => `<div class="tarjeta version"><h3>Pokémon ${v.name}</h3>${miniList(v.pokemon)}</div>`).join('')}
      </div>` : '<h2>Single edition</h2><p class="subtitulo">This game has only one version, so there are no version exclusives.</p>'}

    ${others.length ? `
      <h2>Other games in ${region.name}</h2>
      <div class="lista-chips">
        ${others.map(o => `<a class="chip" href="#/compare/${g.id}/${o.id}">Compare with ${o.name}</a>`).join('')}
      </div>` : ''}`;
}

async function compare(aId, bId) {
  await loadSpecies().catch(() => {});
  const a = gameById(aId) || GAMES[0];
  const b = gameById(bId) || GAMES[GAMES.length - 1];
  const options = sel => GAMES.map(g => `<option value="${g.id}" ${g.id === sel.id ? 'selected' : ''}>${g.name} (${g.year})</option>`).join('');

  const versionsText = g => g.versions ? g.versions.map(v => v.name).join(' / ') : 'Single edition';
  const rows = [
    ['Year', g => g.year],
    ['Platform', g => g.platform],
    ['Generation', g => `Gen ${g.gen}`],
    ['Region', g => `<a href="#/region/${g.region}">${regionById(g.region).name}</a>`],
    ['Type', g => g.type],
    ['Versions', versionsText],
    ['Key mechanic', g => g.mechanic],
    ['Cover Pokémon', g => g.cover.map(id => `<img src="${artwork(id)}" alt="${nameOf(id)}" title="${nameOf(id)}">`).join('')],
    ['What\'s new', g => list(g.features)],
    ['Differences', g => list(g.differences)],
  ];

  return {
    html: `
      <h1>Compare games</h1>
      <p class="subtitulo">Pick two games to see them side by side. Highlighted rows are different.</p>
      <div class="selectores">
        <select class="sel" id="selA" aria-label="First game">${options(a)}</select>
        <span class="vs">VS</span>
        <select class="sel" id="selB" aria-label="Second game">${options(b)}</select>
      </div>
      <div class="tabla-wrap">
        <table class="comparar">
          <thead><tr><th></th><td><a href="#/game/${a.id}">Pokémon ${a.name}</a></td><td><a href="#/game/${b.id}">Pokémon ${b.name}</a></td></tr></thead>
          <tbody>
            ${rows.map(([label, fn]) => {
              const va = fn(a), vb = fn(b);
              const cls = va !== vb ? ' class="distinto"' : '';
              return `<tr><th>${label}</th><td${cls}>${va}</td><td${cls}>${vb}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`,
    mount() {
      const selA = document.getElementById('selA');
      const selB = document.getElementById('selB');
      selA.onchange = selB.onchange = () => { location.hash = `#/compare/${selA.value}/${selB.value}`; };
    },
  };
}

// ---------- Game guides ----------

async function guides() {
  await loadSpecies().catch(() => {});
  const gens = [...new Set(GAMES.map(g => g.gen))];
  return `
    <h1>Game guides</h1>
    <p class="subtitulo">Walkthroughs, routes, wild Pokémon locations, key items and gift Pokémon for each game.</p>
    ${gens.map(n => `
      <section class="linea-gen">
        <h2>Generation ${n}</h2>
        <div class="juegos">
          ${GAMES.filter(g => g.gen === n && GUIDES[g.id]).map(g => gameCard(g, `#/guide/${g.id}`)).join('')}
        </div>
      </section>`).join('')}`;
}

const GUIDE_TABS = { walkthrough: 'Walkthrough', locations: 'Routes & wild Pokémon', items: 'Items & gifts' };

async function guideView(id, tab = 'walkthrough') {
  const g = gameById(id);
  const guide = has(GUIDES, id) && GUIDES[id];
  if (!g || !guide || !has(GUIDE_TABS, tab)) return notFound();
  await loadSpecies().catch(() => {});

  const header = `
    <a class="volver" href="#/game/${g.id}">← Pokémon ${g.name}</a>
    <h1>Pokémon ${g.name} guide</h1>
    <p class="subtitulo">${g.year} · ${g.platform} · ${guide.regions.map(r => regionById(r) ? `<a href="#/region/${r}">${regionById(r).name}</a>` : cap(r)).join(' & ')}</p>
    <div class="pestanas">
      ${Object.entries(GUIDE_TABS).map(([k, label]) => `<a href="#/guide/${g.id}/${k}" class="${k === tab ? 'activa' : ''}">${label}</a>`).join('')}
    </div>`;

  if (tab === 'walkthrough') return header + guideWalkthrough(guide);
  if (tab === 'items') return header + guideItems(guide);
  return guideLocations(g, guide, header);
}

function guideWalkthrough(guide) {
  if (!guide.milestones.length) return '<p class="subtitulo">No walkthrough data for this game yet.</p>';
  return guide.milestones.map(sec => `
    <h2>${sec.title}</h2>
    <div class="hitos">
      ${sec.list.map((m, i) => `
        <div class="tarjeta hito">
          <div class="paso">${i + 1}</div>
          <div>
            <b>${m.who}</b> ${m.type ? typeBadge(m.type) : ''}
            ${m.where ? `<div class="donde">📍 ${m.where}</div>` : ''}
            ${m.reward ? `<div class="donde">🏅 ${m.reward}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>`).join('');
}

function guideItems(guide) {
  const items = guide.items.length ? `
    <div class="tabla-wrap">
      <table class="comparar">
        <thead><tr><th>Item</th><td><b>Where to get it</b></td></tr></thead>
        <tbody>${guide.items.map(it => `<tr><th>${it.name}</th><td>${it.where}</td></tr>`).join('')}</tbody>
      </table>
    </div>` : '<p class="subtitulo">No key-item list for this game yet.</p>';

  const gifts = guide.gifts.length ? `
    <div class="regalos">
      ${guide.gifts.map(gift => `
        <a class="tarjeta regalo" href="#/pokemon/${gift.id}">
          <img loading="lazy" src="${sprite(gift.id)}" alt="${nameOf(gift.id)}" ${imgFallback(gift.id)}>
          <div><b>${nameOf(gift.id)}</b><div class="donde">${gift.where}</div></div>
        </a>`).join('')}
    </div>` : '<p class="subtitulo">No gift Pokémon listed for this game yet.</p>';

  return `<h2>Key items & HMs</h2>${items}<h2>Gift Pokémon</h2>${gifts}`;
}

async function guideLocations(g, guide, header) {
  const regions = await Promise.all(guide.regions.map(r => api(`/region/${r}`).catch(() => null)));
  const routeNum = name => Number((name.match(/route-(\d+)/) || [])[1]);

  const sections = regions.map((reg, i) => {
    if (!reg || !reg.locations.length) {
      return `<h2>${esc(cap(guide.regions[i]))}</h2><p class="subtitulo">PokeAPI has no location list for this region.</p>`;
    }
    const routes = reg.locations.filter(l => routeNum(l.name)).sort((a, b) => routeNum(a.name) - routeNum(b.name));
    const places = reg.locations.filter(l => !routeNum(l.name)).sort((a, b) => placeName(a.name).localeCompare(placeName(b.name)));
    const block = (title, locs) => locs.length ? `
      <h3>${title} <small>(${locs.length})</small></h3>
      ${locs.map(l => `
        <details class="tarjeta desplegable lugar" data-loc="${esc(l.name)}">
          <summary>${placeName(l.name)}</summary>
          <div class="cuerpo-lugar"></div>
        </details>`).join('')}` : '';
    return `<h2>${regionById(reg.name) ? regionById(reg.name).name : esc(cap(reg.name))}</h2>${block('Routes', routes)}${block('Towns, caves & other places', places)}`;
  }).join('');

  return {
    html: `${header}
      <p class="subtitulo">Open a location to see which wild Pokémon appear there in this game, how to find them and at what level. Encounter data comes from PokeAPI; newer games may have little or none.</p>
      <div class="filtros"><input id="lugarQ" type="search" placeholder="Filter locations: Route 3, Mt. Moon…" aria-label="Filter locations"></div>
      ${sections}`,
    mount() {
      const q = document.getElementById('lugarQ');
      q.oninput = () => {
        const term = q.value.trim().toLowerCase();
        document.querySelectorAll('.lugar').forEach(d => {
          d.hidden = term && !d.querySelector('summary').textContent.toLowerCase().includes(term);
        });
      };
      document.querySelectorAll('.lugar').forEach(d => {
        d.addEventListener('toggle', () => {
          if (!d.open || d.dataset.loaded) return;
          d.dataset.loaded = '1';
          const body = d.querySelector('.cuerpo-lugar');
          body.innerHTML = loading();
          locationEncounters(d.dataset.loc, g, guide)
            .then(html => { body.innerHTML = html; })
            .catch(() => { delete d.dataset.loaded; body.innerHTML = '<p class="error">Could not load this location. Close and reopen it to retry.</p>'; });
        });
      });
    },
  };
}

async function locationEncounters(slug, g, guide) {
  const loc = await api(`/location/${encodeURIComponent(slug)}`);
  const areas = await Promise.all(loc.areas.map(a => api(a.url)));
  const labels = versionLabels(g, guide);

  const html = areas.map(area => {
    const rows = encounterRows(area.pokemon_encounters, guide.versions);
    if (!rows.length) return '';
    const sub = area.name.startsWith(loc.name + '-') ? placeName(area.name.slice(loc.name.length + 1)) : '';
    return `
      ${sub && sub !== 'Area' ? `<h4>${sub}</h4>` : ''}
      <div class="tabla-wrap">
        <table class="encuentros">
          <thead><tr><th>Pokémon</th><th>Method</th><th>Levels</th><th>Rate</th></tr></thead>
          <tbody>${rows.map(r => encounterRow(r, guide, labels)).join('')}</tbody>
        </table>
      </div>`;
  }).join('');

  return html || '<p class="subtitulo">No wild Pokémon recorded here for this game.</p>';
}

// Merge PokeAPI encounter slots into one row per Pokémon + method + conditions.
function encounterRows(encounters, versions) {
  const rows = new Map();
  for (const e of encounters) {
    const pid = idFromUrl(e.pokemon.url);
    for (const vd of e.version_details) {
      if (!versions.includes(vd.version.name)) continue;
      for (const d of vd.encounter_details) {
        const cond = d.condition_values.map(c => c.name).sort();
        const key = `${pid}|${d.method.name}|${cond.join(',')}`;
        let r = rows.get(key);
        if (!r) rows.set(key, r = { pid, name: e.pokemon.name, method: d.method.name, cond, min: d.min_level, max: d.max_level, chance: {} });
        r.min = Math.min(r.min, d.min_level);
        r.max = Math.max(r.max, d.max_level);
        r.chance[vd.version.name] = Math.min(100, (r.chance[vd.version.name] || 0) + d.chance);
      }
    }
  }
  return [...rows.values()].sort((a, b) => a.method.localeCompare(b.method) || a.pid - b.pid);
}

function encounterRow(r, guide, labels) {
  const name = r.pid <= TOTAL ? nameOf(r.pid) : prettyName(r.name);
  const img = `<img loading="lazy" src="${sprite(r.pid)}" alt="${name}">`;
  const found = Object.keys(r.chance);
  const only = guide.versions.length > 1 && found.length < guide.versions.length
    ? found.map(v => `<span class="etiqueta">${labels[v]} only</span>`).join(' ') : '';
  const rates = [...new Set(found.map(v => r.chance[v]))];
  return `
    <tr>
      <td class="poke-celda">${r.pid <= TOTAL ? `<a href="#/pokemon/${r.pid}">${img}${name}</a>` : `${img}${name}`} ${only}</td>
      <td>${prettyName(r.method)}${r.cond.length ? `<br><small>${r.cond.map(prettyName).join(', ')}</small>` : ''}</td>
      <td>${r.min === r.max ? r.min : `${r.min}–${r.max}`}</td>
      <td>${rates.map(c => `${c}%`).join(' / ')}</td>
    </tr>`;
}

// ---------- Team builder ----------

const TEAM_SIZE = 6;
const TEAM_KEY = 'pokeinfo-team'; // not under STORE_PREFIX, so clearing the API cache keeps it

function loadSavedTeam() {
  try { return (JSON.parse(localStorage.getItem(TEAM_KEY)) || []).filter(Number.isInteger); } catch { return []; }
}
function saveTeam(ids) {
  try { localStorage.setItem(TEAM_KEY, JSON.stringify(ids)); } catch { /* team just won't be remembered */ }
}

const TEAM_GAME_KEY = 'pokeinfo-team-game';
function loadSavedGame() {
  try { const g = localStorage.getItem(TEAM_GAME_KEY); return has(GUIDES, g) ? g : ''; } catch { return ''; }
}
function saveGame(gameId) {
  try { localStorage.setItem(TEAM_GAME_KEY, gameId); } catch { /* not remembered */ }
}
const teamHash = (ids, gameId) => `#/team/${ids.join(',')}${gameId ? `/${gameId}` : ''}`;

// Species in a game's regional Pokédex(es), or null if PokeAPI doesn't have them.
async function gamePokedex(gameId) {
  const vg = await api(`/version-group/${VERSION_GROUPS[gameId]}`);
  const dexes = await Promise.all(vg.pokedexes.filter(d => d.name !== 'national').map(d => api(d.url)));
  const ids = new Set(dexes.flatMap(d => d.pokemon_entries.map(e => idFromUrl(e.pokemon_species.url))).filter(id => id <= TOTAL));
  return ids.size ? ids : null;
}

// A Pokémon's types as of a given generation (e.g. Clefairy was Normal before Gen 6).
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };
function typesInGen(p, gen) {
  const past = (p.past_types || [])
    .map(pt => ({ gen: ROMAN[pt.generation.name.replace('generation-', '')], types: pt.types }))
    .filter(pt => pt.gen >= gen)
    .sort((a, b) => a.gen - b.gen)[0];
  return (past ? past.types : p.types).map(t => t.type.name);
}
// Types that existed in a generation: Dark and Steel arrived in Gen 2, Fairy in Gen 6.
const typesOfGen = gen => Object.keys(TYPE_CHART)
  .filter(t => !(t === 'fairy' && gen < 6) && !((t === 'dark' || t === 'steel') && gen < 2));

const MULT_LABEL = { 4: '×4', 2: '×2', 1: '', 0.5: '½', 0.25: '¼', 0: '0' };
const MULT_CLASS = { 4: 'x4', 2: 'x2', 1: '', 0.5: 'x05', 0.25: 'x025', 0: 'x0' };

async function team(param, gameParam) {
  await loadSpecies();
  // The URL is the source of truth so teams can be shared; #/team alone restores the saved one.
  const ids = param === undefined
    ? loadSavedTeam()
    : [...new Set(param.split(',').map(Number))].filter(id => id >= 1 && id <= TOTAL).slice(0, TEAM_SIZE);
  const gameId = param === undefined ? loadSavedGame() : (has(GUIDES, gameParam) ? gameParam : '');
  saveTeam(ids);
  saveGame(gameId);
  if (param === undefined && (ids.length || gameId)) history.replaceState(null, '', teamHash(ids, gameId));

  const game = gameById(gameId);
  const gen = game ? game.gen : GENERATIONS.length;
  const [mons, available] = await Promise.all([
    Promise.all(ids.map(id => api(`/pokemon/${id}`))),
    game ? gamePokedex(gameId).catch(() => null) : null,
  ]);
  const members = ids.map((id, i) => ({ id, types: typesInGen(mons[i], gen) }));
  const go = (list, g = gameId) => { location.hash = teamHash(list, g); };
  const pool = available ? [...available] : [...speciesNames.keys()];

  const gameNote = !game ? ''
    : available ? `Suggestions are limited to the ${available.size} Pokémon in the ${game.name} regional Pokédex. Some games let you catch more after the story.`
    : `Couldn't load the ${game.name} Pokédex, so all Pokémon are suggested.`;

  const slots = Array.from({ length: TEAM_SIZE }, (_, i) => {
    const m = members[i];
    if (!m) return '<div class="slot vacio">Empty slot</div>';
    return `
      <div class="tarjeta slot">
        <button class="quitar" data-id="${m.id}" aria-label="Remove ${nameOf(m.id)}">✕</button>
        <a href="#/pokemon/${m.id}"><img src="${sprite(m.id)}" alt="${nameOf(m.id)}" ${imgFallback(m.id)}></a>
        <b>${nameOf(m.id)}</b>
        <div class="tipos-fila">${m.types.map(typeBadge).join('')}</div>
        ${available && !available.has(m.id) ? `<span class="etiqueta aviso">Not in ${game.name}</span>` : ''}
      </div>`;
  }).join('');

  let analysis = '<p class="subtitulo">Add Pokémon to see your team\'s weaknesses and type coverage.</p>';
  if (members.length) {
    const allTypes = typesOfGen(gen);
    const defs = members.map(m => defenses(m.types));
    const rows = allTypes.map(atk => {
      const vals = defs.map(d => d[atk]);
      return { atk, vals, weak: vals.filter(v => v > 1).length, resist: vals.filter(v => v < 1).length };
    });
    const threats = rows.filter(r => r.weak >= 2 && r.weak > r.resist).sort((a, b) => b.weak - a.weak || a.resist - b.resist);
    const covered = allTypes.filter(def => members.some(m => m.types.some(t => has(TYPE_CHART, t) && TYPE_CHART[t].double.includes(def))));
    const uncovered = allTypes.filter(t => !covered.includes(t));

    analysis = `
      <div class="resumen">
        <div class="tarjeta">
          <h3>⚠️ Biggest threats</h3>
          ${threats.length
            ? threats.map(r => `<div class="amenaza">${typeBadge(r.atk)} <span>${r.weak} weak · ${r.resist} resist</span></div>`).join('')
            : '<p class="subtitulo" style="margin:0">No type hits more than one of your Pokémon without being resisted. Nice balance!</p>'}
        </div>
        <div class="tarjeta">
          <h3>🎯 Offensive coverage <small>${covered.length}/${allTypes.length}</small></h3>
          <p class="nota" style="margin:0 0 8px">Types your team's own types hit super-effectively (same-type moves only).</p>
          ${uncovered.length
            ? `<div class="donde">Not covered:</div><div class="tipos-fila">${uncovered.map(typeBadge).join('')}</div>`
            : '<p style="margin:0">Every type is covered!</p>'}
        </div>
      </div>

      <h2>Weakness chart</h2>
      <p class="subtitulo">Damage each attacking type deals to each team member.${gen < 6 ? ' Uses the modern type chart; a few matchups were different in older games.' : ''}</p>
      <div class="tabla-wrap">
        <table class="defensa">
          <thead><tr><th>Attack</th>${members.map(m => `<th><img src="${sprite(m.id)}" alt="${nameOf(m.id)}" title="${nameOf(m.id)}"></th>`).join('')}<th>Weak</th><th>Resist</th></tr></thead>
          <tbody>${rows.map(r => `
            <tr>
              <td>${typeBadge(r.atk)}</td>
              ${r.vals.map(v => `<td class="${MULT_CLASS[v]}">${MULT_LABEL[v]}</td>`).join('')}
              <td class="${r.weak >= 3 ? 'alerta' : ''}">${r.weak || ''}</td>
              <td>${r.resist || ''}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  return {
    html: `
      <h1>Team builder</h1>
      <p class="subtitulo">Build a team of up to ${TEAM_SIZE} Pokémon and check its weaknesses. Your team is saved in this browser, and you can share the page link.</p>
      <div class="filtros">
        <select id="gameSel" aria-label="Game">
          <option value="">Any game (all Pokémon)</option>
          ${GAMES.filter(g => GUIDES[g.id]).map(g => `<option value="${g.id}" ${g.id === gameId ? 'selected' : ''}>${g.name} (${g.year})</option>`).join('')}
        </select>
      </div>
      ${gameNote ? `<p class="nota" style="margin:-10px 0 16px">${gameNote}</p>` : ''}
      <form class="filtros" id="addForm">
        <input id="addQ" list="nombres" aria-label="Add a Pokémon by name or number" placeholder="${ids.length >= TEAM_SIZE ? 'Team is full' : 'Add a Pokémon: name or number…'}" ${ids.length >= TEAM_SIZE ? 'disabled' : ''}>
        <datalist id="nombres">${pool.map(id => `<option value="${nameOf(id)}">`).join('')}</datalist>
        <button class="btn" ${ids.length >= TEAM_SIZE ? 'disabled' : ''}>Add</button>
        <button type="button" class="btn sec" id="randomTeam">🎲 Random team</button>
        ${ids.length ? '<button type="button" class="btn sec" id="clearTeam">Clear</button>' : ''}
      </form>
      <div class="equipo">${slots}</div>
      ${analysis}`,
    mount() {
      const q = document.getElementById('addQ');
      const byName = new Map([...speciesNames].map(([id, n]) => [n.toLowerCase(), id]));
      const add = () => {
        const text = q.value.trim().toLowerCase().replace(/^#0*/, '');
        const id = byName.get(text) || (Number(text) >= 1 && Number(text) <= TOTAL ? Number(text) : null);
        const problem = !id ? 'No Pokémon with that name or number.'
          : available && !available.has(id) ? `${rawNameOf(id)} isn't in the ${game.name} regional Pokédex.` : '';
        if (problem) { q.setCustomValidity(problem); q.reportValidity(); return; }
        go([...new Set([...ids, id])]);
      };
      document.getElementById('gameSel').onchange = e => go(ids, e.target.value);
      q.oninput = () => q.setCustomValidity('');
      q.onchange = () => { if (byName.has(q.value.trim().toLowerCase())) add(); };
      document.getElementById('addForm').onsubmit = e => { e.preventDefault(); add(); };
      document.querySelectorAll('.quitar').forEach(b => {
        b.onclick = () => go(ids.filter(id => id !== Number(b.dataset.id)));
      });
      document.getElementById('randomTeam').onclick = () => {
        const pick = new Set();
        while (pick.size < Math.min(TEAM_SIZE, pool.length)) pick.add(pool[Math.floor(Math.random() * pool.length)]);
        go([...pick]);
      };
      const clear = document.getElementById('clearTeam');
      if (clear) clear.onclick = () => go([]);
    },
  };
}

function notFound() {
  return `<div class="error"><h1>Page not found</h1><p>That page doesn't exist.</p><a class="btn" href="#/">Go home</a></div>`;
}

// ---------- Router ----------

const ROUTES = {
  '': home, pokedex, pokemon: pokemonDetail,
  regions, region: regionDetail,
  games, game: gameDetail, compare,
  guides, guide: guideView, team,
};
const NAV_SECTION = { pokemon: 'pokedex', region: 'regions', game: 'games', guide: 'guides' };
let renderToken = 0;
let lastRoute = null;

function setMenuOpen(open) {
  document.getElementById('nav').classList.toggle('abierto', open);
  document.getElementById('menuBtn').setAttribute('aria-expanded', String(open));
}

// Name the tab after the page heading, and move keyboard focus to the new page.
// On a re-render of the same page (adding to a team, changing a select) focus returns to the control that had it.
function afterRender(route, keepId) {
  const h1 = app.querySelector('h1');
  document.title = h1 && route ? `${h1.textContent.trim()} · PokéInfo` : 'PokéInfo';
  if (lastRoute === null) { lastRoute = route; return; } // first load: leave focus where the browser put it
  const keep = route === lastRoute && keepId && document.getElementById(keepId);
  lastRoute = route;
  if (keep && !keep.disabled) { keep.focus({ preventScroll: true }); return; }
  if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
}

// A malformed link (e.g. "#/pokemon/%E0") must not crash the router.
const safeDecode = s => { try { return decodeURIComponent(s); } catch { return ''; } };

async function router() {
  const [path] = location.hash.replace(/^#\/?/, '').split('?'); // the query part is read by the page itself
  const [route = '', ...params] = path.split('/').map(safeDecode);
  const section = has(NAV_SECTION, route) ? NAV_SECTION[route] : route;
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('activo', a.dataset.route === section));
  setMenuOpen(false);

  const keepId = app.contains(document.activeElement) ? document.activeElement.id : '';
  const token = ++renderToken;
  const view = has(ROUTES, route) ? ROUTES[route] : notFound;
  app.innerHTML = loading();
  window.scrollTo(0, 0);

  try {
    const result = await view(...params);
    if (token !== renderToken) return; // a newer navigation took over
    const { html, mount } = typeof result === 'string' ? { html: result } : result;
    app.innerHTML = html;
    if (mount) mount();
    afterRender(route, keepId);
  } catch (err) {
    if (token !== renderToken) return;
    console.error(err);
    app.innerHTML = `<div class="error"><h1>Something went wrong</h1><p>Could not load the data. Check your internet connection and try again.</p>
      <button class="btn" id="retryBtn">Retry</button></div>`;
    document.getElementById('retryBtn').onclick = router;
    afterRender(route, keepId);
  }
}

// ---------- Theme ----------
// index.html applies the saved choice before the page draws; with no choice, the CSS follows the system.

const THEME_KEY = 'pokeinfo-theme';
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const themeBtn = document.getElementById('themeBtn');
const currentTheme = () => document.documentElement.dataset.theme || (darkQuery.matches ? 'dark' : 'light');

function updateThemeBtn() {
  const dark = currentTheme() === 'dark';
  themeBtn.textContent = dark ? '☀️' : '🌙';
  themeBtn.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  themeBtn.setAttribute('aria-label', themeBtn.title);
}
themeBtn.onclick = () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch { /* choice just won't be remembered */ }
  updateThemeBtn();
};
darkQuery.addEventListener('change', updateThemeBtn); // system theme changed while no choice is saved
updateThemeBtn();

document.getElementById('menuBtn').onclick =() => setMenuOpen(!document.getElementById('nav').classList.contains('abierto'));
// Missing sprite → official artwork (see imgFallback). Image errors don't bubble, so listen in the capture phase.
document.addEventListener('error', e => {
  const img = e.target;
  if (img instanceof HTMLImageElement && img.dataset.fallback) {
    const src = img.dataset.fallback;
    delete img.dataset.fallback; // only try once
    img.src = src;
  }
}, true);

window.addEventListener('hashchange', router);
router();
