// Per-game guide data (curated by hand; PokeAPI has no gym or item-location data).
// Wild Pokémon and routes are loaded live from PokeAPI using `versions` and `regions`.
//
//   versions:   PokeAPI version slugs that make up the game
//   regions:    PokeAPI regions whose locations appear in the game
//   milestones: progression sections (Gyms, Elite Four, Trials…), each a list of
//               { who, type, where, reward }
//   items:      key items / HMs and where to get them: { name, where }
//   gifts:      gift Pokémon: { id, where }

const KANTO_GYMS = {
  title: 'Gyms', list: [
    { who: 'Brock', type: 'rock', where: 'Pewter City', reward: 'Boulder Badge' },
    { who: 'Misty', type: 'water', where: 'Cerulean City', reward: 'Cascade Badge' },
    { who: 'Lt. Surge', type: 'electric', where: 'Vermilion City', reward: 'Thunder Badge' },
    { who: 'Erika', type: 'grass', where: 'Celadon City', reward: 'Rainbow Badge' },
    { who: 'Koga', type: 'poison', where: 'Fuchsia City', reward: 'Soul Badge' },
    { who: 'Sabrina', type: 'psychic', where: 'Saffron City', reward: 'Marsh Badge' },
    { who: 'Blaine', type: 'fire', where: 'Cinnabar Island', reward: 'Volcano Badge' },
    { who: 'Giovanni', type: 'ground', where: 'Viridian City', reward: 'Earth Badge' },
  ],
};

const kantoLeague = champion => ({
  title: 'Elite Four', list: [
    { who: 'Lorelei', type: 'ice', where: 'Indigo Plateau' },
    { who: 'Bruno', type: 'fighting', where: 'Indigo Plateau' },
    { who: 'Agatha', type: 'ghost', where: 'Indigo Plateau' },
    { who: 'Lance', type: 'dragon', where: 'Indigo Plateau' },
    { who: champion, where: 'Indigo Plateau', reward: 'Champion' },
  ],
});

const KANTO_ITEMS = [
  { name: "Oak's Parcel", where: 'Viridian City Poké Mart (deliver it to Professor Oak to get the Pokédex)' },
  { name: 'HM05 Flash', where: "Professor Oak's aide, Route 2 gate (needs 10 Pokémon caught)" },
  { name: 'Bike Voucher', where: 'Pokémon Fan Club chairman, Vermilion City' },
  { name: 'Bicycle', where: 'Bike Shop, Cerulean City (trade in the Bike Voucher)' },
  { name: 'HM01 Cut', where: 'Captain of the S.S. Anne, Vermilion City' },
  { name: 'Old Rod', where: 'Fishing Guru, Vermilion City' },
  { name: 'Coin Case', where: 'Restaurant, Celadon City' },
  { name: 'Lift Key', where: 'Rocket Hideout B4F (under the Celadon Game Corner)' },
  { name: 'Silph Scope', where: 'Rocket Hideout B4F, after beating Giovanni' },
  { name: 'Poké Flute', where: 'Mr. Fuji, Lavender Town (after clearing Pokémon Tower)' },
  { name: 'HM02 Fly', where: 'House on Route 16, behind a Cut tree' },
  { name: 'Good Rod', where: 'Fishing Guru, Fuchsia City' },
  { name: 'HM03 Surf', where: 'Secret House, Safari Zone' },
  { name: 'Gold Teeth', where: 'Safari Zone' },
  { name: 'HM04 Strength', where: 'Safari Zone Warden, Fuchsia City (return his Gold Teeth)' },
  { name: 'Super Rod', where: "Fishing Guru's house, Route 12" },
  { name: 'Card Key', where: 'Silph Co. 5F, Saffron City' },
  { name: 'Master Ball', where: 'Silph Co. 11F, from the president' },
  { name: 'Secret Key', where: 'Pokémon Mansion B1F, Cinnabar Island' },
  { name: 'Itemfinder', where: "Professor Oak's aide, Route 11 gate 2F (needs 30 Pokémon caught)" },
];

const KANTO_GIFTS = [
  { id: 129, where: 'Route 4 Pokémon Center (bought from a man for ₽500)' },
  { id: 106, where: 'Fighting Dojo, Saffron City (choose Hitmonlee or Hitmonchan)' },
  { id: 107, where: 'Fighting Dojo, Saffron City (choose Hitmonlee or Hitmonchan)' },
  { id: 131, where: 'Silph Co. 7F, Saffron City' },
  { id: 133, where: 'Celadon Mansion rooftop room (back entrance)' },
];

const YELLOW_STARTER_GIFTS = [
  { id: 1, where: 'House in Cerulean City (your Pikachu must be happy)' },
  { id: 4, where: 'Route 24, from a trainer' },
  { id: 7, where: 'Officer Jenny, Vermilion City (after the Thunder Badge)' },
];

const JOHTO_GYMS = [
  { who: 'Falkner', type: 'flying', where: 'Violet City', reward: 'Zephyr Badge' },
  { who: 'Bugsy', type: 'bug', where: 'Azalea Town', reward: 'Hive Badge' },
  { who: 'Whitney', type: 'normal', where: 'Goldenrod City', reward: 'Plain Badge' },
  { who: 'Morty', type: 'ghost', where: 'Ecruteak City', reward: 'Fog Badge' },
  { who: 'Chuck', type: 'fighting', where: 'Cianwood City', reward: 'Storm Badge' },
  { who: 'Jasmine', type: 'steel', where: 'Olivine City', reward: 'Mineral Badge' },
  { who: 'Pryce', type: 'ice', where: 'Mahogany Town', reward: 'Glacier Badge' },
  { who: 'Clair', type: 'dragon', where: 'Blackthorn City', reward: 'Rising Badge' },
];

