// Real-world places used by the economy pack: stations, metro stops, ferry piers, banks and the Grand Exchange.
// Coordinates are WGS84; convert with toTile(lat, lon). Shared so the client canal map can list them too.

export const GE_CENTRE = { lat: 52.3731, lon: 4.8926 }; // Dam Square

// NS train stations. metro: GVB metro lines that also stop here.
export const STATIONS = [
  { id: 'centraal', name: 'Amsterdam Centraal', lat: 52.37835, lon: 4.9006, ns: true },
  { id: 'sloterdijk', name: 'Amsterdam Sloterdijk', lat: 52.38875, lon: 4.8380, ns: true },
  { id: 'zuid', name: 'Amsterdam Zuid', lat: 52.3389, lon: 4.8729, ns: true },
  { id: 'amstel', name: 'Amsterdam Amstel', lat: 52.3466, lon: 4.9177, ns: true },
  { id: 'rai', name: 'Amsterdam RAI', lat: 52.3373, lon: 4.8899, ns: true },
  { id: 'bijlmer', name: 'Bijlmer ArenA', lat: 52.3122, lon: 4.9470, ns: true, wild: true },
];

// GVB metro stops. Stops shared with an NS station reuse its id.
export const METRO_STOPS = [
  { id: 'centraal', name: 'Centraal Station', lat: 52.37815, lon: 4.9012 },
  { id: 'noord', name: 'Noord', lat: 52.4013, lon: 4.9330 },
  { id: 'noorderpark', name: 'Noorderpark', lat: 52.3893, lon: 4.9212 },
  { id: 'rokin', name: 'Rokin', lat: 52.3699, lon: 4.8921 },
  { id: 'vijzelgracht', name: 'Vijzelgracht', lat: 52.3609, lon: 4.8907 },
  { id: 'depijp', name: 'De Pijp', lat: 52.3543, lon: 4.8925 },
  { id: 'europaplein', name: 'Europaplein', lat: 52.3427, lon: 4.8925 },
  { id: 'zuid', name: 'Station Zuid', lat: 52.33915, lon: 4.8734 },
  { id: 'nieuwmarkt', name: 'Nieuwmarkt', lat: 52.3722, lon: 4.9010 },
  { id: 'waterlooplein', name: 'Waterlooplein', lat: 52.3672, lon: 4.9031 },
  { id: 'weesperplein', name: 'Weesperplein', lat: 52.3613, lon: 4.9077 },
  { id: 'amstel', name: 'Amstel', lat: 52.3468, lon: 4.9182 },
  { id: 'sloterdijk', name: 'Sloterdijk', lat: 52.38895, lon: 4.8386 },
  { id: 'rai', name: 'RAI', lat: 52.33755, lon: 4.8903 },
  { id: 'bijlmer', name: 'Bijlmer ArenA', lat: 52.3124, lon: 4.9475, wild: true },
];

export const METRO_LINES = [
  { id: '52', name: 'Line 52 (Noord/Zuidlijn)', stops: ['noord', 'noorderpark', 'centraal', 'rokin', 'vijzelgracht', 'depijp', 'europaplein', 'zuid'] },
  { id: '54', name: 'Line 54 (Geinlijn)', stops: ['centraal', 'nieuwmarkt', 'waterlooplein', 'weesperplein', 'amstel', 'bijlmer'] },
  { id: '50', name: 'Line 50 (Ringlijn)', stops: ['sloterdijk', 'zuid', 'rai', 'bijlmer'] },
];

// Free GVB ferries across the IJ.
export const FERRIES = [
  { id: 'f_centraal', name: 'Centraal Station (De Ruijterkade)', lat: 52.38105, lon: 4.8993 },
  { id: 'f_buiksloterweg', name: 'Buiksloterweg', lat: 52.38300, lon: 4.9017 },
  { id: 'f_ndsm', name: 'NDSM-werf', lat: 52.40085, lon: 4.8917 },
];

// Extra bank booths at real bank buildings and stations.
export const BANKS = [
  { name: 'Beurs van Berlage', lat: 52.37455, lon: 4.8961 },
  { name: 'De Nederlandsche Bank', lat: 52.36045, lon: 4.8993 },
  { name: 'ABN AMRO, Zuidas', lat: 52.33765, lon: 4.8722 },
  { name: 'Station Sloterdijk', lat: 52.38865, lon: 4.8386 },
  { name: 'Station Zuid', lat: 52.3392, lon: 4.8737 },
  { name: 'Station Amstel', lat: 52.3469, lon: 4.9171 },
  { name: 'Station RAI', lat: 52.3376, lon: 4.8892 },
  { name: 'NDSM-werf', lat: 52.4012, lon: 4.8925 },
];

export const OVFIETS = [
  { at: 'centraal', lat: 52.37845, lon: 4.9001 },
  { at: 'zuid', lat: 52.33865, lon: 4.8727 },
  { at: 'amstel', lat: 52.34635, lon: 4.9174 },
  { at: 'sloterdijk', lat: 52.38855, lon: 4.8383 },
  { at: 'rai', lat: 52.33705, lon: 4.8896 },
];

export const DEPOSIT_BOX = { lat: 52.37845, lon: 4.8994 };
