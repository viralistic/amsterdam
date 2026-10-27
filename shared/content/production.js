// Shared definitions for the "production" content pack: items and world object types.
// Firemaking, Cooking, Smithing, Crafting, Fletching, Herblore and Prayer. Owned by the production workstream.
// Data tables (levels, xp, materials) live in ./production/data.js. See docs/ENGINE.md.
import { METALS, METAL_IDS, SMITH_KINDS, smithId, GEAR_STATS, SLOT_OF, KIND_NAME, JEWELLERY, HERBS, POTIONS, doseId, GEM_COLOR } from './production/data.js';

const I = {};
const def = (id, d) => { I[id] = d; };

// ---------------------------------------------------------------- Bars and smithed equipment
for (const m of METAL_IDS) def(`${m}_bar`, { name: `${METALS[m].name} bar`, value: METALS[m].bar, metal: METALS[m].color, ex: `It's a bar of ${m === 'bronze' ? 'bronze' : METALS[m].name.toLowerCase()}.` });
def('silver_bar', { name: 'Silver bar', value: 75, metal: '#d8d8e4', ex: "It's a bar of silver." });
def('gold_bar', { name: 'Gold bar', value: 150, metal: '#e0b028', ex: "It's a bar of gold. Don't tell De Nederlandsche Bank." });

const BASE_IDS = new Set(['bronze_dagger', 'iron_sword', 'steel_longsword', 'mithril_scimitar', 'iron_helm']);
METAL_IDS.forEach((m, tier) => {
  const M = METALS[m];
  for (const k of SMITH_KINDS) {
    const id = smithId(m, k.kind);
    if (BASE_IDS.has(id)) continue;
    const name = `${M.name} ${KIND_NAME[k.kind]}`;
    if (k.kind === 'arrowtips') { def(id, { name, value: [1, 2, 5, 10, 20, 60][tier], stack: true, metal: M.color, ex: `${M.name} arrowtips. Attach them to headless arrows.` }); continue; }
    const st = GEAR_STATS[k.kind], slot = SLOT_OF[k.kind];
    const d = { name, value: Math.round(M.bar * k.bars * 1.6 + 10 * (tier + 1)), slot, metal: M.color, req: M.req };
    if (st.att) { d.att = st.att[tier]; d.str = st.str[tier]; if (st.speed && st.speed !== 4) d.speed = st.speed; }
    if (st.def) { d.def = st.def[tier]; d.skill = 'defence'; }
    if (slot === 'body' || slot === 'legs') d.color = M.color;
    if (k.kind === 'kiteshield') d.kite = true;
    d.ex = {
      dagger: 'Short but pointy.', sword: `A razor-sharp ${M.name.toLowerCase()} sword.`, scimitar: 'A vicious, curved sword.', longsword: `A long ${M.name.toLowerCase()} blade.`,
      full_helm: 'A full face helmet.', kiteshield: 'A large metal shield.', platelegs: 'These look pretty heavy.', platebody: 'Provides excellent protection. Mind the cobblestones.',
    }[k.kind];
    if (d.req <= 1) delete d.req;
    def(id, d);
  }
});
def('adamant_arrow', { name: 'Adamant arrow', value: 40, stack: true, slot: 'ammo', rstr: 31, req: 30, skill: 'ranged', metal: METALS.adamant.color, ex: 'Arrows with adamantite heads.' });
def('rune_arrow', { name: 'Rune arrow', value: 120, stack: true, slot: 'ammo', rstr: 49, req: 40, skill: 'ranged', metal: METALS.rune.color, ex: 'Arrows with runite heads.' });

// ---------------------------------------------------------------- Food
const food = (id, name, heal, value, ex) => def(id, { name, heal, value, ex });
food('shrimps', 'Shrimps', 3, 5, 'Some nicely cooked shrimps. Hollandse garnalen!');
food('anchovies', 'Anchovies', 1, 8, 'Some nicely cooked anchovies.');
food('trout', 'Trout', 7, 20, 'Some nicely cooked trout.');
food('salmon', 'Salmon', 9, 25, 'Some nicely cooked salmon.');
food('pike', 'Pike', 8, 25, 'Some nicely cooked pike. Snoek, they call it here.');
food('eel', 'Smoked eel', 8, 30, 'Gerookte paling, an old Amsterdam favourite.');
food('lobster', 'Lobster', 12, 150, 'This looks tricky to eat.');
food('swordfish', 'Swordfish', 14, 250, "I'd better be careful eating this!");
food('shark', 'Shark', 20, 800, "I'd better be careful eating this.");
food('cooked_meat', 'Cooked meat', 3, 4, 'Mmm, this looks tasty.');
food('cooked_chicken', 'Cooked chicken', 3, 4, 'Mmm, this looks tasty.');
food('roast_bird_meat', 'Roast bird meat', 6, 10, 'A delicious looking piece of roast bird.');
food('roast_rabbit', 'Roast rabbit', 5, 10, 'A delicious looking piece of roast rabbit.');
food('baked_potato', 'Baked potato', 4, 6, 'A baked potato. Needs mayonnaise, obviously.');
def('burnt_fish', { name: 'Burnt fish', value: 1, ex: 'Oops!' });
def('burnt_meat', { name: 'Burnt meat', value: 1, ex: 'Oh dear, it\'s totally burnt!' });
def('burnt_potato', { name: 'Burnt potato', value: 1, ex: 'It used to be a potato.' });

