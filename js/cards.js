// Trading card game pages, with data from TCGdex (https://tcgdex.dev): every set since Base Set (1999).
// Routes: #/cards[?q=name]   #/cards/set/:setId   #/card/:cardId
// The Pokémon page's "Trading cards" box uses renderPokemonCards().
//
// This file is loaded before app.js and uses its helpers (api, esc, tr, …) only from inside functions.
// Card data is fetched live, so new sets appear on their own.

const TCG_ASSETS = 'https://assets.tcgdex.net/';
const CARD_ID = /^[A-Za-z0-9.-]{1,60}$/; // e.g. base1-4, sv03.5-199, dp7-SH1
const SET_ID = /^[A-Za-z0-9.-]{1,40}$/;
const PRICE_AGE = 24 * 60 * 60 * 1000; // card records include prices, so keep them for a day, not a week

// Energy colours, keyed by both the English and the Spanish type names TCGdex uses.
const ENERGY_COLORS = {
  Grass: '#3fa129', Planta: '#3fa129', Fire: '#e62829', Fuego: '#e62829', Water: '#2980ef', Agua: '#2980ef',
  Lightning: '#d9a400', Rayo: '#d9a400', Psychic: '#a150b4', 'Psíquico': '#a150b4', Fighting: '#c0602b', Lucha: '#c0602b',
  Darkness: '#3b3f4a', Oscura: '#3b3f4a', Metal: '#7b8d99', 'Metálica': '#7b8d99', Fairy: '#e66aa8', Hada: '#e66aa8',
  Dragon: '#b8952b', 'Dragón': '#b8952b', Colorless: '#a4a4a4', Incolora: '#a4a4a4',
};
const TCG_TYPES = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'];
const TCG_CATEGORIES = ['Pokemon', 'Trainer', 'Energy'];

const tcgUrl = (lang, path) => `${TCG}/${lang}${path}`;
const isMissing = err => /HTTP 404/.test(String(err && err.message));

// A set in the site's language. In Spanish, TCGdex often has the set's name but not its cards, so the
// English card list is used, with Spanish names for the cards that have them.
async function tcgSet(setId) {
  const path = `/sets/${encodeURIComponent(setId)}`;
  const [en, es] = await Promise.all([
    api(tcgUrl('en', path)).catch(err => { if (isMissing(err)) return null; throw err; }),
    isEs() ? api(tcgUrl('es', path)).catch(() => null) : null,
  ]);
  if (!en && !es) return null;
  if (!es) return en;
  if (!en) return es;
  const esCards = new Map(validCards(es.cards).map(c => [c.id, c]));
  const cards = validCards(en.cards).map(c => esCards.get(c.id) || c);
  validCards(es.cards).forEach(c => { if (!cards.some(x => x.id === c.id)) cards.push(c); });
  return { ...en, ...es, cardCount: en.cardCount || es.cardCount, cards };
}

// In Spanish, try the Spanish card or set first. Many older cards were never printed in Spanish,
// so fall back to English; remember the misses so they aren't asked for again in this visit.
const spanishMisses = new Set();
async function tcgGet(path, maxAge) {
  if (isEs() && !spanishMisses.has(path)) {
    try { return await api(tcgUrl('es', path), undefined, maxAge); } catch { spanishMisses.add(path); }
  }
  return api(tcgUrl('en', path), undefined, maxAge);
}

