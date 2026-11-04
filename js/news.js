// Pokémon news: the #/news page and the "Latest news" strip on the home page.
// Headlines are collected every 6 hours by the "Update news" GitHub Action (.github/workflows/news.yml, which runs
// tools/fetch-news.js) and published as news.json on this repo's "news" branch. This file reads that JSON.
// Every item links to the full article on its own site; only the headline and a short summary are shown here.
//
// Loaded before app.js; uses its helpers (api, esc, tr, …) only from inside functions.

const NEWS_URL = 'https://raw.githubusercontent.com/alberto210495/pokemon-web/news/news.json';
const NEWS_AGE = 30 * 60 * 1000; // check for new headlines every 30 minutes at most

const safeLink = u => {
  try {
    const url = new URL(String(u));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
};

// The news file comes from the internet, so every field is checked and turned into plain values here.
async function loadNews() {
  const d = await api(NEWS_URL, undefined, NEWS_AGE);
  const sources = new Map((Array.isArray(d.sources) ? d.sources : [])
    .filter(s => s && typeof s.id === 'string' && typeof s.name === 'string')
    .map(s => [s.id, { name: s.name, site: safeLink(s.site) }]));
  const items = (Array.isArray(d.items) ? d.items : [])
    .map(it => ({
      title: String((it && it.title) || '').slice(0, 300),
      link: safeLink(it && it.link),
      date: new Date(it && it.date),
      summary: String((it && it.summary) || '').slice(0, 400),
      source: String((it && it.source) || ''),
      lang: it && it.lang === 'es' ? 'es' : 'en',
    }))
    .filter(it => it.title && it.link && !isNaN(it.date))
    .sort((a, b) => b.date - a.date);
  return { updated: new Date(d.updated), sources, items };
}

const sourceName = (news, id) => (news.sources.get(id) || { name: id }).name;
const timeText = d => d.toLocaleTimeString(LANG, { hour: '2-digit', minute: '2-digit' });
function dayText(d) {
  const start = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(d)) / 864e5);
  if (days === 0) return tr('Today');
  if (days === 1) return tr('Yesterday');
  return cap(d.toLocaleDateString(LANG, { weekday: 'long', day: 'numeric', month: 'long' }));
}
const langNote = it => (it.lang !== LANG ? ` <span class="etiqueta">${tr(it.lang === 'es' ? 'In Spanish' : 'In English')}</span>` : '');

const newsItem = (it, news) => `
  <article class="tarjeta noticia" data-source="${esc(it.source)}">
    <div class="noticia-meta">
      <span class="etiqueta">${esc(sourceName(news, it.source))}</span>${langNote(it)}
      <time datetime="${esc(it.date.toISOString())}">${esc(timeText(it.date))}</time>
    </div>
    <h3><a href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h3>
    ${it.summary ? `<p>${esc(it.summary)}</p>` : ''}
  </article>`;

const newsUnavailable = () => `
  <h1>${tr('Pokémon news')}</h1>
  <div class="tarjeta aviso-vacio">
    <h2>${tr('No news to show right now')}</h2>
    <p>${tr('The news list could not be loaded. It is updated every 6 hours; try again later.')}</p>
  </div>`;

async function newsView() {
  let news;
  try { news = await loadNews(); } catch { return newsUnavailable(); }
  if (!news.items.length) return newsUnavailable();

  const counts = new Map();
  news.items.forEach(it => counts.set(it.source, (counts.get(it.source) || 0) + 1));
  const days = [];
  news.items.forEach(it => {
    const label = dayText(it.date);
    if (!days.length || days[days.length - 1].label !== label) days.push({ label, items: [] });
    days[days.length - 1].items.push(it);
  });
  const stale = !isNaN(news.updated) && Date.now() - news.updated > 2 * 864e5;

  return {
    html: `
      <h1>${tr('Pokémon news')}</h1>
      <p class="subtitulo">${tr('Headlines from Pokémon news sites, updated every 6 hours. Each one opens the full article on its own site.')}
        ${!isNaN(news.updated) ? `<br><small>${tr('Last updated: {when}', { when: esc(news.updated.toLocaleString(LANG, { dateStyle: 'medium', timeStyle: 'short' })) })}</small>` : ''}</p>
      ${stale ? `<p class="nota">${tr('These headlines are more than two days old; the automatic update may have stopped.')}</p>` : ''}
      <div class="filtros">
        <select id="newsSource" aria-label="${tr('Source')}">
          <option value="">${tr('All sources ({n})', { n: news.items.length })}</option>
          ${[...counts].map(([id, n]) => `<option value="${esc(id)}">${esc(sourceName(news, id))} (${n})</option>`).join('')}
        </select>
      </div>
      <div id="newsList">
        ${days.map(day => `
          <section class="dia-noticias">
            <h2>${esc(day.label)}</h2>
            ${day.items.map(it => newsItem(it, news)).join('')}
          </section>`).join('')}
      </div>
      <p class="nota">${tr('Sources: {list}. PokéInfo is not affiliated with these sites.', {
        list: [...news.sources].map(([, s]) => (s.site ? `<a href="${esc(s.site)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a>` : esc(s.name))).join(', '),
      })}</p>`,
    mount() {
      const select = document.getElementById('newsSource');
      select.onchange = () => {
        document.querySelectorAll('#newsList .noticia').forEach(a => { a.hidden = Boolean(select.value) && a.dataset.source !== select.value; });
        document.querySelectorAll('#newsList .dia-noticias').forEach(sec => { sec.hidden = !sec.querySelector('.noticia:not([hidden])'); });
      };
    },
  };
}

// Home page: the four newest headlines. Loads after the page is shown and disappears quietly if news is unavailable.
async function renderHomeNews() {
  const box = document.getElementById('homeNews');
  if (!box) return;
  try {
    const news = await loadNews();
    if (!box.isConnected || !news.items.length) { box.remove(); return; }
    box.innerHTML = `
      <h2>📰 ${tr('Latest news')} <a class="chip" href="#/news">${tr('All news')} →</a></h2>
      <div class="noticias-inicio">${news.items.slice(0, 4).map(it => `
        <a class="tarjeta noticia-corta" href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">
          <small>${esc(sourceName(news, it.source))} · ${esc(dayText(it.date))}</small>
          <b>${esc(it.title)}</b>
        </a>`).join('')}
      </div>`;
  } catch { box.remove(); }
}