// ---------------------------------------------------------------- Animal products and bones
def('raw_beef', { name: 'Raw beef', value: 1, ex: 'I need to cook this first.' });
def('raw_chicken', { name: 'Raw chicken', value: 1, ex: 'I need to cook this first.' });
def('cowhide', { name: 'Cowhide', value: 1, ex: 'I should take this to the tanner.' });
def('wool', { name: 'Wool', value: 1, ex: "I think this came from a sheep. Texel's finest." });
def('bones', { name: 'Bones', value: 1, ops: ['Bury'], ex: 'Bones are for burying!' });
def('big_bones', { name: 'Big bones', value: 50, ops: ['Bury'], ex: 'Ew, it\'s a pile of big bones.' });
def('dragon_bones', { name: 'Dragon bones', value: 1500, ops: ['Bury'], ex: 'These would feed a hungry dog for months.' });
def('ashes', { name: 'Ashes', value: 2, ex: 'A heap of ashes.' });

// ---------------------------------------------------------------- Crafting
def('leather', { name: 'Leather', value: 3, ex: "It's a piece of leather." });
def('hard_leather', { name: 'Hard leather', value: 12, ex: "It's a piece of hard leather." });
def('leather_gloves', { name: 'Leather gloves', value: 6, att: 1, def: 1, ex: 'These will keep my hands warm on the bike. (There is no glove slot yet.)' });
def('leather_vambraces', { name: 'Leather vambraces', value: 18, rng: 4, def: 2, ex: 'Those are some nice vambraces. (There is no glove slot yet.)' });
def('leather_chaps', { name: 'Leather chaps', value: 20, slot: 'legs', def: 4, rng: 4, color: '#7a5030', ex: 'Better than no armour!' });
def('hardleather_body', { name: 'Hardleather body', value: 170, slot: 'body', def: 12, rng: 8, req: 10, skill: 'defence', color: '#5e3a20', ex: 'Harder than normal leather.' });
for (const [cut, color] of Object.entries(GEM_COLOR)) def(cut, { name: cut[0].toUpperCase() + cut.slice(1), value: { sapphire: 250, emerald: 500, ruby: 1000, diamond: 2000 }[cut], gem: color, ex: `This looks valuable.` });
for (const j of JEWELLERY) {
  const gem = j.gem ? j.gem[0].toUpperCase() + j.gem.slice(1) : 'Gold';
  def(j.item, { name: `${gem} ${j.mould === 'ring_mould' ? 'ring' : 'amulet'}`, value: j.value, gem: j.gem ? GEM_COLOR[j.gem] : null, ex: `A ${j.gem ? j.gem + ' ' : 'plain gold '}${j.mould === 'ring_mould' ? 'ring' : 'amulet'}. Very Pieter Cornelisz Hooftstraat.` });
}
def('soft_clay', { name: 'Soft clay', value: 2, ex: 'Clay that is soft enough to mould.' });
def('unfired_pot', { name: 'Unfired pot', value: 2, ex: 'I need to put this in a pottery oven.' });
def('pot', { name: 'Pot', value: 4, ex: 'This pot is empty.' });
def('unfired_bowl', { name: 'Unfired bowl', value: 3, ex: 'I need to put this in a pottery oven.' });
def('bowl', { name: 'Bowl', value: 5, ex: 'Useful for mixing things. Or for vla.' });
def('molten_glass', { name: 'Molten glass', value: 2, ex: 'Hot glass ready to be blown into shape.' });
def('bucket_of_sand', { name: 'Bucket of sand', value: 3, ex: 'A bucket of sand from the NEMO beach.' });
def('bucket_of_water', { name: 'Bucket of water', value: 6, ex: "It's a bucket of water." });
def('soda_ash', { name: 'Soda ash', value: 2, ex: 'One of the ingredients for making glass.' });
def('seaweed', { name: 'Seaweed', value: 2, ex: 'Slightly damp seaweed from the IJ. Burn it to make soda ash.' });
def('vial', { name: 'Vial', value: 2, ex: 'An empty glass vial.' });
def('vial_of_water', { name: 'Vial of water', value: 3, ex: 'A glass vial containing water. Canal water, hopefully filtered.' });
def('beer_glass', { name: 'Beer glass', value: 2, ex: 'A tall glass, perfect for a fluitje.' });
def('fishbowl', { name: 'Fishbowl', value: 10, ex: 'An empty fishbowl.' });
def('unpowered_orb', { name: 'Unpowered orb', value: 100, ex: 'An orb waiting for a magic charge.' });
def('ball_of_wool', { name: 'Ball of wool', value: 2, ex: 'Spun from sheeps\' wool.' });
def('bow_string', { name: 'Bow string', value: 6, ex: "I need a bow stave to attach this to." });
def('chisel', { name: 'Chisel', value: 1, ex: 'Good for detailed crafting.' });
def('needle', { name: 'Needle', value: 1, ex: 'Used with a thread to make clothes.' });
def('thread', { name: 'Thread', value: 1, stack: true, ex: 'Used with a needle to make clothes.' });
def('knife', { name: 'Knife', value: 6, ex: 'A dangerous looking knife.' });
def('pestle_and_mortar', { name: 'Pestle and mortar', value: 4, ex: 'I can grind things for potions in this.' });
def('ring_mould', { name: 'Ring mould', value: 5, ex: 'Used to make gold rings.' });
def('amulet_mould', { name: 'Amulet mould', value: 5, ex: 'Used to make gold amulets.' });
def('glassblowing_pipe', { name: 'Glassblowing pipe', value: 2, ex: 'Used to form molten glass into useful items.' });

