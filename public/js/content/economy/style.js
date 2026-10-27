// Styles for the economy pack's windows and tabs, injected once (the pack doesn't own style.css).
const css = `
.ge-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.ge-slot { background: var(--stone-dark); border: 1px solid #000; box-shadow: inset 0 0 0 1px #5d5447; padding: 4px; min-height: 120px; display: flex; flex-direction: column; gap: 3px; font-size: 11px; }
.ge-slot .ge-h { color: var(--orange); text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; }
.ge-slot.buy .ge-h { color: #6fdc6f; } .ge-slot.sell .ge-h { color: #ff9a3a; }
.ge-slot.empty { justify-content: space-between; } .ge-slot.empty .ge-h { color: #9a8a6a; }
.ge-it { display: flex; align-items: center; gap: 4px; color: #fff; line-height: 1.15; } .ge-it span { color: var(--yellow); font-weight: normal; }
.ge-bar { height: 8px; background: #000; border: 1px solid #000; } .ge-bar i { display: block; height: 100%; background: #e0a020; }
.ge-bar.done i { background: #1fae1f; } .ge-bar.aborted i { background: #9a1a1a; }
.ge-num { text-align: center; color: #fff; }
.ge-coll { display: flex; align-items: center; justify-content: center; gap: 2px; color: var(--yellow); }
.ge-ci { width: 22px; height: 20px; display: inline-block; vertical-align: middle; }
.ge-bb { display: flex; gap: 3px; justify-content: center; margin-top: auto; }
.ge-btn, .ge-sm { background: linear-gradient(#5a4c39, #3a3022); border: 1px solid #1c160e; color: #fff; padding: 3px 6px; font-size: 11px; text-shadow: 1px 1px 0 #000; }
.ge-btn:hover, .ge-sm:hover { color: var(--yellow); } .ge-sm.on { color: var(--yellow); box-shadow: inset 0 0 0 1px #c9a227; }
.ge-btn.buy { color: #6fdc6f; } .ge-btn.sell { color: #ff9a3a; } .ge-btn.abort { color: #ff6a6a; }
.ge-form .ge-pick { display: flex; flex-wrap: wrap; gap: 3px; max-height: 150px; overflow-y: auto; background: var(--stone-dark); border: 1px solid #000; padding: 3px; margin: 4px 0; }
.ge-res { display: flex; align-items: center; gap: 2px; padding: 1px 3px; cursor: pointer; color: #fff; font-size: 11px; border: 1px solid transparent; }
.ge-res:hover { background: rgba(255,255,255,.08); } .ge-res.on { border-color: var(--yellow); }
.ge-in { background: #1c160e; border: 1px solid #6b5a3a; color: var(--yellow); padding: 3px 5px; width: 90px; -webkit-user-select: text; user-select: text; }
.ge-in.wide { width: 100%; }
.ge-sel { display: flex; align-items: center; gap: 8px; min-height: 40px; color: #fff; margin: 4px 0; } .ge-sel span { color: #c8b896; font-weight: normal; font-size: 11px; }
.ge-row { display: flex; align-items: center; gap: 4px; margin: 4px 0; flex-wrap: wrap; } .ge-row label { width: 72px; color: var(--orange); font-size: 12px; }
.ge-total { text-align: center; color: var(--yellow); min-height: 1.3em; margin: 6px 0; }
.eco-tab { width: 100%; border-collapse: collapse; font-size: 12px; } .eco-tab th { color: var(--orange); text-align: left; border-bottom: 1px solid #000; }
.eco-tab td { padding: 1px 3px; border-bottom: 1px solid #2b2418; color: #fff; } .eco-tab .r { text-align: right; } .eco-tab td.r { color: var(--yellow); }
.eco-map h4, .eco-pg h4, .eco-diary h4 { color: var(--orange); margin: 8px 0 4px; } .eco-diary h4 span { color: #c8b896; font-size: 11px; }
.eco-reg { background: var(--stone-dark); border: 1px solid #000; padding: 3px 6px; margin: 2px 0; color: #fff; font-size: 12px; }
.eco-reg span { color: #c8b896; font-weight: normal; font-size: 11px; } .eco-reg.here { box-shadow: inset 0 0 0 1px var(--yellow); } .eco-reg.wild b { color: #ff5a3a; } .eco-reg i { color: var(--yellow); }
.eco-mk { display: flex; gap: 12px; align-items: center; justify-content: center; } .eco-mk canvas { background: radial-gradient(#4a3c28, #1c160e); border: 1px solid #000; }
.eco-mk-opts { display: grid; grid-template-columns: auto 60px auto; gap: 4px; align-items: center; text-align: center; color: #fff; }
.eco-hs { width: 100%; height: min(60vh, 460px); border: 2px solid #000; background: #d8c8a0; }
.eco-fade { position: fixed; inset: 0; z-index: 9; background: #000; display: flex; align-items: center; justify-content: center; text-align: center; color: #fff; font-size: 16px; pointer-events: none; animation: ecofade 1.7s ease-out forwards; }
.eco-fade b { color: #ffcf2e; font: bold 26px Georgia, serif; text-shadow: 2px 2px 0 #000; }
@keyframes ecofade { 0% { opacity: 1; } 55% { opacity: .95; } 100% { opacity: 0; } }
#chat-lines .pm { color: #00ffff; } #chat-lines .pm b { color: #00ffff; }
.eco-th { color: var(--orange); text-align: center; margin-bottom: 6px; } .eco-th span { color: var(--yellow); }
.eco-cat { display: flex; justify-content: space-between; padding: 2px 4px; cursor: pointer; color: #ff3030; font-size: 12px; } .eco-cat:hover { background: rgba(255,255,255,.08); }
.eco-cat.some { color: #ffff00; } .eco-cat.full { color: #00ff00; } .eco-cat b { font-weight: normal; }
.eco-tasks { font-size: 11px; font-weight: normal; padding: 0 4px 4px 10px; } .eco-tasks div { color: #ff6a50; margin: 1px 0; } .eco-tasks div.d { color: #2fdc2f; text-decoration: line-through; }
.eco-tasks i, .eco-diary i { color: #c8b896; }
.eco-diary p { margin: 2px 0; color: #ff6a50; font-weight: normal; font-size: 12px; } .eco-diary p.d { color: #2fdc2f; text-decoration: line-through; }
.eco-cl-tabs { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 6px; }
.eco-cl-head { color: var(--orange); margin-bottom: 4px; } .eco-cl-head b { color: var(--yellow); }
.eco-cl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(42px, 1fr)); gap: 3px; background: var(--stone-dark); border: 1px solid #000; padding: 4px; }
.eco-cl-it { height: 36px; display: flex; align-items: center; justify-content: center; filter: grayscale(1) brightness(.35); }
.eco-cl-it.got { filter: none; }
.eco-ftabs { display: flex; gap: 3px; margin-bottom: 4px; } .eco-ftabs .ge-sm { flex: 1; }
.eco-flist { min-height: 140px; max-height: 170px; overflow-y: auto; background: var(--stone-dark); border: 1px solid #000; padding: 2px; }
.eco-fr { display: flex; justify-content: space-between; padding: 1px 4px; color: #fff; font-size: 12px; cursor: pointer; touch-action: none; }
.eco-fr:hover { background: rgba(255,255,255,.08); } .eco-fr b.on { color: #00ff00; } .eco-fr b.off { color: #ff3030; } .eco-fr b { font-weight: normal; font-size: 11px; }
.eco-pmrow, .eco-addrow { display: flex; gap: 3px; margin-top: 4px; align-items: center; font-size: 11px; color: #00ffff; }
.eco-pmrow input, .eco-addrow input { flex: 1; min-width: 0; background: #1c160e; border: 1px solid #6b5a3a; color: var(--yellow); padding: 2px 4px; -webkit-user-select: text; user-select: text; }
.eco-rep p { color: #fff; } .eco-rep input { background: #1c160e; border: 1px solid #6b5a3a; color: var(--yellow); padding: 3px 5px; -webkit-user-select: text; user-select: text; }
.eco-reasons { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
@media (max-width: 760px) { .ge-slots { grid-template-columns: repeat(2, 1fr); } }
`;
const el = document.createElement('style');
el.id = 'eco-style';
el.textContent = css;
document.head.appendChild(el);
