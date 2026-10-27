// Shopkeepers and helpers for the gathering skills.
const L = (g, skin, hair, top, legs) => ({ g, skin, hair, top, legs });

export const SHOPS = {
  gath_bouwmarkt: { name: "Bouwmarkt Bert's Gereedschap", stock: [
    'bronze_axe', 'iron_axe', 'steel_axe', 'mithril_axe', 'adamant_axe', 'rune_axe',
    'bronze_pickaxe', 'iron_pickaxe', 'steel_pickaxe', 'mithril_pickaxe', 'adamant_pickaxe', 'rune_pickaxe',
    'small_net', 'fishing_rod', 'fly_fishing_rod', 'harpoon', 'lobster_pot', 'fishing_bait', 'feather',
    'rake', 'seed_dibber', 'spade', 'compost', 'potato_seed', 'onion_seed', 'cabbage_seed', 'bird_snare', 'box_trap',
  ] },
  gath_visboer: { name: "Vincent's Hengelsport", stock: ['small_net', 'fishing_rod', 'fly_fishing_rod', 'harpoon', 'lobster_pot', 'fishing_bait', 'feather'] },
  gath_hortus: { name: 'Hortus Zaden & Kruiden', stock: ['rake', 'seed_dibber', 'spade', 'compost', 'potato_seed', 'onion_seed', 'cabbage_seed', 'guam_seed', 'marrentill_seed', 'tarromin_seed'] },
  gath_boswachter: { name: "Boswachter Bas' Jachtkist", stock: ['bird_snare', 'box_trap', 'bronze_axe', 'iron_axe', 'steel_axe'] },
};

export const DIALOGS = {
  gath_bert: {
    start: [
      { npc: "Goeiemorgen! Bouwmarkt Bert, best hardware in the Westergasfabriek. If it chops, digs or catches, I've got it." },
      { opts: [["Let's see your tools.", 'shop'], ['Where can I use them?', 'where'], ['Any tips for a beginner?', 'tips'], ['Bye.', 'end']] },
    ],
    shop: [{ act: 'shop' }],
    where: [
      { player: 'Where can I use them?' },
      { npc: "Street trees all over the Jordaan and De Pijp, oaks in the Vondelpark, willows on the Amstel, and the elms along the grachten. Gemeente says those are 'monumental'. I say they burn lovely." },
      { npc: "Maples in the Westerpark, yews in the Hortus if Hanna lets you, and rocks right here behind the Gashouder. Copper, tin, iron, coal and even a bit of silver." },
      { npc: "The good stuff - gold, mithril, adamant, runite - is out in the Wilderness in Zuidoost. Bring friends, leave your valuables." },
      { goto: 'more' },
    ],
    tips: [
      { player: 'Any tips for a beginner?' },
      { npc: "Buy a bronze axe and a bronze pickaxe. Chop, mine, bank, repeat. Better tools work faster, but you need the level to swing them." },
      { npc: "And when the Gemeente holds a Boomplantdag, drop everything and grab your axe. Chopping together is faster, and they pay you for it!" },
      { goto: 'more' },
    ],
    more: [{ opts: [["Let's see your tools.", 'shop'], ['Bye.', 'end']] }],
  },
  gath_vincent: {
    start: [
      { npc: "Hengels! Netten! Aas! Vincent's Hengelsport, since 1974. Everything to catch a fish, except patience." },
      { opts: [["Show me your tackle.", 'shop'], ['Where are the fish?', 'where'], ['Do people really fish in the canals?', 'canal'], ['Bye.', 'end']] },
    ],
    shop: [{ act: 'shop' }],
    where: [
      { player: 'Where are the fish?' },
      { npc: "Shrimps and anchovies with a net in the grachten, pike with a rod and bait. Eels and pike in the Vondelpark ponds." },
      { npc: "Fly fishing for trout and salmon on the Amstel - feathers on the hook, you know how it goes. Lobsters and swordfish off the IJ by the Scheepvaartmuseum and the NDSM piers." },
      { npc: "And sharks... in the Gaasperplas. Don't ask me how. Don't go there without armour." },
      { goto: 'more' },
    ],
    canal: [
      { player: 'Do people really fish in the canals?' },
      { npc: "Of course! Mostly you catch bicycles. About twelve thousand a year come out of the water. But the pike are real, I promise." },
      { goto: 'more' },
    ],
    more: [{ opts: [["Show me your tackle.", 'shop'], ['Bye.', 'end']] }],
  },
  gath_hanna: {
    start: [
      { npc: "Welkom in de Hortus Botanicus, one of the oldest botanical gardens in the world. Please don't touch the coffee plant. It's famous." },
      { opts: [["I'd like to buy seeds.", 'shop'], ['How does farming work?', 'how'], ['Can I chop the yews?', 'yew'], ['Bye.', 'end']] },
    ],
    shop: [{ act: 'shop' }],
    how: [
      { player: 'How does farming work?' },
      { npc: "Rake the weeds off a patch, then use your seeds on it with a seed dibber in your bag. Three seeds for an allotment, one for a herb patch." },
      { npc: "Compost helps you harvest more. Then wait - each crop grows in a few stages. Use a spade to harvest allotments; herbs you just pick." },
      { npc: "There are volkstuinen in the Westerpark and the Amstelpark, and my herb patches here. Every patch is yours alone. Very Dutch: everyone has their own little garden." },
      { goto: 'more' },
    ],
    yew: [
      { player: 'Can I chop the yews?' },
      { npc: "*sigh* The Gemeente gave woodcutters a permit, so yes. They grow back. Just mind the greenhouse, and take your muddy boots off the Victoria amazonica." },
      { goto: 'more' },
    ],
    more: [{ opts: [["I'd like to buy seeds.", 'shop'], ['Bye.', 'end']] }],
  },
  gath_bas: {
    start: [
      { npc: "Hoi! Boswachter Bas. I look after the Amsterdamse Bos: a thousand hectares of forest, planted by hand in the 1930s." },
      { opts: [['Can I hunt here?', 'hunt'], ['I heard about magic trees...', 'magic'], ['Show me your gear.', 'shop'], ['Bye.', 'end']] },
    ],
    shop: [{ act: 'shop' }],
    hunt: [
      { player: 'Can I hunt here?' },
      { npc: "With a box trap you can catch rabbits here in the Bos - you'll need some Hunter experience first. Lay it from your bag and step back." },
      { npc: "Beginners can snare the parakeets in the Vondelpark. Green, noisy, everywhere. The Amstelpark has woodpeckers and even kingfishers." },
      { npc: "Check your traps in time, they collapse if you leave them too long." },
      { goto: 'more' },
    ],
    magic: [
      { player: 'I heard about magic trees...' },
      { if: (p, npc, api) => api.questDone(p, 'betoverde_bos'), then: 'magicdone', else: 'magicno' },
    ],
    magicno: [
      { npc: "Deep in the south of the Bos stands the Betoverde Bos. The trees there are old. Older than the forest itself. They won't let just anyone near them." },
      { npc: "Something is wrong in there. Help put it right, and maybe they'll let your axe through. Until then, every swing just bounces off." },
      { goto: 'more' },
    ],
    magicdone: [
      { npc: "You did it! The Betoverde Bos trusts you now. Bring a sharp axe and plenty of patience - magic logs don't come easy." },
      { goto: 'more' },
    ],
    more: [{ opts: [['Show me your gear.', 'shop'], ['Bye.', 'end']] }],
  },
};

