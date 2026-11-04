# PokéInfo

A fan-made guide to the Pokémon series: every Pokémon, region and main-series game, with per-game walkthroughs, wild Pokémon locations, key items, a team builder, a Nuzlocke tracker and every card of the trading card game. In English and Spanish.

**Live site: https://alberto210495.github.io/pokemon-web/**

It is a plain HTML, CSS and JavaScript site. There is no framework and no build step: open it in a browser and it runs.

## Features

- **Pokédex**: all 1025 Pokémon, searchable by name or number and filterable by generation and type. Each Pokémon has stats, abilities, evolutions, its shiny form, its cry, type effectiveness, where to find it in each game, and the moves it learns in each game (level-up, TM/HM, egg and tutor), with type, category, power, accuracy and PP as they were in that game.
- **Regions**: Kanto to Paldea (plus Hisui), with real-world inspiration, professor, starters and legendaries.
- **Games**: every main-series game with its new features and version exclusives, plus a side-by-side comparison of any two games.
- **Game guides**, one per game:
  - *Walkthrough*: Gyms in order (or Trials, Nobles, Titans), the Elite Four and the Champion
  - *Routes & wild Pokémon*: every location, with which Pokémon appear, how, at what level and how often
  - *Items & gifts*: key items and HMs with where to get them, plus gift Pokémon
- **Team builder**: pick up to 6 Pokémon and up to 4 moves each (from what they can learn in the chosen game). It shows shared weaknesses, biggest threats, offensive coverage based on the chosen moves, and suggests Pokémon that resist the biggest threats. You can limit it to one game's Pokédex, and export the team in Pokémon Showdown format. Teams are saved in the browser and can be shared by link.
- **Nuzlocke tracker**: pick a game and record the first encounter in each area (caught, fainted or missed, with a nickname). It lists the wild Pokémon in each area, warns about duplicates, and keeps a party and a graveyard. Runs are saved in the browser, one per game.
- **Trading cards**: every set of the Pokémon Trading Card Game, from Base Set (1999) to today, grouped by series. Each set lists all its cards with filters for type, kind and name. Each card has its image and everything TCGdex records: HP, types, stage, what it evolves from, abilities, attacks with energy costs and damage, weakness, resistance, retreat cost, Trainer and Energy effects, rarity, illustrator, regulation mark, Standard and Expanded legality, the versions printed (1st Edition, holo, reverse holo…) and Cardmarket and TCGplayer market prices. You can search all cards by name, and every Pokémon page lists that Pokémon's cards.
- **English and Spanish**: the site follows the browser's language, and the EN/ES button in the top bar switches it (remembered in the browser). Pokémon, move, ability, type and place names use the official Spanish names. Region, game and guide descriptions are in English only for now.
- **Light and dark themes**: follows the system setting, or pick one with the button in the top bar (remembered in the browser).

## Running it

**Option 1: open the file.** Double-click `index.html`. Everything works, but the browser can only save a little API data between visits.