// Only use image and logo addresses on TCGdex's own image server.
const tcgAsset = (url, file) => (typeof url === 'string' && url.startsWith(TCG_ASSETS) ? `${url}${file}` : null);
// About 7% of cards have no picture on TCGdex, and a few of its pictures fail to load. For those, try other
// sources in order: the Pokémon TCG API's image server, then TCGdex's own copy of the card in another language.
// Checked set by set in November 2026; sets not listed here had no picture anywhere.
//   ptcg:  the set's id on images.pokemontcg.io      langs/serie: TCGdex languages that have the picture
const PTCG_IMAGES = 'https://images.pokemontcg.io/';
const IMAGE_FALLBACKS = {
  '2011bw': { ptcg: 'mcd11' }, '2012bw': { ptcg: 'mcd12' }, '2016xy': { ptcg: 'mcd16' }, '2019sm': { ptcg: 'mcd19' },
  '2021swsh': { ptcg: 'mcd21' }, '2022swsh': { ptcg: 'mcd22' }, bog: { ptcg: 'bp' }, bwp: { ptcg: 'bwp' }, ecard3: { ptcg: 'ecard3' },
  hgssp: { ptcg: 'hsp' }, pop6: { ptcg: 'pop6' }, 'sm3.5': { ptcg: 'sm35' }, sm6: { ptcg: 'sm6' }, 'sm7.5': { ptcg: 'sm75' },
  smp: { ptcg: 'smp' }, sve: { ptcg: 'sve' }, svp: { ptcg: 'svp' }, 'swsh4.5sv': { ptcg: 'swsh45sv' }, swsh9tg: { ptcg: 'swsh9tg' },
  swsh10tg: { ptcg: 'swsh10tg' }, swsh11tg: { ptcg: 'swsh11tg' }, swsh12tg: { ptcg: 'swsh12tg' }, 'swsh12.5gg': { ptcg: 'swsh12pt5gg' },
  swshp: { ptcg: 'swshp' }, xyp: { ptcg: 'xyp' },
  'tk-ex-latia': { ptcg: 'tk1a' }, 'tk-ex-latio': { ptcg: 'tk1b' }, 'tk-ex-p': { ptcg: 'tk2a' }, 'tk-ex-m': { ptcg: 'tk2b' },
  ecard2: { serie: 'ecard', langs: ['fr'] }, pl2: { serie: 'pl', langs: ['fr'] }, sm2: { serie: 'sm', langs: ['fr'] }, xy8: { serie: 'xy', langs: ['fr'] },
  'tk-bw-e': { serie: 'tk', langs: ['es', 'it'] }, 'tk-bw-z': { serie: 'tk', langs: ['es', 'it'] },
  'tk-sm-l': { serie: 'tk', langs: ['it', 'es'] }, 'tk-sm-r': { serie: 'tk', langs: ['it', 'es'] },
  ...Object.fromEntries(['b', 'latia', 'latio', 'n', 'p', 'su', 'sy', 'w'].map(k => [`tk-xy-${k}`, { serie: 'tk', langs: ['it', 'es'] }])),
};
// The Pokémon TCG API's id for a TCGdex set that isn't listed above ("sv03.5" → "sv3pt5", "sm7.5" → "sm75").
const ptcgSetId = id => {
  const sv = id.match(/^sv0?(\d+)(\.5)?$/);
  if (sv) return `sv${sv[1]}${sv[2] ? 'pt5' : ''}`;
  return id.replace(/^swsh12\.5/, 'swsh12pt5').replace(/\./g, '');
};

// Every address worth trying for a card's picture, best first. quality: 'low' for grids, 'high' for the card page.
function cardSources(c, quality = 'low') {
  if (!c || typeof c.id !== 'string' || !CARD_ID.test(c.id)) return [];
  const setId = setIdOfCard(c.id);
  const rule = has(IMAGE_FALLBACKS, setId) ? IMAGE_FALLBACKS[setId] : {};
  const num = String(c.localId || '');
  const out = [];
  const own = tcgAsset(c.image, `/${quality}.webp`);
  if (own) out.push(own);
  // Pokémon TCG API: for listed sets, or as a backup when a TCGdex picture fails to load.
  const ptcg = rule.ptcg || (own ? ptcgSetId(setId) : null);
  if (ptcg && num) {
    const file = quality === 'high' ? '_hires.png' : '.png';
    // It sometimes numbers cards without leading zeros ("001" → "1", "H01" → "H1").
    [...new Set([num, num.replace(/^([A-Za-z]*)0+(?=\d)/, '$1')])]
      .forEach(n => out.push(`${PTCG_IMAGES}${encodeURIComponent(ptcg)}/${encodeURIComponent(n)}${file}`));
  }
  (rule.langs || []).forEach(lang => {
    if (num) out.push(`${TCG_ASSETS}${lang}/${rule.serie}/${encodeURIComponent(setId)}/${encodeURIComponent(num)}/${quality}.webp`);
  });
  return out;
}

// A card picture that tries each source in turn (see the image-error listener in app.js), ending with a
// "no picture" card if none works.
function cardImg(c, quality, attrs) {
  const [first, ...rest] = cardSources(c, quality);
  if (!first) return noPicture(c, quality === 'high');
  return `<img src="${esc(first)}" alt="${cardText(c.name)}" ${attrs} data-fallbacks="${esc(rest.join(' '))}" data-missing="${cardText(c.name)}" data-missing-big="${quality === 'high' ? '1' : ''}">`;
}
const noPicture = (c, big) => `
  <div class="carta-sin${big ? ' grande' : ''}" role="img" aria-label="${cardText(c.name)}: ${tr('no picture available')}">
    <b>${cardText(c.name)}</b><small>${tr('No picture available')}</small>
  </div>`;
const setIdOfCard = id => id.slice(0, id.lastIndexOf('-'));