const JOHTO_KANTO_GYMS = [
  { who: 'Lt. Surge', type: 'electric', where: 'Vermilion City', reward: 'Thunder Badge' },
  { who: 'Sabrina', type: 'psychic', where: 'Saffron City', reward: 'Marsh Badge' },
  { who: 'Misty', type: 'water', where: 'Cerulean City', reward: 'Cascade Badge' },
  { who: 'Erika', type: 'grass', where: 'Celadon City', reward: 'Rainbow Badge' },
  { who: 'Janine', type: 'poison', where: 'Fuchsia City', reward: 'Soul Badge' },
  { who: 'Brock', type: 'rock', where: 'Pewter City', reward: 'Boulder Badge' },
  { who: 'Blaine', type: 'fire', where: 'Seafoam Islands', reward: 'Volcano Badge' },
  { who: 'Blue', where: 'Viridian City', reward: 'Earth Badge' },
];

const JOHTO_MILESTONES = [
  { title: 'Johto Gyms', list: JOHTO_GYMS },
  {
    title: 'Elite Four', list: [
      { who: 'Will', type: 'psychic', where: 'Indigo Plateau' },
      { who: 'Koga', type: 'poison', where: 'Indigo Plateau' },
      { who: 'Bruno', type: 'fighting', where: 'Indigo Plateau' },
      { who: 'Karen', type: 'dark', where: 'Indigo Plateau' },
      { who: 'Lance', type: 'dragon', where: 'Indigo Plateau', reward: 'Champion' },
    ],
  },
  { title: 'Kanto Gyms (post-game)', list: JOHTO_KANTO_GYMS },
  { title: 'Final battle', list: [{ who: 'Red', where: 'Mt. Silver summit' }] },
];

const JOHTO_ITEMS = [
  { name: 'Mystery Egg', where: "Mr. Pokémon's house, Route 30" },
  { name: 'Pokédex', where: "Professor Oak, at Mr. Pokémon's house" },
  { name: 'HM05 Flash', where: 'Elder at the top of Sprout Tower, Violet City' },
  { name: 'Old Rod', where: 'Fisherman in the Route 32 Pokémon Center' },
  { name: 'HM01 Cut', where: "Charcoal Kiln master, Ilex Forest (after you find his Farfetch'd)" },
  { name: 'Bicycle', where: 'Bike Shop, Goldenrod City' },
  { name: 'Coin Case', where: 'Goldenrod Underground' },
  { name: 'SquirtBottle', where: 'Flower Shop, Goldenrod City (after beating Whitney)' },
  { name: 'TM08 Rock Smash', where: 'Man on Route 36, near the Sudowoodo' },
  { name: 'HM03 Surf', where: 'Gentleman at the Dance Theater, Ecruteak City (beat the Kimono Girls)' },
  { name: 'HM04 Strength', where: 'Sailor in the Olivine Café' },
  { name: 'Good Rod', where: 'House in Olivine City' },
  { name: 'SecretPotion', where: 'Pharmacy, Cianwood City' },
  { name: 'HM02 Fly', where: "Chuck's wife, Cianwood City" },
  { name: 'HM06 Whirlpool', where: 'Lance, Team Rocket HQ, Mahogany Town' },
  { name: 'Card Key', where: 'Radio Tower Director, Goldenrod Underground' },
  { name: 'HM07 Waterfall', where: 'Ice Path B1F' },
  { name: 'S.S. Ticket', where: 'Professor Elm, after becoming Champion' },
  { name: 'Machine Part', where: 'Hidden in the pool of the Cerulean Gym' },
  { name: 'Lost Item', where: 'Pokémon Fan Club, Vermilion City' },
  { name: 'Pass', where: 'Copycat, Saffron City (return the Lost Item)' },
  { name: 'Super Rod', where: 'House on Route 12' },
];

const JOHTO_GIFTS = [
  { id: 175, where: "Mystery Egg from Mr. Pokémon's house, Route 30" },
  { id: 133, where: 'Bill, Goldenrod City' },
  { id: 213, where: 'Kirk, Cianwood City' },
  { id: 236, where: 'Karate King, Mt. Mortar' },
  { id: 147, where: "Dragon's Den (after the Dragon Shrine quiz)" },
];

const HOENN_GYMS = last => ({
  title: 'Gyms', list: [
    { who: 'Roxanne', type: 'rock', where: 'Rustboro City', reward: 'Stone Badge' },
    { who: 'Brawly', type: 'fighting', where: 'Dewford Town', reward: 'Knuckle Badge' },
    { who: 'Wattson', type: 'electric', where: 'Mauville City', reward: 'Dynamo Badge' },
    { who: 'Flannery', type: 'fire', where: 'Lavaridge Town', reward: 'Heat Badge' },
    { who: 'Norman', type: 'normal', where: 'Petalburg City', reward: 'Balance Badge' },
    { who: 'Winona', type: 'flying', where: 'Fortree City', reward: 'Feather Badge' },
    { who: 'Tate & Liza', type: 'psychic', where: 'Mossdeep City', reward: 'Mind Badge' },
    { who: last, type: 'water', where: 'Sootopolis City', reward: 'Rain Badge' },
  ],
});

const hoennLeague = champion => ({
  title: 'Elite Four', list: [
    { who: 'Sidney', type: 'dark', where: 'Ever Grande City' },
    { who: 'Phoebe', type: 'ghost', where: 'Ever Grande City' },
    { who: 'Glacia', type: 'ice', where: 'Ever Grande City' },
    { who: 'Drake', type: 'dragon', where: 'Ever Grande City' },
    { who: champion, type: champion === 'Wallace' ? 'water' : 'steel', where: 'Ever Grande City', reward: 'Champion' },
  ],
});

