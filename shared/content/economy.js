// Shared definitions for the "economy" content pack: items and world object types.
// Owned by the economy workstream. See docs/ENGINE.md.

const cape = (tier, name, bonus, ex) => ({
  name, value: [0, 2000, 8000, 30000][tier], slot: 'cape', color: '#c8102e', tradeable: false, wapen: tier, ...bonus, ex,
  ...(tier === 3 ? { ops: ['Teleport'] } : {}),
});

export const ITEMS = {
  ov_chipkaart: { name: 'OV-chipkaart', value: 8, ops: ['Check-balance'], tradeable: false, ex: 'Check in, check out. Forget to check out and it costs you dearly.' },
  ov_fiets: { name: 'OV-fiets', value: 0, ops: ['Ride'], tradeable: false, ex: 'A rented blue-and-yellow bike. Return it to an OV-fiets rack when you are done.' },
  canal_map: { name: 'Canal map', value: 15, ops: ['Read'], ex: 'A folding map of Amsterdam. Impossible to fold back up.' },
  stroopwafel_tin: { name: 'Stroopwafel tin', value: 250, ops: ['Open'], ex: 'A Delft-blue tin. Somehow there is always one stroopwafel left in it.' },
  parkeerboete: { name: 'Parkeerboete', value: 0, ops: ['Pay'], tradeable: false, ex: 'A fine from the Gemeente for parking your bike in the wrong place. 50 coins.' },
  amsterdams_wapen_1: cape(1, 'Amsterdams Wapen cape (easy)', { def: 2, att: 1, str: 1 }, 'Red, black and three white crosses. Proof you know your way around.'),
  amsterdams_wapen_2: cape(2, 'Amsterdams Wapen cape (medium)', { def: 4, att: 3, str: 3, rng: 2, mag: 2, pray: 1 }, 'Heldhaftig, Vastberaden, Barmhartig. The medium Amsterdam Diary cape.'),
  amsterdams_wapen_3: cape(3, 'Amsterdams Wapen cape (hard)', { def: 7, att: 5, str: 5, rng: 4, mag: 4, pray: 2 }, 'The full coat of arms, with the imperial crown. A true Amsterdammer.'),
};

export const OBJECTS = {
  ge_kiosk: { name: 'Grand Exchange', actions: ['Exchange', 'Price-guide'], ex: 'Buy and sell anything, even while you sleep. 1% tax goes to the Gemeente.', model: 'ge_kiosk', size: [3, 3], blocks: true, pickHeight: 3.2 },
  ge_booth: { name: 'Grand Exchange booth', actions: ['Exchange', 'Collect', 'Price-guide'], ex: 'Place offers to buy and sell items here.', model: 'ge_booth', blocks: true },
  ns_machine: { name: 'NS ticket machine', actions: ['Top-up', 'Buy-card', 'Check-balance'], ex: 'A yellow-and-blue NS machine. It does not take cash. Except here, it does.', model: 'ns_machine', blocks: true },
  gvb_machine: { name: 'GVB ticket machine', actions: ['Top-up', 'Buy-card', 'Check-balance'], ex: 'Top up your OV-chipkaart for the metro.', model: 'gvb_machine', blocks: true },
  ns_gate: { name: 'Check-in gate', actions: ['Travel', 'Timetable'], ex: 'Hold your OV-chipkaart against the reader. *piep*', model: 'ov_gate', reach: 1 },
  metro_entrance: { name: 'Metro entrance', actions: ['Travel', 'Timetable'], ex: 'Stairs down to the GVB metro.', model: 'metro_sign', reach: 1 },
  ferry_pier: { name: 'GVB ferry', actions: ['Board'], ex: 'The free ferry across the IJ. Bikes welcome, patience required.', model: 'ferry', size: [3, 3], reach: 1, pickHeight: 2 },
  ovfiets_rack: { name: 'OV-fiets rental', actions: ['Rent', 'Return'], ex: 'Blue and yellow rental bikes, charged to your OV-chipkaart.', model: 'ovfiets_rack', size: [3, 1] },
  deposit_box: { name: 'Bank deposit box', actions: ['Deposit'], ex: 'Drop your items in; they go straight to your bank. No withdrawals.', model: 'deposit_box', blocks: true },
  station_sign: { name: 'Station sign', actions: ['Read'], ex: 'A blue station sign.', model: 'station_sign' },
  market_stall: { name: 'Market stall', actions: [], ex: 'A stall at the Albert Cuyp. Everything must go!', model: 'market_stall', size: [2, 1], blocks: true },
};
