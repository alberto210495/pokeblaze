# PokéInfo

A fan-made guide to the Pokémon series: every Pokémon, region and main-series game, with per-game walkthroughs, wild Pokémon locations, key items and a team builder.

**Live site: https://alberto210495.github.io/pokemon-web/**

It is a plain HTML, CSS and JavaScript site. There is no framework and no build step: open it in a browser and it runs.

## Features

- **Pokédex**: all 1025 Pokémon, searchable by name or number and filterable by generation and type. Each Pokémon has stats, abilities, evolutions, its shiny form, its cry, type effectiveness and where to find it in each game.
- **Regions**: Kanto to Paldea (plus Hisui), with real-world inspiration, professor, starters and legendaries.
- **Games**: every main-series game with its new features and version exclusives, plus a side-by-side comparison of any two games.
- **Game guides**, one per game:
  - *Walkthrough*: Gyms in order (or Trials, Nobles, Titans), the Elite Four and the Champion
  - *Routes & wild Pokémon*: every location, with which Pokémon appear, how, at what level and how often
  - *Items & gifts*: key items and HMs with where to get them, plus gift Pokémon
- **Team builder**: pick up to 6 Pokémon to see shared weaknesses, biggest threats and offensive type coverage. You can limit it to one game's Pokédex. Teams are saved in the browser and can be shared by link.
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
js/data.js        Static data: generations, types, type chart, regions, games
js/guides.js      Hand-written guide data: gyms, Elite Four, key items, gift Pokémon
js/app.js         The app: hash router, API helper with caching, and every page
```

Pages are chosen by the part of the URL after `#`, for example `#/pokemon/25`, `#/guide/red-blue/locations` or `#/team/6,25,130/red-blue`. Pokédex filters are kept in the URL too, as in `#/pokedex?gen=3&type=water&q=mud`, so a filtered view can be bookmarked or shared. The full route list is at the top of `js/app.js`.

## Where the data comes from

| Data | Source |
|---|---|
| Pokémon stats, types, abilities, evolutions, sprites, cries | [PokeAPI](https://pokeapi.co), live |
| Routes and wild Pokémon locations | PokeAPI, live |
| Which Pokémon are in each game (team builder filter) | PokeAPI regional Pokédexes, live |
| Regions, games, version exclusives, type chart | `js/data.js` |
| Gyms, Elite Four, key items, gift Pokémon | `js/guides.js` |

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

Pokémon data and sprites come from [PokeAPI](https://pokeapi.co).

This is a non-commercial fan site. Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak and The Pokémon Company.
