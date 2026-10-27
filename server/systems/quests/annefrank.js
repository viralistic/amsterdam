// Anne Frank Huis, Prinsengracht 263. Deliberately NOT a quest: no combat, loot, puzzles or rewards.
// A museum guide outside gives a short, factual and respectful introduction and points people to the real museum.
export default function annefrank(api, lib) {
  lib.npc({
    name: 'Museumgids', dlg: 'annefrank_gids', at: api.tile(52.37515, 4.88418), look: lib.L(1, 0, 3, 5, 5, { topC: '#2a3a4a' }),
    ex: 'A guide standing outside the Anne Frank House at Prinsengracht 263.',
  }, {
    start: [
      { npc: 'Welcome. This is Prinsengracht 263, the Anne Frank House. Would you like to hear a little about the people who hid here?' },
      { opts: [['Yes, please.', 'anne'], ['Who were the others in hiding?', 'others'], ['How can I visit the museum?', 'visit'], ['Not right now, thank you.', 'end']] },
    ],
    anne: [
      { npc: 'Anne Frank was a Jewish girl, born in Frankfurt am Main in 1929. Her family moved to Amsterdam in 1933 and 1934, after the Nazis came to power in Germany.' },
      { npc: 'During the German occupation of the Netherlands, Jews were persecuted more and more. In July 1942, when her sister Margot was called up for a so-called labour camp, the family went into hiding.' },
      { npc: 'They hid in the Secret Annex, the Achterhuis: rooms at the back of this building, where her father Otto had his business. A movable bookcase hid the entrance.' },
      { npc: 'For more than two years Anne kept a diary. She wrote about daily life in hiding, her fears and hopes, and who she wanted to become.' },
      { npc: 'On 4 August 1944 the people in hiding were discovered and arrested, and deported to concentration camps. Anne and Margot died in Bergen-Belsen in early 1945. Anne was fifteen years old.' },
      { npc: 'Otto Frank was the only one of the eight to survive. Miep Gies had saved Anne\'s diary, and in 1947 Otto had it published as "Het Achterhuis". It has since been translated into more than seventy languages.' },
      { goto: 'more' },
    ],
    others: [
      { npc: 'Eight people hid in the Annex: Otto and Edith Frank and their daughters Margot and Anne; Hermann and Auguste van Pels and their son Peter; and Fritz Pfeffer.' },
      { npc: 'They could stay hidden for more than two years thanks to helpers who risked their own lives: Miep Gies, Jan Gies, Johannes Kleiman, Victor Kugler, Bep Voskuijl and her father Johan Voskuijl. They brought food, news and books.' },
      { npc: 'Of the eight people in hiding, only Otto Frank survived the war.' },
      { goto: 'more' },
    ],
    visit: [
      { npc: 'The Anne Frank House is a museum, and you can walk through the Secret Annex yourself. It is a quiet and moving visit.' },
      { npc: 'Tickets are sold online only, for a set time slot, and they often sell out weeks ahead. Book in advance on the official website of the Anne Frank House.' },
      { npc: 'If you are in Amsterdam, I really encourage you to go. Seeing the rooms in person is something no game can replace.' },
      { goto: 'more' },
    ],
    more: [{ opts: [['Tell me about Anne.', 'anne'], ['Who were the others in hiding?', 'others'], ['How can I visit the museum?', 'visit'], ['Thank you.', 'bye']] }],
    bye: [{ npc: 'Thank you for listening.' }],
  });
}