const energyColor = t => (has(ENERGY_COLORS, t) ? ENERGY_COLORS[t] : '#888');
const energyDot = t => `<span class="energia" style="background:${energyColor(t)}" role="img" aria-label="${esc(t)}" title="${esc(t)}">${esc(String(t).charAt(0))}</span>`;
const energyBadge = t => `<span class="tipo" style="background:${energyColor(t)}">${esc(t)}</span>`;
const cardText = v => esc(String(v == null ? '' : v));
const stageText = s => esc(String(s).replace(/^Stage(\d)$/, 'Stage $1'));

// All sets, oldest first (TCGdex lists them in release order), with Spanish names when available.
async function tcgSets() {
  const en = await api(tcgUrl('en', '/sets'));
  const es = isEs() ? await api(tcgUrl('es', '/sets')).catch(() => []) : [];
  const esName = new Map(es.map(s => [s.id, s.name]));
  return new Map(en.filter(s => SET_ID.test(s.id)).map((s, order) => [s.id, { ...s, name: esName.get(s.id) || s.name, order }]));
}

// A card in a grid, with its "I have this card" button (js/collection.js).
const cardTile = (c, setName) => `
  <div class="carta-item" data-id="${esc(c.id)}" data-name="${cardText(String(c.name).toLowerCase())}">
    <a class="carta" href="#/card/${esc(c.id)}">
      ${cardImg(c, 'low', 'loading="lazy" width="245" height="342"')}
      <span class="carta-nom">${cardText(c.name)}</span>
      <small>${setName ? `${cardText(setName)} · ` : ''}#${cardText(c.localId)}</small>
    </a>
    ${ownButton(c)}
  </div>`;
const validCards = list => (Array.isArray(list) ? list : []).filter(c => c && typeof c.id === 'string' && CARD_ID.test(c.id));

// Card search by name, in the site's language and in English (merged, newest sets first).
async function searchCards(q) {
  const path = `/cards?name=${encodeURIComponent(q)}`;
  const [en, es, sets] = await Promise.all([
    api(tcgUrl('en', path)).catch(() => []),
    isEs() ? api(tcgUrl('es', path)).catch(() => []) : [],
    tcgSets(),
  ]);
  const byId = new Map(validCards(en).map(c => [c.id, c]));
  validCards(es).forEach(c => byId.set(c.id, c));
  return sortBySet([...byId.values()], sets);
}
const sortBySet = (cards, sets) => cards.sort((a, b) => {
  const sa = sets.get(setIdOfCard(a.id)), sb = sets.get(setIdOfCard(b.id));
  return (sb ? sb.order : -1) - (sa ? sa.order : -1) || String(a.localId).localeCompare(String(b.localId), undefined, { numeric: true });
});

// ---------- #/cards: every series and set, plus search ----------

async function cardsView(sub, setId) {
  if (sub === 'set') return cardSetView(setId);
  if (sub !== undefined) return notFound();

  const q = (new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '').trim().slice(0, 50);
  const seriesList = await api(tcgUrl('en', '/series'));
  const [details, sets, results, esSeries] = await Promise.all([
    mapLimit(seriesList.map(s => s.id).filter(id => SET_ID.test(id)), 6, id => api(tcgUrl('en', `/series/${encodeURIComponent(id)}`))),
    tcgSets(),
    q ? searchCards(q) : null,
    isEs() ? api(tcgUrl('es', '/series')).catch(() => []) : [],
  ]);
  const seriesName = new Map(esSeries.map(x => [x.id, x.name]));
  // Oldest series first; "Miscellaneous" (no date) last.
  const series = details.filter(Boolean).sort((a, b) => (a.releaseDate ? 0 : 1) - (b.releaseDate ? 0 : 1) || String(a.releaseDate).localeCompare(String(b.releaseDate)));
  const totalSets = sets.size;
  const totalCards = [...sets.values()].reduce((n, s) => n + (Number(s.cardCount && s.cardCount.total) || 0), 0);

  const setTile = s => {
    const info = sets.get(s.id) || s;
    const logo = tcgAsset(info.logo, '.webp');
    return `
      <a class="tarjeta set" href="#/cards/set/${esc(s.id)}">
        ${logo ? `<img loading="lazy" src="${logo}" alt="">` : '<div class="set-sin">🃏</div>'}
        <b>${cardText(info.name)}</b>
        <small>${tr('{n} cards', { n: Number(info.cardCount && info.cardCount.total) || 0 })}</small>
      </a>`;
  };

  return {
    html: `
      <h1>${tr('Trading cards')}</h1>
      <p><a class="btn sec" href="#/collection">📒 ${tr('My collection')} (${loadCollection().size})</a></p>
      <p class="subtitulo">${tr('Every set of the Pokémon Trading Card Game, from Base Set (1999) to today: {sets} sets and {cards} cards. Card data and prices come from TCGdex.', { sets: totalSets, cards: totalCards.toLocaleString(LANG) })}</p>
      <form class="filtros" id="cardSearch" role="search">
        <input id="cardQ" type="search" placeholder="${tr('Search cards: Charizard, Professor Oak…')}" aria-label="${tr('Search cards by name')}" value="${esc(q)}" maxlength="50">
        <button class="btn">${tr('Search')}</button>
        ${q ? `<a class="btn sec" href="#/cards">${tr('Clear')}</a>` : ''}
      </form>
      ${results ? `
        <h2>${tr('Results for “{q}”', { q: esc(q) })} <small>(${results.length})</small></h2>
        ${results.length ? `<div class="cartas">${results.slice(0, 400).map(c => cardTile(c, (sets.get(setIdOfCard(c.id)) || {}).name)).join('')}</div>
          ${results.length > 400 ? `<p class="nota">${tr('Showing the first 400. Try a more specific name.')}</p>` : ''}`
          : `<p class="subtitulo">${tr('No cards found with that name.')}</p>`}` : ''}
      ${series.map(se => `
        <section class="linea-gen">
          <h2>${cardText(seriesName.get(se.id) || se.name)} ${se.releaseDate ? `<small>(${cardText(String(se.releaseDate).slice(0, 4))})</small>` : ''}</h2>
          <div class="sets">${(se.sets || []).filter(s => SET_ID.test(s.id)).map(setTile).join('')}</div>
        </section>`).join('')}`,
    mount() {
      document.getElementById('cardSearch').onsubmit = e => {
        e.preventDefault();
        const value = document.getElementById('cardQ').value.trim();
        location.hash = value ? `#/cards?q=${encodeURIComponent(value)}` : '#/cards';
      };
    },
  };
}