export const NPCS = [
  { key: 'bert', name: 'Bouwmarkt Bert', look: { ...L(0, 0, 3, 7, 10), topC: '#e8641a' }, eq: { head: 'flat_cap', feet: 'leather_boots' }, talk: 'gath_bert', shop: 'gath_bouwmarkt', wander: 2,
    chatter: ['Zagen, hamers, bijlen!', 'Everything for the klusser!'], ex: 'Smells of sawdust and coffee.' },
  { key: 'vincent', name: 'Visboer Vincent', look: { ...L(0, 1, 6, 6, 1), topC: '#2a5a7a' }, eq: { head: 'beanie', feet: 'leather_boots' }, talk: 'gath_vincent', shop: 'gath_visboer', wander: 1,
    chatter: ['Verse aas! Fresh bait!', 'Hengels, netten, kooien!'], ex: 'A fishing tackle seller. His wellies have seen things.' },
  { key: 'hanna', name: 'Hortulanus Hanna', look: { ...L(1, 0, 2, 2, 5), topC: '#4a7a3a' }, eq: { feet: 'leather_boots' }, talk: 'gath_hanna', shop: 'gath_hortus', wander: 2,
    chatter: ['Niet aan de planten zitten!', 'Has anyone seen my secateurs?'], ex: 'The head gardener of the Hortus. Knows every plant by its Latin name.' },
  { key: 'bas', name: 'Boswachter Bas', look: { ...L(0, 2, 1, 2, 10), topC: '#3a5a2a' }, eq: { head: 'flat_cap', feet: 'leather_boots' }, talk: 'gath_bas', shop: 'gath_boswachter', wander: 3,
    chatter: ['Laat geen afval achter!', 'Shh, you\'ll scare the rabbits.'], ex: 'A forest ranger of the Amsterdamse Bos.' },
];