const HOENN_ITEMS = [
  { name: 'HM01 Cut', where: "Cutter's House, Rustboro City" },
  { name: 'Letter', where: 'Mr. Stone, Devon Corporation, Rustboro City (deliver it to Steven)' },
  { name: 'HM05 Flash', where: 'Hiker in Granite Cave, near Dewford Town' },
  { name: 'Old Rod', where: 'Fisherman, Dewford Town' },
  { name: 'HM06 Rock Smash', where: 'Rock Smash Guy, Mauville City' },
  { name: 'Mach Bike / Acro Bike', where: "Rydel's Cycles, Mauville City" },
  { name: 'HM04 Strength', where: 'Rusturf Tunnel (after reuniting Wanda and her boyfriend)' },
  { name: 'Go-Goggles', where: 'Your rival, Lavaridge Town' },
  { name: 'HM03 Surf', where: "Wally's father, Petalburg City (after beating Norman)" },
  { name: 'Good Rod', where: 'Fisherman on Route 118' },
  { name: 'HM02 Fly', where: 'Your rival on Route 119 (after beating them)' },
  { name: 'Devon Scope', where: 'Steven, Route 120' },
  { name: 'HM08 Dive', where: "Steven's house, Mossdeep City (after the Mind Badge)" },
  { name: 'Super Rod', where: 'House in Mossdeep City' },
  { name: 'HM07 Waterfall', where: 'Wallace, at the entrance to the Cave of Origin (Sootopolis City)' },
];

const HOENN_GIFTS = [
  { id: 360, where: 'Old lady at the hot springs, Lavaridge Town (Egg)' },
  { id: 351, where: 'Weather Institute, Route 119' },
  { id: 374, where: "Steven's house, Mossdeep City (post-game)" },
];

const SINNOH_GYMS = order => ({
  title: 'Gyms', list: order.map(i => [
    { who: 'Roark', type: 'rock', where: 'Oreburgh City', reward: 'Coal Badge' },
    { who: 'Gardenia', type: 'grass', where: 'Eterna City', reward: 'Forest Badge' },
    { who: 'Maylene', type: 'fighting', where: 'Veilstone City', reward: 'Cobble Badge' },
    { who: 'Crasher Wake', type: 'water', where: 'Pastoria City', reward: 'Fen Badge' },
    { who: 'Fantina', type: 'ghost', where: 'Hearthome City', reward: 'Relic Badge' },
    { who: 'Byron', type: 'steel', where: 'Canalave City', reward: 'Mine Badge' },
    { who: 'Candice', type: 'ice', where: 'Snowpoint City', reward: 'Icicle Badge' },
    { who: 'Volkner', type: 'electric', where: 'Sunyshore City', reward: 'Beacon Badge' },
  ][i]),
});

const SINNOH_LEAGUE = {
  title: 'Elite Four', list: [
    { who: 'Aaron', type: 'bug', where: 'Pokémon League' },
    { who: 'Bertha', type: 'ground', where: 'Pokémon League' },
    { who: 'Flint', type: 'fire', where: 'Pokémon League' },
    { who: 'Lucian', type: 'psychic', where: 'Pokémon League' },
    { who: 'Cynthia', where: 'Pokémon League', reward: 'Champion' },
  ],
};

const SINNOH_ITEMS = [
  { name: 'Pokétch', where: 'Pokétch Company president, Jubilife City (answer the clowns\' quiz)' },
  { name: 'HM06 Rock Smash', where: 'Oreburgh Gate' },
  { name: 'Bicycle', where: 'Cycle Shop, Eterna City (after clearing the Galactic Eterna Building)' },
  { name: 'Explorer Kit', where: 'Underground Man, Eterna City' },
  { name: 'HM01 Cut', where: 'Cynthia, Eterna City (after the Forest Badge)' },
  { name: 'HM02 Fly', where: 'Team Galactic Warehouse, Veilstone City' },
  { name: 'HM03 Surf', where: "Cynthia's grandmother, Celestic Town" },
  { name: 'HM07 Waterfall', where: 'Jasmine, Sunyshore City' },
];

const SINNOH_GIFTS = [
  { id: 133, where: 'Bebe, Hearthome City' },
  { id: 447, where: 'Riley, Iron Island (Egg)' },
];

const UNOVA_LEAGUE = champion => ({
  title: 'Elite Four', list: [
    { who: 'Shauntal', type: 'ghost', where: 'Pokémon League' },
    { who: 'Marshal', type: 'fighting', where: 'Pokémon League' },
    { who: 'Grimsley', type: 'dark', where: 'Pokémon League' },
    { who: 'Caitlin', type: 'psychic', where: 'Pokémon League' },
    { who: champion, type: champion === 'Iris' ? 'dragon' : undefined, where: 'Pokémon League', reward: 'Champion' },
  ],
});

const ALOLA_TRIALS = {
  title: 'Island Trials', list: [
    { who: 'Ilima', type: 'normal', where: 'Verdant Cavern, Melemele Island' },
    { who: 'Lana', type: 'water', where: 'Brooklet Hill, Akala Island' },
    { who: 'Kiawe', type: 'fire', where: 'Wela Volcano Park, Akala Island' },
    { who: 'Mallow', type: 'grass', where: 'Lush Jungle, Akala Island' },
    { who: 'Sophocles', type: 'electric', where: 'Hokulani Observatory, Ula\'ula Island' },
    { who: 'Acerola', type: 'ghost', where: 'Abandoned Thrifty Megamart, Ula\'ula Island' },
  ],
};

const ALOLA_GRAND_TRIALS = {
  title: 'Grand Trials (Kahunas)', list: [
    { who: 'Hala', type: 'fighting', where: 'Melemele Island' },
    { who: 'Olivia', type: 'rock', where: 'Akala Island' },
    { who: 'Nanu', type: 'dark', where: 'Ula\'ula Island' },
    { who: 'Hapu', type: 'ground', where: 'Poni Island' },
  ],
};