// ---------- #/cards/set/:id ----------

async function cardSetView(setId) {
  if (!SET_ID.test(setId || '')) return notFound();
  const set = await tcgSet(setId);
  if (!set) return notFound();
  const cards = validCards(set.cards);
  const logo = tcgAsset(set.logo, '.webp');
  const symbol = tcgAsset(set.symbol, '.webp');
  const count = set.cardCount || {};
  const legal = set.legal || {};
  const yes = v => (v ? '✅' : '—');

  return {
    html: `
      <a class="volver" href="#/cards">← ${tr('All sets')}</a>
      <div class="tarjeta set-cabecera">
        ${logo ? `<img class="set-logo" src="${logo}" alt="">` : ''}
        <div>
          <h1>${symbol ? `<img class="set-simbolo" src="${symbol}" alt="">` : ''}${cardText(set.name)}</h1>
          <div class="datos">
            ${set.serie ? `<div class="dato"><small>${tr('Series')}</small><b>${cardText(set.serie.name)}</b></div>` : ''}
            ${set.releaseDate ? `<div class="dato"><small>${tr('Released')}</small><b>${cardText(set.releaseDate)}</b></div>` : ''}
            <div class="dato"><small>${tr('Cards')}</small><b>${Number(count.total) || cards.length}${count.official && count.official !== count.total ? ` (${tr('{n} official', { n: Number(count.official) })})` : ''}</b></div>
            ${count.firstEd ? `<div class="dato"><small>${tr('1st Edition prints')}</small><b>${Number(count.firstEd)}</b></div>` : ''}
            ${count.holo ? `<div class="dato"><small>${tr('Holo prints')}</small><b>${Number(count.holo)}</b></div>` : ''}
            ${count.reverse ? `<div class="dato"><small>${tr('Reverse holo prints')}</small><b>${Number(count.reverse)}</b></div>` : ''}
            ${set.abbreviation && set.abbreviation.official ? `<div class="dato"><small>${tr('Code')}</small><b>${cardText(set.abbreviation.official)}</b></div>` : ''}
            <div class="dato"><small>${tr('Standard format')}</small><b>${yes(legal.standard)}</b></div>
            <div class="dato"><small>${tr('Expanded format')}</small><b>${yes(legal.expanded)}</b></div>
          </div>
        </div>
      </div>
      ${!cards.length ? `
        <div class="tarjeta aviso-vacio">
          <h2>${tr('No card list for this set yet')}</h2>
          <p>${tr('TCGdex lists this set ({n} cards) but has not added its cards yet, so there is nothing to show. It will appear here on its own once TCGdex adds them.', { n: Number(count.total) || 0 })}</p>
          <a class="btn sec" href="#/cards">← ${tr('All sets')}</a>
        </div>` : `
      <div class="filtros">
        <input id="setQ" type="search" placeholder="${tr('Filter by name…')}" aria-label="${tr('Filter cards by name')}">
        <select id="setType" aria-label="${tr('Type')}">
          <option value="">${tr('All types')}</option>
          ${TCG_TYPES.map(t => `<option value="${t}">${esc(tr(t))}</option>`).join('')}
        </select>
        <select id="setCat" aria-label="${tr('Card kind')}">
          <option value="">${tr('All cards')}</option>
          ${TCG_CATEGORIES.map(c => `<option value="${c}">${esc(tr(c === 'Pokemon' ? 'Pokémon' : c))}</option>`).join('')}
        </select>
        <select id="setOwned" aria-label="${tr('My collection')}">
          <option value="">${tr('Owned and missing')}</option>
          <option value="owned">${tr('Only cards I have')}</option>
          <option value="missing">${tr('Only cards I need')}</option>
        </select>
      </div>
      <div class="progreso" id="setProgress"></div>
      <div class="contador" id="setCount" aria-live="polite">${tr('{n} cards', { n: cards.length })}</div>
      <div class="cartas" id="setGrid">${cards.map(c => cardTile(c)).join('')}</div>`}`,
    mount() {
      const q = document.getElementById('setQ');
      if (!q) return; // empty set: no filters to wire up
      const type = document.getElementById('setType');
      const cat = document.getElementById('setCat');
      const grid = document.getElementById('setGrid');
      const counter = document.getElementById('setCount');
      const owned = document.getElementById('setOwned');
      const progress = document.getElementById('setProgress');
      const showProgress = () => { progress.innerHTML = collectionProgress(cards.filter(c => isOwned(c.id)).length, cards.length); };
      showProgress();
      let token = 0;
      // Type and kind are filtered by TCGdex (the card list has no types); the name is filtered here.
      const apply = async () => {
        const mine = ++token;
        let allowed = null;
        if (type.value || cat.value) {
          counter.textContent = tr('Filtering…');
          const params = new URLSearchParams({ 'set.id': `eq:${setId}` });
          if (type.value) params.set('types', type.value);
          if (cat.value) params.set('category', cat.value);
          const found = await api(tcgUrl('en', `/cards?${params}`)).catch(() => null);
          if (mine !== token || !grid.isConnected) return;
          if (!found) { counter.textContent = tr('Could not load the filter. Check your connection and try again.'); return; }
          allowed = new Set(validCards(found).map(c => c.id));
        }
        const term = q.value.trim().toLowerCase();
        let shown = 0;
        for (const tile of grid.children) {
          const have = isOwned(tile.dataset.id);
          const show = (!allowed || allowed.has(tile.dataset.id)) && (!term || tile.dataset.name.includes(term))
            && (!owned.value || (owned.value === 'owned') === have);
          tile.hidden = !show;
          if (show) shown++;
        }
        counter.textContent = tr('{n} cards', { n: shown });
      };
      let timer;
      q.oninput = () => { clearTimeout(timer); timer = setTimeout(apply, 150); };
      type.onchange = cat.onchange = owned.onchange = apply;
      // Ticking a card updates the progress bar (and the list, when filtering by owned/missing).
      const onChange = () => {
        if (!grid.isConnected) { window.removeEventListener('pokeinfo:collection', onChange); return; }
        showProgress();
        if (owned.value) apply();
      };
      window.addEventListener('pokeinfo:collection', onChange);
    },
  };
}

