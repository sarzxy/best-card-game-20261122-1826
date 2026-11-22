// The AURORA CLASH card catalogue: 24 original cards, six per element.
// Every card is a creature of the dawn sky with a big readable Power, a Sun cost,
// and at most one ability, so a hand can be read at a glance and combined in
// several ways: beat the rival's element for +3, chain the same element you won
// with last round for Echo, or hide behind Guard while you bank energy.
//
// Ability keys (resolved in state.js):
//   guard — soak 4 damage when you lose the clash
//   drain — heal 2 when you win the clash and deal damage
//   mend  — heal 3 the moment this card is revealed
//   surge — +2 Power while your life is lower than the rival's
//   echo  — +2 Power if this element won your last clash
//   pierce— your damage ignores Guard

export const ABILITY_TEXT = {
  guard: 'Guard · soaks 4 damage',
  drain: 'Drain · heal 2 on a hit',
  mend: 'Mend · heal 3 on reveal',
  surge: 'Surge · +2 Power while behind',
  echo: 'Echo · +2 if this light won last round',
  pierce: 'Pierce · damage ignores Guard',
};

const c = (id, name, element, power, cost, ability, flavor) => ({ id, name, element, power, cost, ability, flavor });

export const CATALOGUE = [
  // EMBER — red flame, scorches Grove.
  c('cinder-imp', 'Cinder Imp', 'ember', 3, 0, null, 'Small spark, big attitude.'),
  c('flame-dancer', 'Flame Dancer', 'ember', 5, 1, null, 'She pirouettes through wildfires.'),
  c('phoenix-chick', 'Phoenix Chick', 'ember', 4, 1, 'drain', 'Reborn before breakfast.'),
  c('ember-warden', 'Ember Warden', 'ember', 5, 2, 'guard', 'His shield has never cooled.'),
  c('solar-flare', 'Solar Flare', 'ember', 6, 2, 'pierce', 'A tantrum thrown by the sun.'),
  c('magma-brute', 'Magma Brute', 'ember', 8, 3, null, 'The mountain, awake and annoyed.'),
  // TIDE — blue wave, grounds Bolt.
  c('puddle-sprite', 'Puddle Sprite', 'tide', 3, 0, null, 'Lives in a teacup. Fights like the sea.'),
  c('wave-rider', 'Wave Rider', 'tide', 5, 1, null, 'Every wave is a road to her.'),
  c('mist-healer', 'Mist Healer', 'tide', 3, 1, 'mend', 'Her rain knits wounds shut.'),
  c('coral-guard', 'Coral Guard', 'tide', 5, 2, 'guard', 'A reef that refuses to move.'),
  c('riptide', 'Riptide', 'tide', 6, 2, 'surge', 'It pulls hardest when you struggle.'),
  c('deep-leviathan', 'Deep Leviathan', 'tide', 9, 3, null, 'The ocean, holding its breath.'),
  // GROVE — green leaf, drinks Tide.
  c('sprout-pup', 'Sprout Pup', 'grove', 3, 0, null, 'Fetches sticks. Grows forests.'),
  c('thorn-archer', 'Thorn Archer', 'grove', 5, 1, null, 'Her arrows were roses, once.'),
  c('bloom-dryad', 'Bloom Dryad', 'grove', 4, 1, 'mend', 'Spring follows where she walks.'),
  c('bramble-wall', 'Bramble Wall', 'grove', 4, 2, 'guard', 'A hedge with strong opinions.'),
  c('vine-lash', 'Vine Lash', 'grove', 6, 2, 'pierce', 'It finds the gap in any armour.'),
  c('elder-treant', 'Elder Treant', 'grove', 8, 3, null, 'He remembers the first sunrise.'),
  // BOLT — gold lightning, ignites Ember.
  c('spark-mouse', 'Spark Mouse', 'bolt', 3, 0, null, 'Static cling, weaponised.'),
  c('static-imp', 'Static Imp', 'bolt', 4, 1, 'surge', 'Angrier the closer it is to losing.'),
  c('storm-falcon', 'Storm Falcon', 'bolt', 6, 1, null, 'Thunder is just her wingbeat.'),
  c('volt-aegis', 'Volt Aegis', 'bolt', 5, 2, 'guard', 'A shield that bites back sparks.'),
  c('chain-lightning', 'Chain Lightning', 'bolt', 7, 2, 'echo', 'It remembers every sky it crossed.'),
  c('thunder-giant', 'Thunder Giant', 'bolt', 9, 3, null, 'His footsteps are the forecast.'),
];

const BY_ID = new Map(CATALOGUE.map((card) => [card.id, card]));

// One duelist's deck: the full catalogue, one copy of each card.
export function buildDeck() {
  return CATALOGUE.map((card) => ({ ...card, uid: card.id }));
}

export function cardById(id) {
  return BY_ID.get(id);
}
