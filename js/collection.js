// Card collection checklist: tick the trading cards you own. The list is saved in this browser
// (localStorage) and can be downloaded as a backup file and restored, e.g. on another device.
// Route: #/collection. The ✓ buttons on card tiles and card pages come from ownButton() below.
//
// Loaded after cards.js and before app.js; uses their helpers only from inside functions.

const COLLECTION_KEY = 'pokeinfo-collection';
const COLLECTION_MAX = 50000;
let collectionCache = null;

// Owned cards: id → { n: name, l: number in its set, i: TCGdex image address or '', t: when added }.
// Everything read from storage or a backup file is checked before it is used.
function addValidCards(map, cards) {
  if (!cards || typeof cards !== 'object' || Array.isArray(cards)) return 0;
  let added = 0;
  for (const [id, c] of Object.entries(cards)) {
    if (map.size >= COLLECTION_MAX) break;
    if (!CARD_ID.test(id) || !c || typeof c !== 'object') continue;
    if (!map.has(id)) added++;
    map.set(id, {
      n: String(c.n || '').slice(0, 120),
      l: String(c.l || '').slice(0, 20),
      i: typeof c.i === 'string' && c.i.startsWith(TCG_ASSETS) ? c.i.slice(0, 300) : '',
      t: Number.isFinite(Number(c.t)) ? Number(c.t) : Date.now(),
    });
  }
  return added;
}

function loadCollection() {
  if (collectionCache) return collectionCache;
  const map = new Map();
  try {
    const raw = JSON.parse(localStorage.getItem(COLLECTION_KEY));
    addValidCards(map, raw && raw.cards);
  } catch { /* nothing saved, or storage blocked */ }
  collectionCache = map;
  return map;
}

function saveCollection() {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify({ version: 1, cards: Object.fromEntries(loadCollection()) }));
    return true;
  } catch { return false; }
}

const isOwned = id => loadCollection().has(id);

// The "I have this card" button. big: the labelled button on a card's own page.
function ownButton(c, big = false) {
  const owned = isOwned(c.id);
  const label = tr('{name} #{num} in my collection', { name: cardText(c.name), num: cardText(c.localId) });
  return `<button type="button" class="${big ? 'btn sec tengo-grande' : 'tengo'}${owned ? ' si' : ''}" data-own="${esc(c.id)}"
    data-n="${cardText(c.name)}" data-l="${cardText(c.localId)}" data-i="${esc(tcgAsset(c.image, '') || '')}" ${big ? 'data-big="1"' : ''}
    aria-pressed="${owned}" ${big ? '' : `aria-label="${label}" title="${owned ? tr('In my collection') : tr('Add to my collection')}"`}>${ownLabel(owned, big)}</button>`;
}
const ownLabel = (owned, big) => (big ? (owned ? `✅ ${tr('In my collection')}` : `➕ ${tr('Add to my collection')}`) : (owned ? '✓' : '+'));

// One listener for every ✓ button on the page.
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('[data-own]');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.own;
  if (!CARD_ID.test(id)) return;
  const col = loadCollection();
  const owned = !col.has(id);
  if (owned) addValidCards(col, { [id]: { n: btn.dataset.n, l: btn.dataset.l, i: btn.dataset.i, t: Date.now() } });
  else col.delete(id);
  if (!saveCollection()) alert(tr('Could not save your collection: this browser is blocking storage or is full.'));
  // Update every button for this card on the page (the tile and the big button can both be shown).
  document.querySelectorAll('[data-own]').forEach(b => {
    if (b.dataset.own !== id) return;
    b.classList.toggle('si', owned);
    b.setAttribute('aria-pressed', String(owned));
    b.textContent = ownLabel(owned, Boolean(b.dataset.big));
    if (!b.dataset.big) b.title = owned ? tr('In my collection') : tr('Add to my collection');
  });
  window.dispatchEvent(new Event('pokeinfo:collection'));
});

// "You have 12 of 102 (12%)" with a bar.
function collectionProgress(have, total) {
  const pct = total ? Math.round((have / total) * 100) : 0;
  return `
    <div class="barra-progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${have}"><div style="width:${pct}%"></div></div>
    <small>${tr('You have {have} of {total} cards ({pct}%)', { have, total, pct })}</small>`;
}