// ---------- #/card/:id — everything TCGdex knows about one card ----------

// Fields shown in their own sections; anything else TCGdex adds later is listed under "Other details".
const SHOWN_FIELDS = new Set(['id', 'localId', 'name', 'image', 'category', 'illustrator', 'rarity', 'set', 'variants', 'variants_detailed',
  'dexId', 'hp', 'types', 'evolveFrom', 'description', 'stage', 'suffix', 'level', 'abilities', 'attacks', 'weaknesses', 'resistances',
  'retreat', 'regulationMark', 'legal', 'updated', 'pricing', 'effect', 'trainerType', 'energyType', 'item', 'boosters', 'thirdParty']);

async function cardView(cardId) {
  if (!CARD_ID.test(cardId || '')) return notFound();
  let c;
  try {
    [c] = await Promise.all([tcgGet(`/cards/${encodeURIComponent(cardId)}`, PRICE_AGE), loadSpecies().catch(() => {})]);
  } catch (err) {
    if (isMissing(err)) return notFound(); // no such card: not a connection problem
    throw err;
  }
  const setId = (c.set && c.set.id) || setIdOfCard(cardId);
  const set = SET_ID.test(setId) ? await tcgSet(setId).catch(() => null) : null;
  const inSet = set ? validCards(set.cards) : [];
  const pos = inSet.findIndex(x => x.id === c.id);
  const prev = pos > 0 ? inSet[pos - 1] : null;
  const next = pos >= 0 && pos < inSet.length - 1 ? inSet[pos + 1] : null;

  const sources = cardSources(c, 'high');
  const big = tcgAsset(c.image, '/high.png') || sources[0];
  const setInfo = c.set || {};
  const official = setInfo.cardCount && setInfo.cardCount.official;
  const row = (label, value) => (value === '' || value == null ? '' : `<tr><th>${label}</th><td>${value}</td></tr>`);
  const list = v => (Array.isArray(v) ? v : []);

  // Basic facts
  const facts = `
    <table class="comparar ficha-carta">
      <tbody>
        ${row(tr('Card kind'), cardText(c.category === 'Pokemon' ? 'Pokémon' : c.category))}
        ${row(tr('Set'), `<a href="#/cards/set/${esc(setId)}">${cardText(setInfo.name || setId)}</a>`)}
        ${row(tr('Number'), `${cardText(c.localId)}${official ? ` / ${Number(official)}` : ''}`)}
        ${row(tr('Rarity'), c.rarity ? cardText(c.rarity) : '')}
        ${row(tr('Illustrator'), c.illustrator ? cardText(c.illustrator) : '')}
        ${row('HP', c.hp != null ? cardText(c.hp) : '')}
        ${row(tr('Type'), list(c.types).map(energyBadge).join(' '))}
        ${row(tr('Stage'), c.stage ? stageText(c.stage) : '')}
        ${row(tr('Evolves from'), c.evolveFrom ? `<a href="#/cards?q=${encodeURIComponent(c.evolveFrom)}">${cardText(c.evolveFrom)}</a>` : '')}
        ${row(tr('Level'), c.level != null ? cardText(c.level) : '')}
        ${row(tr('Suffix'), c.suffix ? cardText(c.suffix) : '')}
        ${row(tr('Trainer type'), c.trainerType ? cardText(c.trainerType) : '')}
        ${row(tr('Energy type'), c.energyType ? cardText(c.energyType) : '')}
        ${row(tr('Pokédex'), list(c.dexId).filter(n => Number.isInteger(n) && n >= 1 && n <= TOTAL).map(n => `<a href="#/pokemon/${n}">${pad(n)} ${nameOf(n)}</a>`).join(', '))}
        ${row(tr('Regulation mark'), c.regulationMark ? cardText(c.regulationMark) : '')}
        ${row(tr('Standard format'), c.legal ? (c.legal.standard ? `✅ ${tr('Legal')}` : `— ${tr('Not legal')}`) : '')}
        ${row(tr('Expanded format'), c.legal ? (c.legal.expanded ? `✅ ${tr('Legal')}` : `— ${tr('Not legal')}`) : '')}
      </tbody>
    </table>`;

  const abilities = list(c.abilities).length ? `
    <h2>${tr('Abilities')}</h2>
    ${list(c.abilities).map(a => `
      <div class="tarjeta ataque">
        <div class="ataque-cab"><span class="etiqueta">${cardText(a.type || tr('Ability'))}</span> <b>${cardText(a.name)}</b></div>
        ${a.effect ? `<p>${cardText(a.effect)}</p>` : ''}
      </div>`).join('')}` : '';

  const attacks = list(c.attacks).length ? `
    <h2>${tr('Attacks')}</h2>
    ${list(c.attacks).map(a => `
      <div class="tarjeta ataque">
        <div class="ataque-cab">
          <span class="coste">${list(a.cost).length ? list(a.cost).map(energyDot).join('') : `<small>${tr('No cost')}</small>`}</span>
          <b>${cardText(a.name)}</b>
          ${a.damage != null && a.damage !== '' ? `<span class="dano">${cardText(a.damage)}</span>` : ''}
        </div>
        ${a.effect ? `<p>${cardText(a.effect)}</p>` : ''}
      </div>`).join('')}` : '';

  const effect = c.effect ? `<h2>${tr('Effect')}</h2><div class="tarjeta ataque"><p>${cardText(c.effect)}</p></div>` : '';
  const item = c.item && c.item.name ? `<h2>${tr('Held item')}</h2><div class="tarjeta ataque"><div class="ataque-cab"><b>${cardText(c.item.name)}</b></div>${c.item.effect ? `<p>${cardText(c.item.effect)}</p>` : ''}</div>` : '';

  const modifiers = (label, arr) => (list(arr).length ? `<div class="dato"><small>${label}</small><b>${list(arr).map(w => `${energyDot(w.type)} ${cardText(w.value || '')}`).join(' ')}</b></div>` : '');
  const battle = (list(c.weaknesses).length || list(c.resistances).length || c.retreat != null) ? `
    <div class="datos datos-carta">
      ${modifiers(tr('Weakness'), c.weaknesses)}
      ${modifiers(tr('Resistance'), c.resistances)}
      ${c.retreat != null ? `<div class="dato"><small>${tr('Retreat cost')}</small><b>${Number(c.retreat) ? Array.from({ length: Math.min(10, Number(c.retreat)) }, () => energyDot(isEs() ? 'Incolora' : 'Colorless')).join('') : '0'}</b></div>` : ''}
    </div>` : '';

  const VARIANT_NAMES = { normal: 'Normal', reverse: 'Reverse holo', holo: 'Holo', firstEdition: '1st Edition', wPromo: 'W Promo stamp' };
  const variantList = Object.entries(c.variants || {}).filter(([k, v]) => v === true && has(VARIANT_NAMES, k)).map(([k]) => tr(VARIANT_NAMES[k]));
  const detailed = list(c.variants_detailed).filter(v => v && v.type);
  const variants = variantList.length || detailed.length ? `
    <h2>${tr('Versions printed')}</h2>
    ${variantList.length ? `<div class="lista-chips">${variantList.map(v => `<span class="chip">${esc(v)}</span>`).join('')}</div>` : ''}
    ${detailed.length > 1 || (detailed[0] && (detailed[0].subtype || detailed[0].stamp)) ? `
      <div class="tabla-wrap" style="margin-top:10px"><table class="encuentros">
        <thead><tr><th>${tr('Version')}</th><th>${tr('Edition')}</th><th>${tr('Size')}</th><th>${tr('Stamp')}</th></tr></thead>
        <tbody>${detailed.map(v => `<tr><td>${cardText(v.type)}</td><td>${cardText(v.subtype || '—')}</td><td>${cardText(v.size || '—')}</td><td>${cardText(list(v.stamp).join(', ') || (typeof v.stamp === 'string' ? v.stamp : '—'))}</td></tr>`).join('')}</tbody>
      </table></div>` : ''}` : '';

  const boosters = list(c.boosters).length ? `
    <h2>${tr('Found in boosters')}</h2>
    <div class="lista-chips">${list(c.boosters).map(b => `<span class="chip">${cardText(b.name || b.id || b)}</span>`).join('')}</div>` : '';

  const extras = Object.entries(c).filter(([k, v]) => !SHOWN_FIELDS.has(k) && v != null && v !== ''
    && (typeof v !== 'object' || (Array.isArray(v) && v.every(x => typeof x !== 'object'))));
  const other = extras.length ? `
    <h2>${tr('Other details')}</h2>
    <table class="comparar ficha-carta"><tbody>${extras.map(([k, v]) => row(cardText(rawPretty(k.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())), cardText(Array.isArray(v) ? v.join(', ') : v))).join('')}</tbody></table>` : '';

  return `
    <a class="volver" href="#/cards/set/${esc(setId)}">← ${cardText(setInfo.name || tr('Set'))}</a>
    <div class="detalle-carta">
      <div class="imagen-carta">
        ${sources.length ? `<a href="${esc(big)}" target="_blank" rel="noopener noreferrer" title="${tr('Open the full-size image')}">${cardImg(c, 'high', 'width="600" height="825"')}</a>` : noPicture(c, true)}
        <div class="navpoke">
          ${prev ? `<a class="btn sec" href="#/card/${esc(prev.id)}">← ${cardText(prev.name)}</a>` : '<span></span>'}
          ${next ? `<a class="btn sec" href="#/card/${esc(next.id)}">${cardText(next.name)} →</a>` : ''}
        </div>
      </div>
      <div>
        <h1>${cardText(c.name)}</h1>
        <p>${ownButton(c, true)} <a class="btn sec" href="#/collection">📒 ${tr('My collection')}</a></p>
        ${c.description ? `<p class="subtitulo"><i>${cardText(c.description)}</i></p>` : ''}
        ${facts}
        ${battle}
        ${abilities}
        ${attacks}
        ${effect}
        ${item}
        ${variants}
        ${priceSection(c)}
        ${boosters}
        ${other}
        ${c.updated ? `<p class="nota">${tr('Card data last updated by TCGdex on {date}.', { date: cardText(String(c.updated).slice(0, 10)) })}</p>` : ''}
      </div>
    </div>`;
}

