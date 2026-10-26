// Extension points for content packs (public/js/content/*.js). See docs/ENGINE.md.
export const registry = {
  // objectModels[id] = (params, THREE) => THREE.Object3D. Built facing +z, standing on y = 0, 1 tile = 1 metre.
  objectModels: {},
  // npcModels[id] = (group, mats, parts, THREE, helpers) => height. Used when an NPC def has model: id.
  npcModels: {},
  // iconDrawers[id] = g => draw on a 36x32 canvas context (outline and shadow are added automatically).
  iconDrawers: {},
  // tabs: [{ id, icon, title, render(el, ctx) }] extra side-panel tabs (prayer, music, collection log...).
  tabs: [],
  // msgHandlers[type] = (message, ctx) => void, for server messages sent by content systems.
  msgHandlers: {},
  // chunkDecorators: (chunk, data, group, THREE, ctx) => void, run after a map chunk is built (street furniture...).
  chunkDecorators: [],
  // frameHooks: (now, ctx) => void, run every animation frame (water, weather, day/night...).
  frameHooks: [],
  // sfx: (id) => void, set by the audio pack. Content may call registry.sfx?.(id).
  sfx: null,
  // ctx is filled in by main.js: { S, send, chat, openWindow, closeWindow, iconImg, renderer, showMenu, esc, ITEMS }
  ctx: null,
};