**Option 2: run a local server (recommended).** With [Node.js](https://nodejs.org) installed:

```powershell
npx serve
```

Then open the address it prints (for example `http://localhost:3000`). Served this way, the site can use the browser's larger cache.

The site needs internet access to reach [PokeAPI](https://pokeapi.co). Some networks, such as school or university Wi-Fi, block it. If every page shows "Something went wrong", try another network.

## Project structure

```
index.html        Page shell: top bar, navigation and script tags
css/styles.css    All styles (light and dark themes)
js/theme.js       Applies the saved light/dark theme before the page draws
js/data.js        Static data: generations, types, type chart, regions, games
js/guides.js      Hand-written guide data: gyms, Elite Four, key items, gift Pokémon
js/cards.js       Trading card pages (sets, cards, search), using TCGdex
js/names.js       Official English and Spanish names for moves, abilities, places and types (generated)
js/i18n.js        Language choice, tr() and the Spanish text of the site
js/app.js         The app: hash router, API helper with caching, and every page
tools/build-names.js  Rebuilds js/names.js from PokeAPI
```

Pages are chosen by the part of the URL after `#`, for example `#/pokemon/25`, `#/guide/red-blue/locations`, `#/nuzlocke/emerald`, `#/cards/set/base1`, `#/card/base1-4` or `#/team/6.flamethrower.air-slash,25.thunderbolt/red-blue` (each team member is its Pokédex number followed by its moves). Pokédex filters are kept in the URL too, as in `#/pokedex?gen=3&type=water&q=mud`, so a filtered view can be bookmarked or shared. The full route list is at the top of `js/app.js`.

## Where the data comes from

| Data | Source |
|---|---|
| Pokémon stats, types, abilities, evolutions, sprites, cries | [PokeAPI](https://pokeapi.co), live |
| Routes and wild Pokémon locations | PokeAPI, live |
| Which Pokémon are in each game (team builder filter) | PokeAPI regional Pokédexes, live |
| Regions, games, version exclusives, type chart | `js/data.js` |
| Gyms, Elite Four, key items, gift Pokémon | `js/guides.js` |
| Trading cards, sets and card prices | [TCGdex](https://tcgdex.dev), live (prices cached for a day) |
| Spanish and English names of moves, abilities, places, types | `js/names.js`, built from PokeAPI by `tools/build-names.js` |

PokeAPI responses are cached in the browser for 7 days, so pages you have visited load quickly.

**Known gaps**

- PokeAPI's encounter data is thorough for the older games but patchy or missing for newer ones. Those locations show "No wild Pokémon recorded".
- Legends: Z-A has no key-item list: its key items are side-mission props, not story items. Legends: Arceus lists only its starters as gift Pokémon.
- In Legends: Arceus and Scarlet & Violet, the items tab lists ride Pokémon and ride abilities, which take the place of HMs.
- The team builder uses the modern type chart. A few matchups were different in older games.

### Adding guide data

Each game's guide is one entry in `GUIDES` in `js/guides.js`:

```js
items: [{ name: 'HM01 Cut', where: "Cutter's House, Rustboro City" }],
gifts: [{ id: 351, where: 'Weather Institute, Route 119' }],   // id = National Pokédex number
```

Milestones (Gyms, Elite Four and so on) are lists of `{ who, type, where, reward }`. Only `who` is required.

## Development

### Translations

All text shown on the site is written in English inside `tr('…')` in `js/app.js`. To add or change text, write the English there and add its Spanish to the `ES` list in `js/i18n.js`. Text without a translation simply shows in English. Placeholders such as `{name}` are filled in by the code. Translations must not contain double quotes (`"`), because some are used inside HTML attributes.

Names of moves, abilities, places and types come from `js/names.js`. To pick up names PokeAPI adds later, run:

```powershell
node tools/build-names.js
```

### Security rules

The site has no server, logins or user data, so the main risk is someone getting code to run on the page. Three rules keep that out. Please keep them when you change things:

- **Escape outside text.** Anything from PokeAPI, the URL or browser storage (such as Nuzlocke nicknames) goes through `esc()` (or `prettyName()`, `placeName()`, `nameOf()`, which escape for you) before it is put into HTML. The hand-written text in `data.js` and `guides.js` is trusted and must not contain HTML.
- **No inline code.** No `<script>` blocks in the HTML and no `onclick="…"` or `onerror="…"` attributes. Attach event handlers from JavaScript instead.
- **Keep the Content Security Policy up to date.** The `<meta http-equiv="Content-Security-Policy">` tag in `index.html` lists every site the page may load from. If you add a new image host, font or API, add it there or the browser will block it.

`api()` also refuses to fetch anything outside PokeAPI and TCGdex, and lookups that use values from the URL go through `has()`, so names like `constructor` can't match built-in object members.

### Linting

The project uses [Oxlint](https://oxc.rs):

```powershell
npx oxlint
```

A clean run prints `Found 0 warnings and 0 errors`. `.oxlintrc.json` turns off the unused-variable check for `data.js` and `guides.js`: those files define globals such as `GAMES` and `GUIDES` that `app.js` uses through the `<script>` tags, which Oxlint can't see.

### Publishing

The site is hosted on GitHub Pages from the `main` branch. Every push to `main` updates the live site within a minute or two; the **Actions** tab shows the progress. The empty `.nojekyll` file tells GitHub to serve the files as they are instead of running them through Jekyll.

### Working across two computers

Before you start, get the latest changes:

```powershell
git pull
```

When you're done, save and upload your changes:

```powershell
git add -A
git commit -m "Describe what you changed"
git push
```

To set up a new computer:

```powershell
winget install Git.Git          # then restart VS Code
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git clone https://github.com/alberto210495/pokemon-web.git
```

## Credits

Pokémon data and sprites come from [PokeAPI](https://pokeapi.co). Trading card data, images and prices come from [TCGdex](https://tcgdex.dev).

This is a non-commercial fan site. Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak and The Pokémon Company.