// ---------- #/collection ----------

async function collectionView() {
  const col = loadCollection();
  const sets = await tcgSets().catch(() => new Map());
  const bySet = new Map();
  for (const [id, c] of col) {
    const setId = setIdOfCard(id);
    if (!bySet.has(setId)) bySet.set(setId, []);
    bySet.get(setId).push({ id, name: c.n || id, localId: c.l, image: c.i });
  }
  const groups = [...bySet].map(([setId, cards]) => {
    const info = sets.get(setId) || {};
    const total = Number(info.cardCount && info.cardCount.total) || 0;
    cards.sort((a, b) => String(a.localId).localeCompare(String(b.localId), undefined, { numeric: true }));
    return { setId, name: info.name || setId, order: info.order ?? 1e9, total, cards };
  }).sort((a, b) => a.order - b.order);
  const complete = groups.filter(g => g.total && g.cards.length >= g.total).length;

  return {
    html: `
      <a class="volver" href="#/cards">← ${tr('Trading cards')}</a>
      <h1>${tr('My card collection')}</h1>
      <p class="subtitulo">${tr('Tick the + on any card to add it. Your collection is saved in this browser; download a backup to keep it safe or move it to another device.')}</p>
      <div class="cifras tarjeta">
        <div class="cifra"><b>${col.size}</b><span>${tr('Cards')}</span></div>
        <div class="cifra"><b>${groups.length}</b><span>${tr('Sets started')}</span></div>
        <div class="cifra"><b>${complete}</b><span>${tr('Sets complete')}</span></div>
      </div>
      <div class="filtros">
        <button type="button" class="btn sec" id="colExport" ${col.size ? '' : 'disabled'}>📥 ${tr('Download backup')}</button>
        <label class="btn sec" for="colImport">📤 ${tr('Restore from backup')}</label>
        <input type="file" id="colImport" accept="application/json,.json" hidden>
        ${col.size ? `<button type="button" class="btn sec" id="colClear">🗑️ ${tr('Clear collection')}</button>` : ''}
      </div>
      <p class="nota" id="colMsg" aria-live="polite"></p>
      ${!col.size ? `
        <div class="tarjeta aviso-vacio">
          <h2>${tr('Your collection is empty')}</h2>
          <p>${tr('Open any set and tick the cards you own.')}</p>
          <a class="btn" href="#/cards">🃏 ${tr('Browse sets')}</a>
        </div>` : groups.map(g => `
        <section class="linea-gen">
          <h2><a href="#/cards/set/${esc(g.setId)}">${cardText(g.name)}</a> <small>${g.total ? `${g.cards.length}/${g.total}` : g.cards.length}</small></h2>
          ${g.total ? `<div class="progreso">${collectionProgress(g.cards.length, g.total)}</div>` : ''}
          <div class="cartas">${g.cards.map(c => cardTile(c, '')).join('')}</div>
        </section>`).join('')}`,
    mount() {
      const msg = document.getElementById('colMsg');
      const exp = document.getElementById('colExport');
      if (exp) exp.onclick = () => {
        const data = JSON.stringify({ app: 'PokéInfo', version: 1, exported: new Date().toISOString(), cards: Object.fromEntries(loadCollection()) }, null, 1);
        const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `pokeinfo-collection-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      };
      document.getElementById('colImport').onchange = e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { msg.textContent = tr('That file is too big to be a PokéInfo backup.'); return; }
        file.text().then(text => {
          let data;
          try { data = JSON.parse(text); } catch { data = null; }
          if (!data || typeof data.cards !== 'object') { msg.textContent = tr('That file is not a PokéInfo collection backup.'); return; }
          const added = addValidCards(loadCollection(), data.cards);
          if (!saveCollection()) { msg.textContent = tr('Could not save your collection: this browser is blocking storage or is full.'); return; }
          router().then(() => {
            const again = document.getElementById('colMsg');
            if (again) again.textContent = tr('Backup restored: {n} cards added.', { n: added });
          });
        });
      };
      const clear = document.getElementById('colClear');
      if (clear) clear.onclick = () => {
        if (!confirm(tr('Remove every card from your collection? Download a backup first if you might want it back.'))) return;
        loadCollection().clear();
        saveCollection();
        router();
      };
    },
  };
}