// Market prices from Cardmarket (euros) and TCGplayer (US dollars), as TCGdex reports them.
function priceSection(c) {
  const p = c.pricing || {};
  const money = (v, unit) => (typeof v === 'number' && isFinite(v)
    ? esc(v.toLocaleString(LANG, { style: 'currency', currency: unit === 'USD' ? 'USD' : 'EUR' })) : '—');
  const date = v => (v ? cardText(String(v).slice(0, 10)) : '');
  let html = '';

  const cm = p.cardmarket;
  if (cm && typeof cm === 'object') {
    const cols = [['avg', 'Average'], ['low', 'Lowest'], ['trend', 'Trend'], ['avg1', '1-day average'], ['avg7', '7-day average'], ['avg30', '30-day average']];
    const line = (label, suffix) => {
      const cells = cols.map(([k]) => cm[k + suffix]);
      return cells.some(v => typeof v === 'number') ? `<tr><th>${label}</th>${cells.map(v => `<td>${money(v, 'EUR')}</td>`).join('')}</tr>` : '';
    };
    const body = line(tr('Normal'), '') + line(tr('Holo'), '-holo');
    if (body) html += `
      <h3>Cardmarket <small>(EUR${cm.updated ? ` · ${tr('updated {date}', { date: date(cm.updated) })}` : ''})</small></h3>
      <div class="tabla-wrap"><table class="encuentros precios">
        <thead><tr><th></th>${cols.map(([, l]) => `<th>${tr(l)}</th>`).join('')}</tr></thead><tbody>${body}</tbody>
      </table></div>`;
  }

  const tp = p.tcgplayer;
  if (tp && typeof tp === 'object') {
    const VERSIONS = { normal: 'Normal', holofoil: 'Holo', reverseHolofoil: 'Reverse holo', '1stEditionHolofoil': '1st Edition holo', '1stEditionNormal': '1st Edition', '1stEdition': '1st Edition', unlimitedHolofoil: 'Unlimited holo', unlimited: 'Unlimited' };
    const cols = [['lowPrice', 'Low'], ['midPrice', 'Mid'], ['highPrice', 'High'], ['marketPrice', 'Market']];
    const entries = Object.entries(tp).filter(([, v]) => v && typeof v === 'object' && cols.some(([k]) => typeof v[k] === 'number'));
    if (entries.length) {
      const product = entries.map(([, v]) => v.productId).find(n => Number.isInteger(n));
      html += `
        <h3>TCGplayer <small>(USD${tp.updated ? ` · ${tr('updated {date}', { date: date(tp.updated) })}` : ''})</small></h3>
        <div class="tabla-wrap"><table class="encuentros precios">
          <thead><tr><th>${tr('Version')}</th>${cols.map(([, l]) => `<th>${tr(l)}</th>`).join('')}</tr></thead>
          <tbody>${entries.map(([k, v]) => `<tr><th>${esc(tr(has(VERSIONS, k) ? VERSIONS[k] : rawPretty(k)))}</th>${cols.map(([key]) => `<td>${money(v[key], 'USD')}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        ${product ? `<p class="nota"><a href="https://www.tcgplayer.com/product/${product}" target="_blank" rel="noopener noreferrer">${tr('See this card on TCGplayer')}</a></p>` : ''}`;
    }
  }

  return html ? `
    <h2>${tr('Market prices')}</h2>
    ${html}
    <p class="nota">${tr('Prices are a rough guide: they change every day and depend on condition, language and version.')}</p>` : '';
}

// ---------- "Trading cards" box on a Pokémon's page ----------

async function renderPokemonCards(dexId, box) {
  const body = box.querySelector('#pokeCards');
  body.innerHTML = loading(tr('Loading cards…'));
  try {
    const path = `/cards?dexId=eq:${Number(dexId)}`;
    const [en, es, sets] = await Promise.all([
      api(tcgUrl('en', path)),
      isEs() ? api(tcgUrl('es', path)).catch(() => []) : [],
      tcgSets(),
    ]);
    const byId = new Map(validCards(en).map(c => [c.id, c]));
    validCards(es).forEach(c => byId.set(c.id, c));
    const cards = sortBySet([...byId.values()], sets);
    if (!body.isConnected) return;
    body.innerHTML = cards.length ? `
      <p class="nota">${tr('{n} cards, newest sets first.', { n: cards.length })}</p>
      <div class="cartas">${cards.map(c => cardTile(c, (sets.get(setIdOfCard(c.id)) || {}).name)).join('')}</div>`
      : `<p class="subtitulo">${tr('No trading cards found for this Pokémon.')}</p>`;
  } catch {
    if (!body.isConnected) return;
    delete box.dataset.loaded;
    body.innerHTML = `<p class="error">${tr('Could not load the cards. Close and reopen this box to retry.')}</p>`;
  }
}