const alolaLeague = (first, finalFoe) => ({
  title: 'Elite Four', list: [
    { who: first, type: first === 'Hala' ? 'fighting' : 'steel', where: 'Mount Lanakila' },
    { who: 'Olivia', type: 'rock', where: 'Mount Lanakila' },
    { who: 'Acerola', type: 'ghost', where: 'Mount Lanakila' },
    { who: 'Kahili', type: 'flying', where: 'Mount Lanakila' },
    { who: finalFoe, where: 'Mount Lanakila', reward: 'Champion title' },
  ],
});

const ALOLA_ITEMS = [
  { name: 'Z-Ring', where: 'Kahuna Hala, Iki Town (Melemele Island)' },
];

const ALOLA_GIFTS = [
  { id: 772, where: 'Gladion, Aether Paradise (post-game)' },
];

const GUIDES = {
  'red-blue': {
    versions: ['red', 'blue'], regions: ['kanto'],
    milestones: [KANTO_GYMS, kantoLeague('Your rival')],
    items: [...KANTO_ITEMS, { name: 'Exp. All', where: "Professor Oak's aide, Route 15 gate 2F (needs 50 Pokémon caught)" }],
    gifts: KANTO_GIFTS,
  },
  yellow: {
    versions: ['yellow'], regions: ['kanto'],
    milestones: [KANTO_GYMS, kantoLeague('Your rival')],
    items: [...KANTO_ITEMS, { name: 'Exp. All', where: "Professor Oak's aide, Route 15 gate 2F (needs 50 Pokémon caught)" }],
    gifts: [...YELLOW_STARTER_GIFTS, ...KANTO_GIFTS],
  },
  'firered-leafgreen': {
    versions: ['firered', 'leafgreen'], regions: ['kanto'],
    milestones: [KANTO_GYMS, kantoLeague('Your rival')],
    items: [
      ...KANTO_ITEMS,
      { name: 'Exp. Share', where: "Professor Oak's aide, Route 15 gate 2F (needs 50 Pokémon caught)" },
      { name: 'Vs. Seeker', where: 'Lass in the Vermilion City Pokémon Center' },
      { name: 'Tea', where: 'Old woman, Celadon Mansion 1F (give it to the Saffron City guards)' },
      { name: 'Tri-Pass', where: 'Bill, Cinnabar Island (after the Volcano Badge)' },
      { name: 'Ruby', where: 'Ruby Path, Mt. Ember (One Island)' },
      { name: 'Rainbow Pass', where: 'Celio, One Island Pokémon Center' },
      { name: 'Sapphire', where: 'Dotted Hole, Six Island' },
    ],
    gifts: KANTO_GIFTS,
  },
  'lets-go': {
    versions: ['lets-go-pikachu', 'lets-go-eevee'], regions: ['kanto'],
    milestones: [KANTO_GYMS, kantoLeague('Trace')],
    items: [
      { name: 'Silph Scope', where: 'Rocket Hideout, Celadon City (after beating Giovanni)' },
      { name: 'Poké Flute', where: 'Mr. Fuji, Lavender Town (after clearing Pokémon Tower)' },
      { name: 'Master Ball', where: 'Silph Co., from the president' },
    ],
    gifts: YELLOW_STARTER_GIFTS.map(g => ({ ...g, where: g.where.replace(' (your Pikachu must be happy)', '') })),
  },
  'gold-silver': {
    versions: ['gold', 'silver'], regions: ['johto', 'kanto'],
    milestones: JOHTO_MILESTONES,
    items: [
      ...JOHTO_ITEMS,
      { name: 'Rainbow Wing (Gold) / Silver Wing (Silver)', where: 'Radio Tower Director, Goldenrod City (after Team Rocket leaves)' },
    ],
    gifts: JOHTO_GIFTS,
  },
  crystal: {
    versions: ['crystal'], regions: ['johto', 'kanto'],
    milestones: JOHTO_MILESTONES,
    items: [
      ...JOHTO_ITEMS,
      { name: 'Clear Bell', where: 'Radio Tower Director, Goldenrod City (after Team Rocket leaves)' },
      { name: 'Silver Wing', where: 'Old man, Pewter City (post-game)' },
    ],
    gifts: JOHTO_GIFTS,
  },
  'heartgold-soulsilver': {
    versions: ['heartgold', 'soulsilver'], regions: ['johto', 'kanto'],
    milestones: JOHTO_MILESTONES,
    items: [
      { name: 'Mystery Egg', where: "Mr. Pokémon's house, Route 30" },
      { name: 'HM06 Rock Smash', where: 'Man on Route 36, near the Sudowoodo' },
      { name: 'HM01 Cut', where: "Charcoal Kiln master, Ilex Forest (after you find his Farfetch'd)" },
      { name: 'Bicycle', where: 'Bike Shop, Goldenrod City' },
      { name: 'SquirtBottle', where: 'Flower Shop, Goldenrod City (after beating Whitney)' },
      { name: 'HM03 Surf', where: 'Gentleman at the Dance Theater, Ecruteak City (beat the Kimono Girls)' },
      { name: 'SecretPotion', where: 'Pharmacy, Cianwood City' },
      { name: 'HM02 Fly', where: "Chuck's wife, Cianwood City" },
      { name: 'HM05 Whirlpool', where: 'Lance, Team Rocket HQ, Mahogany Town' },
      { name: 'Clear Bell (HG) / Tidal Bell (SS)', where: 'Radio Tower Director, Goldenrod City (after Team Rocket leaves)' },
      { name: 'HM07 Waterfall', where: 'Ice Path' },
      { name: 'S.S. Ticket', where: 'Professor Elm, after becoming Champion' },
      { name: 'Machine Part', where: 'Hidden in the pool of the Cerulean Gym' },
      { name: 'Pass', where: 'Copycat, Saffron City (return her lost Clefairy doll)' },
    ],
    gifts: JOHTO_GIFTS,
  },
  'ruby-sapphire': {
    versions: ['ruby', 'sapphire'], regions: ['hoenn'],
    milestones: [HOENN_GYMS('Wallace'), hoennLeague('Steven')],
    items: HOENN_ITEMS, gifts: HOENN_GIFTS,
  },
  emerald: {
    versions: ['emerald'], regions: ['hoenn'],
    milestones: [HOENN_GYMS('Juan'), hoennLeague('Wallace')],
    items: HOENN_ITEMS, gifts: HOENN_GIFTS,
  },
  oras: {
    versions: ['omega-ruby', 'alpha-sapphire'], regions: ['hoenn'],
    milestones: [HOENN_GYMS('Wallace'), hoennLeague('Steven')],
    items: [
      { name: 'HM01 Cut', where: "Cutter's House, Rustboro City" },
      { name: 'HM06 Rock Smash', where: 'Rock Smash Guy, Mauville City' },
      { name: 'Mach Bike / Acro Bike', where: "Rydel's Cycles, Mauville City" },
      { name: 'HM03 Surf', where: "Wally's father, Petalburg City (after beating Norman)" },
      { name: 'HM02 Fly', where: 'Your rival on Route 119 (after beating them)' },
      { name: 'Devon Scope', where: 'Steven, Route 120' },
      { name: 'HM07 Dive', where: "Steven's house, Mossdeep City" },
    ],
    gifts: HOENN_GIFTS.slice(1),
  },
  'diamond-pearl': {
    versions: ['diamond', 'pearl'], regions: ['sinnoh'],
    milestones: [SINNOH_GYMS([0, 1, 2, 3, 4, 5, 6, 7]), SINNOH_LEAGUE],
    items: [
      ...SINNOH_ITEMS,
      { name: 'HM04 Strength', where: 'Top floor of the Lost Tower, Route 209' },
      { name: 'HM05 Defog', where: 'Great Marsh, Pastoria City' },
      { name: 'HM08 Rock Climb', where: 'Route 217' },
    ],
    gifts: SINNOH_GIFTS,
  },
  platinum: {
    versions: ['platinum'], regions: ['sinnoh'],
    milestones: [SINNOH_GYMS([0, 1, 4, 2, 3, 5, 6, 7]), SINNOH_LEAGUE],
    items: SINNOH_ITEMS,
    gifts: [{ id: 175, where: 'Cynthia, Eterna City (Egg)' }, ...SINNOH_GIFTS],
  },
  bdsp: {
    versions: ['brilliant-diamond', 'shining-pearl'], regions: ['sinnoh'],
    milestones: [SINNOH_GYMS([0, 1, 2, 3, 4, 5, 6, 7]), SINNOH_LEAGUE],
    items: SINNOH_ITEMS.map(i => ({ ...i, name: i.name.replace(/^HM\d+ /, 'Hidden Move: ') })),
    gifts: SINNOH_GIFTS,
  },
  'legends-arceus': {
    versions: ['legends-arceus'], regions: ['hisui'],
    milestones: [{
      title: 'Noble Pokémon', list: [
        { who: 'Kleavor', type: 'bug', where: 'Grandtree Arena, Obsidian Fieldlands' },
        { who: 'Lilligant', type: 'grass', where: 'Brava Arena, Crimson Mirelands' },
        { who: 'Arcanine', type: 'fire', where: 'Firespit Island, Cobalt Coastlands' },
        { who: 'Electrode', type: 'electric', where: 'Moonview Arena, Coronet Highlands' },
        { who: 'Avalugg', type: 'ice', where: 'Icepeak Arena, Alabaster Icelands' },
      ],
    }],
    // Ride Pokémon take the place of HMs.
    items: [
      { name: 'Ride Pokémon: Wyrdeer', where: 'Warden Mai, Obsidian Fieldlands (she also gives you the Celestica Flute)' },
      { name: 'Ride Pokémon: Basculegion', where: "Warden Iscan, Cobalt Coastlands (feed it Basculegion Food, made with a Dusclops's help)" },
      { name: 'Ride Pokémon: Sneasler', where: 'Warden Ingo, Ancient Quarry, Coronet Highlands (beat Ingo in battle)' },
      { name: 'Ride Pokémon: Braviary', where: 'Warden Sabi, Snowpoint Temple, Alabaster Icelands (beat Sabi, then Braviary on the roof)' },
    ],
    gifts: [
      { id: 722, where: 'Professor Laventon, at the start of the game (pick one starter)' },
      { id: 155, where: 'Professor Laventon, at the start of the game (pick one starter)' },
      { id: 501, where: 'Professor Laventon, at the start of the game (pick one starter)' },
    ],
  },
  'black-white': {
    versions: ['black', 'white'], regions: ['unova'],
    milestones: [{
      title: 'Gyms', list: [
        { who: 'Cilan / Chili / Cress', where: 'Striaton City', reward: 'Trio Badge' },
        { who: 'Lenora', type: 'normal', where: 'Nacrene City', reward: 'Basic Badge' },
        { who: 'Burgh', type: 'bug', where: 'Castelia City', reward: 'Insect Badge' },
        { who: 'Elesa', type: 'electric', where: 'Nimbasa City', reward: 'Bolt Badge' },
        { who: 'Clay', type: 'ground', where: 'Driftveil City', reward: 'Quake Badge' },
        { who: 'Skyla', type: 'flying', where: 'Mistralton City', reward: 'Jet Badge' },
        { who: 'Brycen', type: 'ice', where: 'Icirrus City', reward: 'Freeze Badge' },
        { who: 'Drayden (Black) / Iris (White)', type: 'dragon', where: 'Opelucid City', reward: 'Legend Badge' },
      ],
    }, UNOVA_LEAGUE('Alder')],
    items: [
      { name: 'HM01 Cut', where: 'Fennel, Striaton City' },
      { name: 'Dowsing MCHN', where: 'Bianca, Nacrene City' },
      { name: 'Bicycle', where: 'Bike shop owner, Nimbasa City' },
      { name: 'Prop Case', where: 'Musical owner, Nimbasa City' },
      { name: 'HM04 Strength', where: 'Nimbasa City' },
      { name: 'HM02 Fly', where: 'Bianca, Driftveil City' },
      { name: 'HM03 Surf', where: 'Alder, Twist Mountain' },
      { name: 'HM06 Dive', where: 'Undella Town' },
      { name: 'HM05 Waterfall', where: 'Route 18' },
    ],
    gifts: [
      { id: 511, where: 'Woman at the Dreamyard (if your starter was Tepig)' },
      { id: 513, where: 'Woman at the Dreamyard (if your starter was Oshawott)' },
      { id: 515, where: 'Woman at the Dreamyard (if your starter was Snivy)' },
      { id: 564, where: 'Relic Castle: pick the Cover Fossil, then have it revived at the Nacrene City museum' },
      { id: 566, where: 'Relic Castle: pick the Plume Fossil, then have it revived at the Nacrene City museum' },
      { id: 636, where: 'Man in a house on Route 18 (Egg)' },
      { id: 570, where: 'Castelia City (needs a Celebi transferred from an older game in your party)' },
    ],
  },
  'black2-white2': {
    versions: ['black-2', 'white-2'], regions: ['unova'],
    milestones: [{
      title: 'Gyms', list: [
        { who: 'Cheren', type: 'normal', where: 'Aspertia City', reward: 'Basic Badge' },
        { who: 'Roxie', type: 'poison', where: 'Virbank City', reward: 'Toxic Badge' },
        { who: 'Burgh', type: 'bug', where: 'Castelia City', reward: 'Insect Badge' },
        { who: 'Elesa', type: 'electric', where: 'Nimbasa City', reward: 'Bolt Badge' },
        { who: 'Clay', type: 'ground', where: 'Driftveil City', reward: 'Quake Badge' },
        { who: 'Skyla', type: 'flying', where: 'Mistralton City', reward: 'Jet Badge' },
        { who: 'Drayden', type: 'dragon', where: 'Opelucid City', reward: 'Legend Badge' },
        { who: 'Marlon', type: 'water', where: 'Humilau City', reward: 'Wave Badge' },
      ],
    }, UNOVA_LEAGUE('Iris')],
    items: [
      { name: 'HM01 Cut', where: 'Roxie, Virbank City' },
      { name: 'HM04 Strength', where: 'Hugh (your rival), Castelia Sewers' },
      { name: 'HM02 Fly', where: 'Bianca, Route 5' },
      { name: 'HM03 Surf', where: 'Cheren, Route 6' },
      { name: 'HM06 Dive', where: 'Hugh (your rival), Undella Town' },
      { name: 'HM05 Waterfall', where: 'N, Victory Road' },
    ],
    gifts: [
      { id: 564, where: 'Lenora, Nacrene City museum (pick the Cover Fossil)' },
      { id: 566, where: 'Lenora, Nacrene City museum (pick the Plume Fossil)' },
      { id: 440, where: 'Nacrene City gate (Egg)' },
      { id: 585, where: 'Scientist at the Weather Institute, Route 6' },
      { id: 570, where: 'Rood of the Seven Sages, Driftveil City (N\'s Zorua)' },
      { id: 133, where: "Fennel's assistant, Dream World research building, Castelia City (after the Elite Four; has its Hidden Ability)" },
      { id: 443, where: 'Benga, Floccesy Town (post-game, Shiny; Gible or Dratini depending on your version)' },
      { id: 147, where: 'Benga, Floccesy Town (post-game, Shiny; Gible or Dratini depending on your version)' },
    ],
  },
  'x-y': {
    versions: ['x', 'y'], regions: ['kalos'],
    milestones: [{
      title: 'Gyms', list: [
        { who: 'Viola', type: 'bug', where: 'Santalune City', reward: 'Bug Badge' },
        { who: 'Grant', type: 'rock', where: 'Cyllage City', reward: 'Cliff Badge' },
        { who: 'Korrina', type: 'fighting', where: 'Shalour City', reward: 'Rumble Badge' },
        { who: 'Ramos', type: 'grass', where: 'Coumarine City', reward: 'Plant Badge' },
        { who: 'Clemont', type: 'electric', where: 'Lumiose City', reward: 'Voltage Badge' },
        { who: 'Valerie', type: 'fairy', where: 'Laverre City', reward: 'Fairy Badge' },
        { who: 'Olympia', type: 'psychic', where: 'Anistar City', reward: 'Psychic Badge' },
        { who: 'Wulfric', type: 'ice', where: 'Snowbelle City', reward: 'Iceberg Badge' },
      ],
    }, {
      title: 'Elite Four', list: [
        { who: 'Malva', type: 'fire', where: 'Pokémon League' },
        { who: 'Siebold', type: 'water', where: 'Pokémon League' },
        { who: 'Wikstrom', type: 'steel', where: 'Pokémon League' },
        { who: 'Drasna', type: 'dragon', where: 'Pokémon League' },
        { who: 'Diantha', where: 'Pokémon League', reward: 'Champion' },
      ],
    }],
    items: [
      { name: 'Mega Ring', where: 'Korrina, Tower of Mastery (Shalour City)' },
    ],
    gifts: [
      { id: 1, where: "Professor Sycamore's lab, Lumiose City (pick one Kanto starter)" },
      { id: 4, where: "Professor Sycamore's lab, Lumiose City (pick one Kanto starter)" },
      { id: 7, where: "Professor Sycamore's lab, Lumiose City (pick one Kanto starter)" },
      { id: 448, where: 'Korrina, Tower of Mastery (Shalour City)' },
      { id: 131, where: 'Route 12 (Fourrage Road)' },
    ],
  },
  'sun-moon': {
    versions: ['sun', 'moon'], regions: ['alola'],
    milestones: [ALOLA_TRIALS, ALOLA_GRAND_TRIALS, alolaLeague('Hala', 'Professor Kukui')],
    items: ALOLA_ITEMS, gifts: ALOLA_GIFTS,
  },
  'ultra-sun-moon': {
    versions: ['ultra-sun', 'ultra-moon'], regions: ['alola'],
    milestones: [ALOLA_TRIALS, ALOLA_GRAND_TRIALS, alolaLeague('Molayne', 'Hau')],
    items: ALOLA_ITEMS, gifts: ALOLA_GIFTS,
  },
  'sword-shield': {
    versions: ['sword', 'shield'], regions: ['galar'],
    milestones: [{
      title: 'Gyms', list: [
        { who: 'Milo', type: 'grass', where: 'Turffield', reward: 'Grass Badge' },
        { who: 'Nessa', type: 'water', where: 'Hulbury', reward: 'Water Badge' },
        { who: 'Kabu', type: 'fire', where: 'Motostoke', reward: 'Fire Badge' },
        { who: 'Bea (Sword) / Allister (Shield)', where: 'Stow-on-Side', reward: 'Fighting / Ghost Badge' },
        { who: 'Opal', type: 'fairy', where: 'Ballonlea', reward: 'Fairy Badge' },
        { who: 'Gordie (Sword) / Melony (Shield)', where: 'Circhester', reward: 'Rock / Ice Badge' },
        { who: 'Piers', type: 'dark', where: 'Spikemuth', reward: 'Dark Badge' },
        { who: 'Raihan', type: 'dragon', where: 'Hammerlocke', reward: 'Dragon Badge' },
      ],
    }, { title: 'Champion Cup', list: [{ who: 'Leon', where: 'Wyndon Stadium', reward: 'Champion' }] }],
    items: [
      { name: 'Dynamax Band', where: 'Professor Magnolia, at her house near Wedgehurst' },
    ],
    gifts: [
      { id: 848, where: 'Pokémon Nursery worker, Route 5 (Egg)' },
    ],
  },
  'scarlet-violet': {
    versions: ['scarlet', 'violet'], regions: ['paldea'],
    milestones: [{
      title: 'Victory Road (Gyms)', list: [
        { who: 'Katy', type: 'bug', where: 'Cortondo' },
        { who: 'Brassius', type: 'grass', where: 'Artazon' },
        { who: 'Iono', type: 'electric', where: 'Levincia' },
        { who: 'Kofu', type: 'water', where: 'Cascarrafa' },
        { who: 'Larry', type: 'normal', where: 'Medali' },
        { who: 'Ryme', type: 'ghost', where: 'Montenevera' },
        { who: 'Tulip', type: 'psychic', where: 'Alfornada' },
        { who: 'Grusha', type: 'ice', where: 'Glaseado Mountain' },
      ],
    }, {
      title: 'Path of Legends (Titans)', list: [
        { who: 'Klawf', type: 'rock', where: 'South Province (Area Three)' },
        { who: 'Bombirdier', type: 'flying', where: 'West Province (Area One)' },
        { who: 'Orthworm', type: 'steel', where: 'East Province (Area Three)' },
        { who: 'Great Tusk / Iron Treads', type: 'ground', where: 'Asado Desert' },
        { who: 'Dondozo & Tatsugiri', type: 'water', where: 'Casseroya Lake' },
      ],
    }, {
      title: 'Starfall Street (Team Star bosses)', list: [
        { who: 'Giacomo', type: 'dark' },
        { who: 'Mela', type: 'fire' },
        { who: 'Atticus', type: 'poison' },
        { who: 'Ortega', type: 'fairy' },
        { who: 'Eri', type: 'fighting' },
      ],
    }, {
      title: 'Elite Four', list: [
        { who: 'Rika', type: 'ground', where: 'Pokémon League' },
        { who: 'Poppy', type: 'steel', where: 'Pokémon League' },
        { who: 'Larry', type: 'flying', where: 'Pokémon League' },
        { who: 'Hassel', type: 'dragon', where: 'Pokémon League' },
        { who: 'Geeta', where: 'Pokémon League', reward: 'Top Champion' },
      ],
    }],
    // Koraidon / Miraidon's ride abilities take the place of HMs.
    items: [
      { name: 'Ride ability: Dash', where: 'Stony Cliff Titan (Klawf), South Province (Area Three)' },
      { name: 'Ride ability: Swim', where: 'Open Sky Titan (Bombirdier), West Province (Area One)' },
      { name: 'Ride ability: High Jump', where: 'Lurking Steel Titan (Orthworm), East Province (Area Three)' },
      { name: 'Ride ability: Glide', where: 'Quaking Earth Titan (Great Tusk / Iron Treads), Asado Desert' },
      { name: 'Ride ability: Climb', where: 'False Dragon Titan (Dondozo & Tatsugiri), Casseroya Lake' },
    ],
    gifts: [
      { id: 1007, where: 'Poco Path, as part of the story (Scarlet)' },
      { id: 1008, where: 'Poco Path, as part of the story (Violet)' },
      { id: 52, where: 'Salvatore, at the academy (after finishing all classes; Galarian form)' },
      { id: 58, where: 'Perrin, Mossui Town (after photographing Bloodmoon Ursaluna; Hisuian form; The Teal Mask DLC)' },
      { id: 446, where: "Kitakami Hall (Shiny, for clearing the hardest level of Ogre Oustin'; The Teal Mask DLC)" },
    ],
  },
  'legends-za': {
    versions: ['legends-za'], regions: ['kalos'],
    milestones: [{
      title: 'Z-A Royale ranks', list: [
        { who: 'Yvon', where: 'Main Mission 6', reward: 'Rank X' },
        { who: 'Xavi', where: 'Main Mission 7', reward: 'Rank W' },
        { who: 'Rintaro', where: 'Main Mission 8', reward: 'Rank V' },
        { who: 'Canari', where: 'Main Mission 14', reward: 'Rank E' },
        { who: 'Ivor', where: 'Main Mission 19', reward: 'Rank D' },
        { who: 'Corbeau', where: 'Main Mission 24', reward: 'Rank C' },
        { who: 'Jacinthe', where: 'Main Mission 30', reward: 'Rank B' },
        { who: 'Grisham', where: 'Main Mission 35', reward: 'Rank A' },
      ],
    }, {
      title: 'Rogue Mega Evolutions', list: [
        { who: 'Mega Slowbro', type: 'water', where: 'Bleu District (Main Mission 11)' },
        { who: 'Mega Camerupt', type: 'fire', where: 'Jaune District (Main Mission 12)' },
        { who: 'Mega Victreebel', type: 'grass', where: 'Magenta District (Main Mission 13)' },
        { who: 'Mega Beedrill', type: 'bug', where: 'Vert District (Main Mission 16)' },
        { who: 'Mega Hawlucha', type: 'fighting', where: 'Magenta District (Main Mission 17)' },
        { who: 'Mega Banette', type: 'ghost', where: 'Jaune District (Main Mission 18)' },
        { who: 'Mega Mawile', type: 'steel', where: 'Magenta District (Main Mission 21)' },
        { who: 'Mega Barbaracle', type: 'rock', where: 'Bleu District (Main Mission 22)' },
        { who: 'Mega Ampharos', type: 'electric', where: 'Rouge District (Main Mission 23)' },
        { who: 'Mega Froslass', type: 'ice', where: 'Bleu District (Main Mission 27)' },
        { who: 'Mega Altaria', type: 'dragon', where: 'Magenta District (Main Mission 28)' },
        { who: 'Mega Venusaur', type: 'grass', where: 'Jaune District (Main Mission 29)' },
        { who: 'Mega Dragonite', type: 'dragon', where: 'Vert District (Main Mission 32)' },
        { who: 'Mega Tyranitar', type: 'rock', where: 'Jaune District (Main Mission 33)' },
        { who: 'Mega Starmie', type: 'water', where: 'Bleu District (Main Mission 34)' },
      ],
    }],
    items: [],
    gifts: [
      { id: 359, where: 'Lumiose City (joins you after the Rogue Mega Absol battle)' },
      { id: 650, where: 'Académie Étoile (Side Mission 7: beat the Chespin blocking the taxi three times)' },
      { id: 653, where: 'Magenta Sector 2 (Side Mission 8: bring a Revitalizing Twig from Wild Zone 5)' },
      { id: 656, where: 'Jaune Sector 8 (Side Mission 9: clear the three scaffolding courses in time)' },
      { id: 665, where: 'Lumiose Museum (Side Mission 21: find the 12 hidden Spewpa)' },
      { id: 1, where: 'Mable, Pokémon Research Lab (Side Mission 22; pick one Kanto starter)' },
      { id: 4, where: 'Mable, Pokémon Research Lab (Side Mission 22; pick one Kanto starter)' },
      { id: 7, where: 'Mable, Pokémon Research Lab (Side Mission 22; pick one Kanto starter)' },
      { id: 696, where: 'Pokémon Research Lab (Side Mission 27: revives a Jaw Fossil you bring)' },
      { id: 698, where: 'Pokémon Research Lab (Side Mission 27: revives a Sail Fossil you bring)' },
      { id: 618, where: 'Wild Zone 11 (Side Mission 72; Galarian form)' },
      { id: 999, where: 'Man in Rouge Sector 1 (comes with Gimmighoul Coins for evolving it)' },
      { id: 448, where: 'AZ, Hotel Z (after the story)' },
      { id: 670, where: 'Emma, Quasartico Inc. (after 15 Infinite Z-A Royale battles; comes with the Floettite)' },
      { id: 809, where: 'Little girl, Hyperspace Lumiose (after you catch Meltan)' },
      { id: 801, where: 'Hyperspace Lumiose (bring Jett 999 Mega Shards for the Magearnite)' },
    ],
  },
};

// PokeAPI version group of each game; its regional Pokédexes define which Pokémon are available.
const VERSION_GROUPS = {
  'red-blue': 'red-blue', yellow: 'yellow', 'gold-silver': 'gold-silver', crystal: 'crystal',
  'ruby-sapphire': 'ruby-sapphire', 'firered-leafgreen': 'firered-leafgreen', emerald: 'emerald',
  'diamond-pearl': 'diamond-pearl', platinum: 'platinum', 'heartgold-soulsilver': 'heartgold-soulsilver',
  'black-white': 'black-white', 'black2-white2': 'black-2-white-2', 'x-y': 'x-y',
  oras: 'omega-ruby-alpha-sapphire', 'sun-moon': 'sun-moon', 'ultra-sun-moon': 'ultra-sun-ultra-moon',
  'lets-go': 'lets-go-pikachu-lets-go-eevee', 'sword-shield': 'sword-shield',
  bdsp: 'brilliant-diamond-and-shining-pearl', 'legends-arceus': 'legends-arceus',
  'scarlet-violet': 'scarlet-violet', 'legends-za': 'legends-za',
};
