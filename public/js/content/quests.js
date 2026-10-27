// Client-side models, icons and UI for the "quests" content pack. See docs/ENGINE.md.
import { registry } from '../registry.js';
import './quests/models.js';
import './quests/npcs.js';
import './quests/icons.js';

// Daily challenge board: the server sends { t: 'qdaily', date, tasks: [{ text, have, need, done, claimed }], bonus, tokens }
registry.msgHandlers.qdaily = (m, ctx) => {
  const rows = m.tasks.map(t => `<div class="qd-task" style="margin:6px 0;padding:6px;border:1px solid #5a4a30;background:rgba(0,0,0,0.25)">
    <div style="color:${t.claimed ? '#7a7a7a' : t.done ? '#00ff80' : '#ffff00'}">${ctx.esc(t.text)}</div>
    <div style="font-size:12px;color:#c8b890">${t.claimed ? 'Reward claimed' : t.done ? 'Complete! Talk to Daan to claim.' : `Progress: ${t.have} / ${t.need}`} &middot; Reward: ${ctx.esc(t.reward)}</div></div>`).join('');
  ctx.openWindow(`Daily challenges (${m.date})`, `<div class="journal">${rows}
    <div style="margin-top:8px;color:#ffb000">${m.bonus ? 'All three done today: bonus claimed!' : 'Finish all three for a challenge token and 500 coins.'}</div>
    <div style="color:#ffb000">Challenge tokens: ${m.tokens}. New challenges every day at midnight (UTC).</div></div>`);
};
