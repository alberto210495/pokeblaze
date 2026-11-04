// Static data: generations, types, regions and games.
// Per-Pokémon data is fetched live from PokeAPI (see app.js).

const GENERATIONS = [
  { n: 1, from: 1, to: 151, region: 'kanto' },
  { n: 2, from: 152, to: 251, region: 'johto' },
  { n: 3, from: 252, to: 386, region: 'hoenn' },
  { n: 4, from: 387, to: 493, region: 'sinnoh' },
  { n: 5, from: 494, to: 649, region: 'unova' },
  { n: 6, from: 650, to: 721, region: 'kalos' },
  { n: 7, from: 722, to: 809, region: 'alola' },
  { n: 8, from: 810, to: 905, region: 'galar' },
  { n: 9, from: 906, to: 1025, region: 'paldea' },
];

const TYPE_COLORS = {
  normal: '#9fa19f', fire: '#e62829', water: '#2980ef', grass: '#3fa129',
  electric: '#e0b400', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb',
  ground: '#915121', flying: '#81b9ef', psychic: '#ef4179', bug: '#91a119',
  rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e',
  steel: '#60a1b8', fairy: '#ef70ef',
};

// Attacking type → defending types it hits for ×2, ×½ and ×0 (current-generation chart).
const TYPE_CHART = {
  normal: { double: [], half: ['rock', 'steel'], zero: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'], zero: [] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'], zero: [] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
  grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], zero: [] },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'], zero: [] },
  fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], zero: ['ghost'] },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'], zero: [] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], zero: [] },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'], zero: [] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], zero: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'], zero: [] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'], zero: [] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'], zero: [] },
};

// The type chart as it was in a given generation, built from the current one:
//   Gen 2–5: Steel also resisted Ghost and Dark (changed in Gen 6, when Fairy arrived).
//   Gen 1:   on top of that, Ghost had no effect on Psychic, Bug was super effective on Poison,
//            Poison was super effective on Bug, and Ice did normal damage to Fire.
// Types that didn't exist yet (Dark, Steel before Gen 2; Fairy before Gen 6) are left out by typesOfGen() in app.js.
function typeChartFor(gen) {
  if (gen >= 6) return TYPE_CHART;
  const chart = Object.fromEntries(Object.entries(TYPE_CHART).map(([t, e]) => [t, { double: [...e.double], half: [...e.half], zero: [...e.zero] }]));
  // Move a defending type between an attacking type's lists (from/to: 'double', 'half', 'zero', or null for "normal damage").
  const move = (atk, def, from, to) => {
    if (from) chart[atk][from] = chart[atk][from].filter(t => t !== def);
    if (to && !chart[atk][to].includes(def)) chart[atk][to].push(def);
  };
  move('ghost', 'steel', null, 'half');
  move('dark', 'steel', null, 'half');
  if (gen === 1) {
    move('ghost', 'psychic', 'double', 'zero');
    move('bug', 'poison', 'half', 'double');
    move('poison', 'bug', null, 'double');
    move('ice', 'fire', 'half', null);
  }
  return chart;
}

const STAT_NAMES = {
  hp: 'HP', attack: 'Attack', defense: 'Defense',
  'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', speed: 'Speed',
};

