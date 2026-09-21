import { useState } from 'react';
import { Card } from './Card';
import { RARITIES } from '../data/cards';

const blankCard = () => ({ id: null, name: '新卡片', values: { top: 5, right: 5, bottom: 5, left: 5 }, image: '', bgImage: '', rarity: 'R' });
const clone = (value) => JSON.parse(JSON.stringify(value));
const uid = () => `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function CardEditor({ cards, onSaveAll, onClose }) {
  const [draft, setDraft] = useState(blankCard);

  function setValue(side, value) {
    const next = Math.max(1, Math.min(10, Number(value) || 1));
    setDraft((card) => ({ ...card, values: { ...card.values, [side]: next } }));
  }

  function saveDraft() {
    const item = { ...draft, id: draft.id || uid() };
    const next = draft.id ? cards.map((card) => card.id === draft.id ? item : card) : [...cards, item];
    onSaveAll(next);
    setDraft(item);
  }

  function deleteDraft() {
    if (!draft.id) return;
    onSaveAll(cards.filter((card) => card.id !== draft.id));
    setDraft(blankCard());
  }

  function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((card) => ({ ...card, image: reader.result, bgImage: reader.result }));
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-4 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-5 rounded-3xl border border-white/10 bg-slate-950 p-5 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-black">卡片資料庫</h3><button onClick={() => setDraft(blankCard())} className="rounded-lg bg-cyan-400/10 px-3 py-2 text-xs text-cyan-200">＋新增</button></div>
          <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
            {cards.map((card) => (
              <button key={card.id} onClick={() => setDraft(clone(card))} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:bg-white/10">
                <div className="h-16 w-12 overflow-hidden rounded bg-black/40">{card.bgImage && <img src={card.bgImage} alt="" className="h-full w-full object-cover" />}</div>
                <div><div className="font-bold">{card.name}</div><div className="text-xs text-slate-400">{card.rarity} · {card.values.top}/{card.values.right}/{card.values.bottom}/{card.values.left}</div></div>
              </button>
            ))}
          </div>
        </aside>

        <main>
          <div className="mb-4 flex items-center justify-between"><div><div className="text-xs tracking-[.3em] text-cyan-300">CARD DESIGNER</div><h2 className="text-2xl font-black">自由設計卡片</h2></div><button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2">關閉</button></div>
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="mx-auto h-[360px] w-[270px]"><Card card={draft} owner={1} disabled /></div>
            <div className="space-y-4">
              <label className="block"><div className="mb-1 text-sm text-slate-400">卡片名稱</div><input value={draft.name} onChange={(e) => setDraft((card) => ({ ...card, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-cyan-400" /></label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({ top: '上', right: '右', bottom: '下', left: '左' }).map(([side, label]) => (
                  <label key={side} className="block"><div className="mb-1 text-sm text-slate-400">{label}邊點數</div><input type="number" min="1" max="10" value={draft.values[side]} onChange={(e) => setValue(side, e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xl font-black outline-none focus:border-cyan-400" /></label>
                ))}
              </div>
              <label className="block"><div className="mb-1 text-sm text-slate-400">稀有度</div><select value={draft.rarity} onChange={(e) => setDraft((card) => ({ ...card, rarity: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3">{RARITIES.map((r) => <option key={r}>{r}</option>)}</select></label>
              <label className="block"><div className="mb-1 text-sm text-slate-400">插畫網址</div><input value={draft.bgImage} onChange={(e) => setDraft((card) => ({ ...card, bgImage: e.target.value }))} placeholder="https://..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-cyan-400" /></label>
              <label className="block"><div className="mb-1 text-sm text-slate-400">或直接上傳圖片</div><input type="file" accept="image/*" onChange={uploadImage} className="block w-full text-sm text-slate-300" /></label>
              <div className="flex flex-wrap gap-3 pt-2"><button onClick={saveDraft} className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950">儲存卡片</button><button onClick={() => setDraft(blankCard())} className="rounded-xl border border-white/10 px-5 py-3">清空新增</button>{draft.id && <button onClick={deleteDraft} className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-3 text-red-300">刪除卡片</button>}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
