// Hand-built landmark models. Their footprints replace the OpenStreetMap buildings at the same spot.
// rot is the yaw that turns the model's local +z (its front) to face the given bearing.
import { toTile } from './geo.js';

const facing = bearing => { const b = bearing * Math.PI / 180; return Math.atan2(Math.sin(b), -Math.cos(b)); };

export const LANDMARK_MODELS = [
  { id: 'paleis', name: 'Royal Palace', ex: 'The Koninklijk Paleis, built as the city hall in 1655. Still has the best view of the Dam.', lat: 52.37318, lon: 4.89122, w: 80, d: 57, rot: facing(108) },
  { id: 'monument', name: 'Nationaal Monument', ex: 'A 22 metre pillar of travertine, remembering the Second World War.', lat: 52.3728, lon: 4.89365, w: 24, d: 18, rot: facing(288) },
  { id: 'nieuwekerk', name: 'Nieuwe Kerk', ex: 'The "new" church. Built around 1400, which is new by Amsterdam standards.', lat: 52.37385, lon: 4.8915, w: 78, d: 30, rot: facing(188) },
  { id: 'bijenkorf', name: 'De Bijenkorf', ex: 'The beehive. A department store on the Dam since 1914.', lat: 52.37356, lon: 4.89447, w: 55, d: 70, rot: facing(198) },
  // Ranged guild at Club Kaliber, Jordaan. Only the tower is solid; the courtyard and target range are walkable.
  { id: 'rangedguild', name: 'Kaliber Ranged Guild', ex: 'The finest archers in the Jordaan train here.', lat: 52.3765, lon: 4.8830, w: 50, d: 44, rot: facing(180), solid: [-21, -3, -15, 3] },
  { id: 'centraal', name: 'Amsterdam Centraal', ex: 'The grand station of 1889, by Pierre Cuypers. Every adventure starts here.', lat: 52.37895, lon: 4.90030, w: 280, d: 40, rot: facing(180) },
  { id: 'westerkerk', name: 'Westerkerk', ex: 'Its 85 metre tower wears the imperial crown. Rembrandt is buried somewhere inside.', lat: 52.37452, lon: 4.88395, w: 58, d: 30, rot: facing(180) },
  { id: 'rijksmuseum', name: 'Rijksmuseum', ex: 'Home of the Night Watch. You can cycle right through the middle of it.', lat: 52.36000, lon: 4.88520, w: 135, d: 80, rot: facing(0) },
  { id: 'oudekerk', name: 'Oude Kerk', ex: "Amsterdam's oldest building, consecrated in 1306. Its tower is 67 metres tall.", lat: 52.37412, lon: 4.89804, w: 82, d: 46, rot: facing(168) },
].map(l => {
  const t = toTile(l.lat, l.lon);
  const c = Math.cos(l.rot), s = Math.sin(l.rot);
  // local (x, z) -> world, matching THREE's rotation.y
  const toWorld = (lx, lz) => [t.x + lx * c + lz * s, t.z - lx * s + lz * c];
  const hw = l.w / 2, hd = l.d / 2;
  const [sx0, sx1, sz0, sz1] = l.solid || [-hw, hw, -hd, hd];
  return {
    ...l, x: t.x, z: t.z,
    footprint: [toWorld(-hw, -hd), toWorld(hw, -hd), toWorld(hw, hd), toWorld(-hw, hd)],
    solidPoly: [toWorld(sx0, sz0), toWorld(sx1, sz0), toWorld(sx1, sz1), toWorld(sx0, sz1)],
  };
});

export function insideLandmark(x, z, margin = 0) {
  for (const l of LANDMARK_MODELS) {
    const c = Math.cos(l.rot), s = Math.sin(l.rot);
    const dx = x - l.x, dz = z - l.z;
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    if (Math.abs(lx) <= l.w / 2 + margin && Math.abs(lz) <= l.d / 2 + margin) return l;
  }
  return null;
}
