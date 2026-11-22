// The AURORA CLASH card catalogue: 24 original cards, six per element.
// Every card is a creature of the dawn sky with a big readable Power, a Sun
// cost, and its OWN unique skill — no two cards share one. A hand can still
// be read at a glance: beat the rival's element for +3, then let the gold
// skill text swing the clash — singes and Sun on reveal, Power that scales
// with the table, soaks and thorns on a loss, bonus damage and thefts on a
// win. Skills resolve in state.js, in that order: reveal, Power, outcome.

export const SKILLS = {
  'spark-bite': { name: 'Spark Bite', text: 'On reveal, singe the rival for 1 damage.' },
  'encore': { name: 'Encore', text: '+3 Power if you lost the previous clash.' },
  'rebirth': { name: 'Rebirth', text: 'If this loses the clash, heal 3.' },
  'bulwark': { name: 'Bulwark', text: 'On a loss, soak 5 damage.' },
  'sunlance': { name: 'Sunlance', text: 'Damage ignores soaks, and +1 damage on a win.' },
  'eruption': { name: 'Eruption', text: '+2 damage when you win the clash.' },
  'splash': { name: 'Splash', text: 'On reveal, gain +1 Sun.' },
  'momentum': { name: 'Momentum', text: '+1 Power per Sun banked (max +3).' },
  'healing-rain': { name: 'Healing Rain', text: 'On reveal, heal 3.' },
  'reef-wall': { name: 'Reef Wall', text: 'On a loss, soak 4 damage and heal 1.' },
  'undertow': { name: 'Undertow', text: '+3 Power while your life is lower.' },
  'feast-deep': { name: 'Feast of the Deep', text: 'On a win, heal 1 per 3 damage dealt.' },
  'good-boy': { name: 'Good Boy', text: 'On a win, gain +1 Sun.' },
  'longshot': { name: 'Longshot', text: "+2 Power if the rival's card costs more Sun." },
  'photosynthesis': { name: 'Photosynthesis', text: 'On reveal, heal 1 and gain +1 Sun.' },
  'thorns': { name: 'Thorns', text: 'On a loss, the winner takes 2 damage.' },
  'constrict': { name: 'Constrict', text: 'On a win, the rival loses 1 Sun.' },
  'root-memory': { name: 'Root Memory', text: 'Your previous card was Grove: +2 Power.' },
  'static-snap': { name: 'Static Snap', text: 'On a tie, the rival takes +1 extra damage.' },
  'volatile': { name: 'Volatile', text: '+1 Power per 2 cards in your discard (max +3).' },
  'divebomb': { name: 'Divebomb', text: '+3 Power while your life is higher.' },
  'aegis-charge': { name: 'Aegis Charge', text: 'On a loss, soak 3 damage and gain +1 Sun.' },
  'chain': { name: 'Chain Lightning', text: 'On a win, +1 damage per clash you already won (max +3).' },
  'thunderstomp': { name: 'Thunderstomp', text: 'On a win, +3 damage if the rival is at 8 life or less.' },
};

const c = (id, name, element, power, cost, skill, flavor) => ({ id, name, element, power, cost, skill, flavor });

export const CATALOGUE = [
  // EMBER — red flame, scorches Grove.
  c('cinder-imp', 'Cinder Imp', 'ember', 3, 0, 'spark-bite', 'Small spark, big attitude.'),
  c('flame-dancer', 'Flame Dancer', 'ember', 5, 1, 'encore', 'She pirouettes through wildfires.'),
  c('phoenix-chick', 'Phoenix Chick', 'ember', 4, 1, 'rebirth', 'Reborn before breakfast.'),
  c('ember-warden', 'Ember Warden', 'ember', 5, 2, 'bulwark', 'His shield has never cooled.'),
  c('solar-flare', 'Solar Flare', 'ember', 6, 2, 'sunlance', 'A tantrum thrown by the sun.'),
  c('magma-brute', 'Magma Brute', 'ember', 8, 3, 'eruption', 'The mountain, awake and annoyed.'),
  // TIDE — blue wave, grounds Bolt.
  c('puddle-sprite', 'Puddle Sprite', 'tide', 3, 0, 'splash', 'Lives in a teacup. Fights like the sea.'),
  c('wave-rider', 'Wave Rider', 'tide', 5, 1, 'momentum', 'Every wave is a road to her.'),
  c('mist-healer', 'Mist Healer', 'tide', 3, 1, 'healing-rain', 'Her rain knits wounds shut.'),
  c('coral-guard', 'Coral Guard', 'tide', 5, 2, 'reef-wall', 'A reef that refuses to move.'),
  c('riptide', 'Riptide', 'tide', 6, 2, 'undertow', 'It pulls hardest when you struggle.'),
  c('deep-leviathan', 'Deep Leviathan', 'tide', 9, 3, 'feast-deep', 'The ocean, holding its breath.'),
  // GROVE — green leaf, drinks Tide.
  c('sprout-pup', 'Sprout Pup', 'grove', 3, 0, 'good-boy', 'Fetches sticks. Grows forests.'),
  c('thorn-archer', 'Thorn Archer', 'grove', 5, 1, 'longshot', 'Her arrows were roses, once.'),
  c('bloom-dryad', 'Bloom Dryad', 'grove', 4, 1, 'photosynthesis', 'Spring follows where she walks.'),
  c('bramble-wall', 'Bramble Wall', 'grove', 4, 2, 'thorns', 'A hedge with strong opinions.'),
  c('vine-lash', 'Vine Lash', 'grove', 6, 2, 'constrict', 'It finds the gap in any armour.'),
  c('elder-treant', 'Elder Treant', 'grove', 8, 3, 'root-memory', 'He remembers the first sunrise.'),
  // BOLT — gold lightning, ignites Ember.
  c('spark-mouse', 'Spark Mouse', 'bolt', 3, 0, 'static-snap', 'Static cling, weaponised.'),
  c('static-imp', 'Static Imp', 'bolt', 4, 1, 'volatile', 'Angrier the longer the duel runs.'),
  c('storm-falcon', 'Storm Falcon', 'bolt', 6, 1, 'divebomb', 'Thunder is just her wingbeat.'),
  c('volt-aegis', 'Volt Aegis', 'bolt', 5, 2, 'aegis-charge', 'A shield that bites back sparks.'),
  c('chain-lightning', 'Chain Lightning', 'bolt', 7, 2, 'chain', 'It remembers every sky it crossed.'),
  c('thunder-giant', 'Thunder Giant', 'bolt', 9, 3, 'thunderstomp', 'His footsteps are the forecast.'),
];

const BY_ID = new Map(CATALOGUE.map((card) => [card.id, card]));

// One duelist's deck: the full catalogue, one copy of each card.
export function buildDeck() {
  return CATALOGUE.map((card) => ({ ...card, uid: card.id }));
}

export function cardById(id) {
  return BY_ID.get(id);
}
