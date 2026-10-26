// Local tangent-plane projection. 1 game tile = 1 metre.
// Tile (0,0) is the forecourt in front of Amsterdam Centraal. +x is east, +z is south.
export const ORIGIN = { lat: 52.378, lon: 4.9 };
const phi = ORIGIN.lat * Math.PI / 180;
export const M_LAT = 111132.92 - 559.82 * Math.cos(2 * phi) + 1.175 * Math.cos(4 * phi);
export const M_LON = 111412.84 * Math.cos(phi) - 93.5 * Math.cos(3 * phi);
export const CHUNK = 256;

export function toTile(lat, lon) {
  return { x: (lon - ORIGIN.lon) * M_LON, z: (ORIGIN.lat - lat) * M_LAT };
}

export function toLatLon(x, z) {
  return { lat: ORIGIN.lat - z / M_LAT, lon: ORIGIN.lon + x / M_LON };
}

export const cheb = (ax, az, bx, bz) => Math.max(Math.abs(ax - bx), Math.abs(az - bz));