// ---------------------------------------------------------------- Fletching
def('arrow_shaft', { name: 'Arrow shaft', value: 1, stack: true, ex: 'A wooden arrow shaft.' });
def('headless_arrow', { name: 'Headless arrow', value: 1, stack: true, ex: 'A wooden arrow shaft with flights attached.' });
def('shortbow_u', { name: 'Shortbow (u)', value: 23, wood: '#8a5a2c', ex: 'I need to find a string for this.' });
def('oak_shortbow_u', { name: 'Oak shortbow (u)', value: 50, wood: '#a9773c', ex: 'I need to find a string for this.' });
def('willow_longbow_u', { name: 'Willow longbow (u)', value: 80, wood: '#c39a5a', long: true, ex: 'I need to find a string for this.' });
def('maple_shortbow_u', { name: 'Maple shortbow (u)', value: 200, wood: '#7a3e1e', ex: 'I need to find a string for this.' });

// ---------------------------------------------------------------- Herblore
for (const h of HERBS) {
  def(h.clean, { name: h.clean === 'guam_leaf' ? 'Guam leaf' : h.clean === 'ranarr_weed' ? 'Ranarr weed' : h.name, value: 10 + HERBS.indexOf(h) * 15, herb: h.color, ex: 'A fine herb, freshly cleaned.' });
  def(h.unf, { name: `${h.name} potion (unf)`, value: 8 + HERBS.indexOf(h) * 12, liquid: h.color, ex: `I need another ingredient to finish this ${h.name.toLowerCase()} potion.` });
}
def('eye_of_newt', { name: 'Eye of newt', value: 3, ex: "It seems to be looking at me. Don't ask where the apotheker got it." });
def('limpwurt_root', { name: 'Limpwurt root', value: 8, ex: 'The root of a limpwurt plant.' });
def('white_berries', { name: 'White berries', value: 10, ex: 'Poisonous berries. Do not eat.' });
def('snape_grass', { name: 'Snape grass', value: 10, ex: 'Strange spiky grass.' });
def('juniper_berries', { name: 'Juniper berries', value: 4, ex: 'Jeneverbessen: the secret behind every old Amsterdam distillery.' });
def('crushed_juniper', { name: 'Crushed juniper', value: 6, ex: 'Finely ground juniper berries.' });
for (const pt of POTIONS) for (const n of [3, 2, 1]) {
  def(doseId(pt.id, n), { name: `${pt.name}(${n})`, value: Math.round(pt.value * n / 3), liquid: pt.color, doses: n, ops: ['Drink'], ex: { attack_potion: '%d doses of attack potion.', strength_potion: '%d doses of strength potion.', defence_potion: '%d doses of defence potion.', prayer_potion: '%d doses of prayer restore potion.', tulip_tonic: '%d doses of tulip tonic. Smells like the Keukenhof.', jenever_brew: '%d doses of jenever brew. Proost!' }[pt.id].replace('%d', n) });
}