const REGIONS = [
  {
    id: 'kanto', name: 'Kanto', gen: 1, color: '#e3350d',
    basedOn: 'Kantō region (Japan)',
    professor: 'Professor Oak',
    description: 'Where it all began. Towns named after colors, Team Rocket as the villains and eight Gyms leading to the Indigo Plateau.',
    starters: [1, 4, 7],
    legendaries: [144, 145, 146, 150, 151],
    games: ['red-blue', 'yellow', 'firered-leafgreen', 'lets-go'],
    facts: ['Shares its Pokémon League with Johto.', 'Can be visited as post-game content in Gold, Silver, Crystal and their remakes.'],
  },
  {
    id: 'johto', name: 'Johto', gen: 2, color: '#b69e31',
    basedOn: 'Kansai and Chūbu regions (Japan)',
    professor: 'Professor Elm',
    description: 'A traditional region full of temples and legends, west of Kanto. It introduced the day/night cycle and Pokémon breeding.',
    starters: [152, 155, 158],
    legendaries: [243, 244, 245, 249, 250, 251],
    games: ['gold-silver', 'crystal', 'heartgold-soulsilver'],
    facts: ['Ecruteak City and Goldenrod City are inspired by Kyoto and Osaka.', 'The only region where you can earn 16 badges in one adventure.'],
  },
  {
    id: 'hoenn', name: 'Hoenn', gen: 3, color: '#4b9a5b',
    basedOn: 'Kyūshū island (Japan)',
    professor: 'Professor Birch',
    description: 'A tropical region with lots of sea, volcanoes and jungles. The conflict revolves around land (Groudon) and sea (Kyogre).',
    starters: [252, 255, 258],
    legendaries: [377, 378, 379, 380, 381, 382, 383, 384, 385, 386],
    games: ['ruby-sapphire', 'emerald', 'oras'],
    facts: ['Introduced Abilities, Natures and Double Battles.', 'Famous for the "too much water" meme.'],
  },
  {
    id: 'sinnoh', name: 'Sinnoh', gen: 4, color: '#6b6bb5',
    basedOn: 'Hokkaidō island (Japan)',
    professor: 'Professor Rowan',
    description: 'A cold, mountainous region split by Mt. Coronet. Its mythology is about the creation of the universe, time and space.',
    starters: [387, 390, 393],
    legendaries: [480, 481, 482, 483, 484, 485, 486, 487, 488, 491, 493],
    games: ['diamond-pearl', 'platinum', 'bdsp'],
    facts: ['Introduced the physical/special move split.', 'First games with online trading over Wi-Fi.'],
  },
  {
    id: 'hisui', name: 'Hisui', gen: 8, color: '#8a6f4a',
    basedOn: 'Meiji-era Hokkaidō',
    professor: 'Professor Laventon',
    description: 'The ancient name of Sinnoh, centuries before the modern games. A wild land where people are only beginning to live alongside Pokémon.',
    starters: [722, 155, 501],
    legendaries: [480, 481, 482, 483, 484, 485, 487, 488, 905, 493],
    games: ['legends-arceus'],
    facts: ['Has its own regional forms (Hisuian Growlithe, Zorua, Typhlosion…).', 'This is where the very first Sinnoh Pokédex is written.'],
  },
  {
    id: 'unova', name: 'Unova', gen: 5, color: '#444444',
    basedOn: 'New York City (USA)',
    professor: 'Professor Juniper',
    description: 'The first region based outside Japan. A huge metropolis (Castelia City), giant bridges and a story about truth and ideals.',
    starters: [495, 498, 501],
    legendaries: [494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649],
    games: ['black-white', 'black2-white2'],
    facts: ['In Black and White only new Pokémon appear until the story is finished.', 'Team Plasma questions whether it is ethical to keep Pokémon.'],
  },
  {
    id: 'kalos', name: 'Kalos', gen: 6, color: '#2a6fdb',
    basedOn: 'France',
    professor: 'Professor Sycamore',
    description: 'An elegant region focused on beauty, with Lumiose City (Paris) at its heart. Mega Evolution debuts here.',
    starters: [650, 653, 656],
    legendaries: [716, 717, 718, 719, 720, 721],
    games: ['x-y', 'legends-za'],
    facts: ['Introduced the Fairy type.', 'Prism Tower is inspired by the Eiffel Tower.'],
  },
  {
    id: 'alola', name: 'Alola', gen: 7, color: '#f5a623',
    basedOn: 'Hawaii (USA)',
    professor: 'Professor Kukui',
    description: 'An archipelago of four islands with its own culture: instead of Gyms there are Island Trials and Grand Trials. Ultra Beasts appear here.',
    starters: [722, 725, 728],
    legendaries: [772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807],
    games: ['sun-moon', 'ultra-sun-moon'],
    facts: ['Introduced regional forms (Alolan Vulpix, Alolan Exeggutor…).', 'Each island has a guardian Tapu.'],
  },
  {
    id: 'galar', name: 'Galar', gen: 8, color: '#c2185b',
    basedOn: 'United Kingdom',
    professor: 'Professor Magnolia',
    description: 'An industrial region where Gym battles are held in stadiums like a major sport. Home of the Wild Area and the Dynamax phenomenon.',
    starters: [810, 813, 816],
    legendaries: [888, 889, 890, 891, 892, 894, 895, 896, 897, 898],
    games: ['sword-shield'],
    facts: ['First region with a partial open world (the Wild Area).', 'Expanded by the Isle of Armor and Crown Tundra DLC.'],
  },
  {
    id: 'paldea', name: 'Paldea', gen: 9, color: '#7b3fa0',
    basedOn: 'Iberian Peninsula (Spain and Portugal)',
    professor: 'Professor Sada / Professor Turo',
    description: 'The first fully open-world region. The story splits into three paths: Gyms, Team Star and Titan Pokémon, with the Great Crater of Paldea at its center.',
    starters: [906, 909, 912],
    legendaries: [1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024, 1025],
    games: ['scarlet-violet'],
    facts: ['The player is a student at an academy (Naranja or Uva).', 'The DLC visits Kitakami and Blueberry Academy.'],
  },
];

const GAMES = [
  {
    id: 'red-blue', name: 'Red & Blue', year: 1996, platform: 'Game Boy', gen: 1, region: 'kanto', type: 'Original',
    cover: [6, 9], mechanic: '151 Pokémon, trading by Link Cable',
    summary: 'The very first games. Released in Japan as Red and Green (1996), they reached the West as Red and Blue (1998-1999).',
    features: ['151 Pokémon and 15 types', 'Trading and battling over the Link Cable', 'Eight Gyms and the Pokémon League', 'Team Rocket as the villains'],
    versions: [
      { name: 'Red', pokemon: [23, 24, 43, 44, 45, 56, 57, 58, 59, 123, 125] },
      { name: 'Blue', pokemon: [27, 28, 37, 38, 52, 53, 69, 70, 71, 126, 127] },
    ],
    differences: ['Each version has 11 exclusive Pokémon: you must trade to complete the Pokédex.', 'The Japanese Red/Green had different sprites; Japanese Blue fixed bugs.'],
  },
  {
    id: 'yellow', name: 'Yellow', year: 1998, platform: 'Game Boy', gen: 1, region: 'kanto', type: 'Special edition',
    cover: [25], mechanic: 'Pikachu follows you outside its Poké Ball',
    summary: 'An enhanced version of Red and Blue inspired by the anime.',
    features: ['You start with Pikachu, who follows you around', 'Jessie and James from the anime appear', 'Bulbasaur, Charmander and Squirtle can all be received as gifts', 'Color palettes on Game Boy Color'],
    versions: null,
    differences: ['Some Pokémon from Red/Blue are missing (e.g. Ekans, Koffing, Meowth, Electabuzz…).', 'Your rival starts with Eevee, and its evolution depends on your battles.'],
  },
  {
    id: 'gold-silver', name: 'Gold & Silver', year: 1999, platform: 'Game Boy Color', gen: 2, region: 'johto', type: 'Original',
    cover: [250, 249], mechanic: 'Day/night cycle and breeding',
    summary: 'A direct sequel to Red/Blue: three years later in neighboring Johto, with Kanto included at the end.',
    features: ['100 new Pokémon (251 total)', 'Dark and Steel types', 'Real-time clock with day and night', 'Day Care eggs and Shiny Pokémon', 'Held items and Berries', 'Special split into Sp. Atk and Sp. Def'],
    versions: [
      { name: 'Gold', pokemon: [56, 57, 58, 59, 167, 168, 207, 216, 217, 226, 250] },
      { name: 'Silver', pokemon: [37, 38, 52, 53, 165, 166, 225, 227, 231, 232, 249] },
    ],
    differences: ['Ho-Oh is the mascot of Gold and Lugia of Silver (the other one is available later at a lower level).'],
  },
  {
    id: 'crystal', name: 'Crystal', year: 2000, platform: 'Game Boy Color', gen: 2, region: 'johto', type: 'Special edition',
    cover: [245], mechanic: 'Choose your character\'s gender',
    summary: 'The definitive version of Gold and Silver, with an expanded story around Suicune.',
    features: ['First game where you can play as a boy or a girl', 'Animated sprites when Pokémon enter battle', 'Battle Tower', 'Expanded story with Suicune and Eusine'],
    versions: null,
    differences: ['Ho-Oh and Lugia are both available in the same save file.'],
  },
  {
    id: 'ruby-sapphire', name: 'Ruby & Sapphire', year: 2002, platform: 'Game Boy Advance', gen: 3, region: 'hoenn', type: 'Original',
    cover: [383, 382], mechanic: 'Abilities, Natures and Double Battles',
    summary: 'A technical reboot on GBA: a new region and much deeper battle systems.',
    features: ['135 new Pokémon', 'Abilities and Natures', 'Double Battles', 'Pokémon Contests', 'Secret Bases'],
    versions: [
      { name: 'Ruby', pokemon: [273, 274, 275, 303, 335, 338, 383] },
      { name: 'Sapphire', pokemon: [270, 271, 272, 302, 336, 337, 382] },
    ],
    differences: ['In Ruby the villain is Team Magma (expand the land with Groudon).', 'In Sapphire it is Team Aqua (expand the sea with Kyogre).', 'Not compatible with earlier Game Boy games.'],
  },
  {
    id: 'firered-leafgreen', name: 'FireRed & LeafGreen', year: 2004, platform: 'Game Boy Advance', gen: 3, region: 'kanto', type: 'Remake',
    cover: [6, 3], mechanic: 'Kanto remake with the Sevii Islands',
    summary: 'A remake of Red and Green using the third-generation engine.',
    features: ['Sevii Islands as post-game content', 'Wireless Adapter included', 'On-screen hints for new players'],
    versions: [
      { name: 'FireRed', pokemon: [23, 43, 56, 58, 123, 125, 239] },
      { name: 'LeafGreen', pokemon: [27, 37, 52, 69, 126, 127, 240] },
    ],
    differences: ['Exclusives are almost the same as Red and Blue.', 'Some Gen 2 Pokémon appear in the Sevii Islands depending on the version.'],
  },
  {
    id: 'emerald', name: 'Emerald', year: 2004, platform: 'Game Boy Advance', gen: 3, region: 'hoenn', type: 'Special edition',
    cover: [384], mechanic: 'Battle Frontier',
    summary: 'The definitive version of Ruby and Sapphire, with Rayquaza in the spotlight.',
    features: ['Battle Frontier, a huge post-game challenge', 'Teams Magma and Aqua both appear in the story', 'Animated sprites return'],
    versions: null,
    differences: ['Groudon and Kyogre can both be caught after the story.', 'Sootopolis Gym has a different leader (Juan instead of Wallace).'],
  },
  {
    id: 'diamond-pearl', name: 'Diamond & Pearl', year: 2006, platform: 'Nintendo DS', gen: 4, region: 'sinnoh', type: 'Original',
    cover: [483, 484], mechanic: 'Physical/special split and Wi-Fi',
    summary: 'The jump to Nintendo DS, with two screens and online play.',
    features: ['107 new Pokémon', 'Each move is physical or special (no longer tied to its type)', 'Global Trade Station (GTS) over Wi-Fi', 'The Underground to play with friends', 'Pokétch watch'],
    versions: [
      { name: 'Diamond', pokemon: [408, 409, 434, 435, 198, 430, 246, 247, 248, 483] },
      { name: 'Pearl', pokemon: [410, 411, 431, 432, 200, 429, 371, 372, 373, 484] },
    ],
    differences: ['Dialga (time) is the mascot of Diamond and Palkia (space) of Pearl.', 'Different fossils: Cranidos in Diamond, Shieldon in Pearl.'],
  },
  {
    id: 'platinum', name: 'Platinum', year: 2008, platform: 'Nintendo DS', gen: 4, region: 'sinnoh', type: 'Special edition',
    cover: [487], mechanic: 'Distortion World',
    summary: 'The definitive version of Diamond and Pearl, centered on Giratina.',
    features: ['Distortion World with twisted gravity', 'Giratina\'s Origin Forme', 'Battle Frontier', 'Expanded regional Pokédex (210)'],
    versions: null,
    differences: ['Dialga and Palkia can both be obtained.', 'Changes to Gym order and some trainers\' teams.'],
  },
  {
    id: 'heartgold-soulsilver', name: 'HeartGold & SoulSilver', year: 2009, platform: 'Nintendo DS', gen: 4, region: 'johto', type: 'Remake',
    cover: [250, 249], mechanic: 'Following Pokémon + Pokéwalker',
    summary: 'A remake of Gold and Silver, considered one of the best games in the series.',
    features: ['Any Pokémon can follow you around', 'Pokéwalker pedometer included', 'Revamped Safari Zone and Battle Frontier'],
    versions: [
      { name: 'HeartGold', pokemon: [56, 58, 167, 207, 216, 226, 250] },
      { name: 'SoulSilver', pokemon: [37, 52, 165, 225, 227, 231, 249] },
    ],
    differences: ['Same exclusives as Gold and Silver.', 'Ho-Oh is the mascot of HeartGold and Lugia of SoulSilver.'],
  },
  {
    id: 'black-white', name: 'Black & White', year: 2010, platform: 'Nintendo DS', gen: 5, region: 'unova', type: 'Original',
    cover: [643, 644], mechanic: 'Only new Pokémon, and seasons',
    summary: 'A "fresh start": a region outside Japan and 156 new Pokémon, the most of any generation.',
    features: ['156 new Pokémon (the only ones in the main story)', 'Seasons that change the map', 'Triple and Rotation Battles', 'Fully animated sprites'],
    versions: [
      { name: 'Black', pokemon: [574, 575, 576, 629, 630, 546, 547, 641, 643] },
      { name: 'White', pokemon: [577, 578, 579, 627, 628, 548, 549, 642, 644] },
    ],
    differences: ['Black has Black City (modern city, battles); White has White Forest (nature, wild Pokémon).', 'Reshiram in Black, Zekrom in White.'],
  },
  {
    id: 'black2-white2', name: 'Black 2 & White 2', year: 2012, platform: 'Nintendo DS', gen: 5, region: 'unova', type: 'Sequel',
    cover: [646], mechanic: 'First direct sequel',
    summary: 'The only direct sequel in the main series: two years after Black and White.',
    features: ['Pokéstar Studios (movie making)', 'Pokémon World Tournament with leaders from every region', 'Medal system (achievements)', 'Black Kyurem and White Kyurem'],
    versions: [
      { name: 'Black 2', pokemon: [646] },
      { name: 'White 2', pokemon: [646] },
    ],
    differences: ['Black 2: Black Kyurem and Black Tower.', 'White 2: White Kyurem and White Treehollow.'],
  },
  {
    id: 'x-y', name: 'X & Y', year: 2013, platform: 'Nintendo 3DS', gen: 6, region: 'kalos', type: 'Original',
    cover: [716, 717], mechanic: 'Mega Evolution and the Fairy type',
    summary: 'The first fully 3D main-series game, and the first simultaneous worldwide release.',
    features: ['Mega Evolution', 'Fairy type', 'Character customization', 'Pokémon-Amie and Super Training', 'Sky Battles and Horde Encounters'],
    versions: [
      { name: 'X', pokemon: [684, 685, 690, 691, 716] },
      { name: 'Y', pokemon: [682, 683, 692, 693, 717] },
    ],
    differences: ['Xerneas in X, Yveltal in Y.', 'Mewtwonite X only in X and Mewtwonite Y only in Y.'],
  },
  {
    id: 'oras', name: 'Omega Ruby & Alpha Sapphire', year: 2014, platform: 'Nintendo 3DS', gen: 6, region: 'hoenn', type: 'Remake',
    cover: [383, 382], mechanic: 'Primal Reversion',
    summary: 'A remake of Ruby and Sapphire with new Mega Evolutions.',
    features: ['Primal Groudon and Primal Kyogre', 'Delta Episode (post-game with Rayquaza and Deoxys)', 'Soaring through the sky on Latios/Latias', 'Legendaries from other regions'],
    versions: [
      { name: 'Omega Ruby', pokemon: [273, 303, 335, 338, 383, 381] },
      { name: 'Alpha Sapphire', pokemon: [270, 302, 336, 337, 382, 380] },
    ],
    differences: ['Same villain split as the originals.', 'Latios in Omega Ruby and Latias in Alpha Sapphire (the reverse of the originals).'],
  },
  {
    id: 'sun-moon', name: 'Sun & Moon', year: 2016, platform: 'Nintendo 3DS', gen: 7, region: 'alola', type: 'Original',
    cover: [791, 792], mechanic: 'Z-Moves and Island Trials',
    summary: 'Breaks the classic formula: trials instead of Gyms, plus regional forms.',
    features: ['Z-Moves', 'Island Trials and Totem Pokémon', 'Alolan forms', 'Ultra Beasts', 'Ride Pokémon instead of HMs'],
    versions: [
      { name: 'Sun', pokemon: [766, 776, 794, 798, 791] },
      { name: 'Moon', pokemon: [765, 780, 795, 797, 792] },
    ],
    differences: ['Moon\'s clock is shifted 12 hours from real time; Sun uses real time.', 'Solgaleo in Sun, Lunala in Moon.'],
  },
  {
    id: 'ultra-sun-moon', name: 'Ultra Sun & Ultra Moon', year: 2017, platform: 'Nintendo 3DS', gen: 7, region: 'alola', type: 'Special edition',
    cover: [800], mechanic: 'Ultra Wormholes',
    summary: 'An expanded version of Sun and Moon with an alternate story centered on Necrozma.',
    features: ['Ultra Necrozma', 'Ultra Warp Ride (legendaries from every generation)', 'Team Rainbow Rocket', 'New Ultra Beasts'],
    versions: [
      { name: 'Ultra Sun', pokemon: [766, 776, 794, 798, 805, 791] },
      { name: 'Ultra Moon', pokemon: [765, 780, 795, 797, 806, 792] },
    ],
    differences: ['Stakataka in Ultra Sun, Blacephalon in Ultra Moon.', 'Different legendaries in Ultra Space depending on the version.'],
  },
  {
    id: 'lets-go', name: "Let's Go, Pikachu! & Let's Go, Eevee!", year: 2018, platform: 'Nintendo Switch', gen: 7, region: 'kanto', type: 'Remake',
    cover: [25, 133], mechanic: 'Pokémon GO-style catching',
    summary: 'A reimagining of Yellow designed for new players and connected to Pokémon GO.',
    features: ['Wild Pokémon visible on the map', 'Catching without battling, like in Pokémon GO', 'Two-player co-op', 'Meltan and Melmetal'],
    versions: [
      { name: 'Pikachu', pokemon: [25] },
      { name: 'Eevee', pokemon: [133] },
    ],
    differences: ['Your partner is Pikachu or Eevee, and each version has its own exclusives.', 'Only includes the 151 Kanto Pokémon (plus Alolan forms and Meltan).'],
  },
  {
    id: 'sword-shield', name: 'Sword & Shield', year: 2019, platform: 'Nintendo Switch', gen: 8, region: 'galar', type: 'Original',
    cover: [888, 889], mechanic: 'Dynamax and the Wild Area',
    summary: 'The first main-series game developed for a home console.',
    features: ['Dynamax and Gigantamax', 'Wild Area with a free camera', 'Co-op Max Raid Battles', 'DLC: The Isle of Armor and The Crown Tundra'],
    versions: [
      { name: 'Sword', pokemon: [865, 633, 634, 635, 782, 783, 784, 841, 888] },
      { name: 'Shield', pokemon: [246, 247, 248, 704, 705, 706, 842, 889] },
    ],
    differences: ['Different Gym Leaders: Bea (Fighting) and Gordie (Rock) in Sword; Allister (Ghost) and Melony (Ice) in Shield.', 'Zacian in Sword, Zamazenta in Shield.', 'Does not include every previous Pokémon (the "Dexit" controversy).'],
  },
  {
    id: 'bdsp', name: 'Brilliant Diamond & Shining Pearl', year: 2021, platform: 'Nintendo Switch', gen: 8, region: 'sinnoh', type: 'Remake',
    cover: [483, 484], mechanic: 'Grand Underground',
    summary: 'A faithful remake of Diamond and Pearl in a chibi art style.',
    features: ['Grand Underground with Pokémon Hideaways', 'Following Pokémon in Amity Square', 'Ball Capsules with stickers'],
    versions: [
      { name: 'Brilliant Diamond', pokemon: [408, 434, 198, 246, 483] },
      { name: 'Shining Pearl', pokemon: [410, 431, 200, 371, 484] },
    ],
    differences: ['Same exclusives as the originals.', 'Legendaries from other generations in Ramanas Park depend on the version.'],
  },
  {
    id: 'legends-arceus', name: 'Legends: Arceus', year: 2022, platform: 'Nintendo Switch', gen: 8, region: 'hisui', type: 'Legends',
    cover: [493], mechanic: 'Real-time catching and open areas',
    summary: 'An action-exploration game set in Sinnoh\'s past. There is only one version.',
    features: ['Throw Poké Balls directly in the overworld', 'Agile and Strong battle styles', 'Hisuian forms', 'Noble Pokémon', 'Research tasks for the Pokédex'],
    versions: null,
    differences: ['No Gyms or Pokémon League.', 'Single edition: every Pokémon can be obtained.'],
  },
  {
    id: 'scarlet-violet', name: 'Scarlet & Violet', year: 2022, platform: 'Nintendo Switch', gen: 9, region: 'paldea', type: 'Original',
    cover: [1007, 1008], mechanic: 'Open world and Terastallization',
    summary: 'The first fully open world in the main series, with 4-player co-op.',
    features: ['Open world with no fixed order', 'Terastallization (change a Pokémon\'s type)', 'Union Circle (explore with 3 friends)', 'Picnics and sandwiches', 'DLC: The Teal Mask and The Indigo Disk'],
    versions: [
      { name: 'Scarlet', pokemon: [984, 985, 986, 987, 1005, 1007] },
      { name: 'Violet', pokemon: [990, 991, 992, 993, 1006, 1008] },
    ],
    differences: ['Scarlet has Naranja Academy, Professor Sada and ancient Paradox Pokémon.', 'Violet has Uva Academy, Professor Turo and future Paradox Pokémon.', 'Koraidon in Scarlet, Miraidon in Violet.'],
  },
  {
    id: 'legends-za', name: 'Legends: Z-A', year: 2025, platform: 'Nintendo Switch / Switch 2', gen: 9, region: 'kalos', type: 'Legends',
    cover: [718], mechanic: 'Real-time battles and Mega Evolution',
    summary: 'Set entirely in Lumiose City during a major redevelopment. There is only one version.',
    features: ['Real-time battles', 'Mega Evolution returns, with new Megas', 'Wild Zones inside the city', 'Enhanced Nintendo Switch 2 Edition'],
    versions: null,
    differences: ['Single edition; the Switch 2 version has better performance and resolution.'],
  },
];