export const ITEMS = I;

// ---------------------------------------------------------------- Object types
export const OBJECTS = {
  fire: { name: 'Fire', actions: ['Cook'], ex: 'Looks hot!', model: 'prod_fire', params: {}, pickHeight: 1 },
  cooking_range: { name: 'Cooking range', actions: ['Cook'], ex: 'A hot range for cooking food.', model: 'prod_range', params: {}, blocks: true },
  market_stove: { name: 'Market stove', actions: ['Cook'], ex: 'A market stall stove. It smells of kibbeling and stroopwafels.', model: 'prod_range', params: { stall: true }, blocks: true },
  snack_fryer: { name: 'Frituur', actions: ['Cook'], ex: 'A snack bar fryer. Everything tastes better frituur.', model: 'prod_fryer', params: {}, blocks: true },
  furnace: { name: 'Furnace', actions: ['Smelt', 'Craft'], ex: 'A red hot furnace.', model: 'prod_furnace', params: {}, blocks: true, size: [2, 2] },
  anvil: { name: 'Anvil', actions: ['Smith'], ex: 'An anvil for hammering metal.', model: 'prod_anvil', params: {}, blocks: true, pickHeight: 1 },
  spinning_wheel: { name: 'Spinning wheel', actions: ['Spin'], ex: 'Spins wool and flax.', model: 'prod_spinning_wheel', params: {}, blocks: true },
  pottery_wheel: { name: "Potter's wheel", actions: ['Form'], ex: "It's a potter's wheel.", model: 'prod_pottery_wheel', params: {}, blocks: true, pickHeight: 1.1 },
  pottery_oven: { name: 'Pottery oven', actions: ['Fire'], ex: 'A kiln for firing pottery.', model: 'prod_kiln', params: {}, blocks: true },
  sandpit: { name: 'Sandpit', actions: ['Fill bucket'], ex: 'Sand from the NEMO rooftop beach.', model: 'prod_sandpit', params: {}, pickHeight: 0.6, size: [2, 2] },
  water_fountain: { name: 'Fountain', actions: ['Fill'], ex: 'Clean water from the botanical garden. Fill vials and buckets here.', model: 'prod_fountain', params: {}, blocks: true, size: [2, 2] },
  sink: { name: 'Sink', actions: ['Fill'], ex: 'A workshop sink.', model: 'prod_sink', params: {}, blocks: true },
  tanning_rack: { name: 'Tanning rack', actions: [], ex: 'Hides stretched out to dry.', model: 'prod_tanning_rack', params: {}, blocks: true },
  altar: { name: 'Altar', actions: ['Pray-at'], ex: 'A holy altar.', model: 'prod_altar', params: {}, blocks: true, size: [2, 1] },
  royal_altar: { name: 'Royal altar', actions: ['Pray-at'], ex: 'The altar of the Nieuwe Kerk, where kings and queens are crowned. Bones offered here please the gods.', model: 'prod_altar', params: { royal: true }, blocks: true, size: [2, 1] },
  church_pew: { name: 'Pew', actions: [], ex: 'A hard wooden church bench. Very Calvinist.', model: 'prod_pew', params: {}, blocks: true, pickHeight: 0.9 },
  wondermachine: { name: 'Wondermachine', actions: ['Operate'], ex: 'An experimental NEMO machine. A sign says: "Insert 10 coins. Results not guaranteed."', model: 'prod_wondermachine', params: {}, blocks: true, size: [2, 2] },
  electro_spinner: { name: 'Electro-spinner', actions: ['Spin'], ex: 'A spinning wheel driven by a pedal generator. Faster, louder, more Dutch.', model: 'prod_spinning_wheel', params: { electro: true }, blocks: true },
  plasma_kiln: { name: 'Plasma kiln', actions: ['Fire'], ex: 'A pottery oven heated by a glowing plasma ball. Do not touch.', model: 'prod_kiln', params: { plasma: true }, blocks: true },
  workbench: { name: 'Workbench', actions: [], ex: 'Covered in soldering irons, LEDs and half-finished robots.', model: 'prod_workbench', params: {}, blocks: true, size: [2, 1] },
};
