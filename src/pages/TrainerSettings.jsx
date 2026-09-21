import { useEffect, useState } from 'react';

export function TrainerSettings({ player, world, onSave, onBack }) {
  const [draft, setDraft] = useState(player.trainer);

  useEffect(() => setDraft(player.trainer), [player.trainer]);

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({ ...player, trainer: { ...draft, name: draft.name.trim() || '新手訓練師' } });
  }

  return (
    <main className="min-h-screen bg-[#06101A] px-4 py-6 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black tracking-[.45em] text-cyan-300">TRAINER SETTINGS</div>
            <h1 className="mt-2 text-4xl font-black">訓練師設定</h1>
          </div>
          <button onClick={onBack} className="pressable rounded-lg border border-white/20 bg-black/40 px-5 py-3 font-black">返回</button>
        </header>
        <form onSubmit={submit} className="grid gap-5 rounded-lg border border-white/10 bg-black/30 p-5 md:grid-cols-[220px_1fr]">
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-cyan-950/70 to-slate-950">
            <div className="text-center">
              <div className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-black/40 bg-[#F3C8A8]" />
              <div className="text-xl font-black">{draft.name || '新手訓練師'}</div>
              <div className="mt-1 text-sm text-slate-400">目前服裝設定</div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block"><div className="mb-1 text-sm text-slate-400">訓練師名稱</div><input className="field" value={draft.name || ''} onChange={(event) => update('name', event.target.value)} maxLength={20} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><div className="mb-1 text-sm text-slate-400">樣式</div><select className="field" value={draft.gender || '樣式 A'} onChange={(event) => update('gender', event.target.value)}><option>樣式 A</option><option>樣式 B</option></select></label>
              <label className="block"><div className="mb-1 text-sm text-slate-400">髮型</div><select className="field" value={draft.hairStyle || '短髮'} onChange={(event) => update('hairStyle', event.target.value)}><option>短髮</option><option>長髮</option></select></label>
            </div>
            <label className="block"><div className="mb-1 text-sm text-slate-400">髮色</div><input className="field h-12 p-1" type="color" value={draft.hairColor || '#2B2118'} onChange={(event) => update('hairColor', event.target.value)} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><div className="mb-1 text-sm text-slate-400">上衣</div><select className="field" value={draft.topId || ''} onChange={(event) => update('topId', event.target.value)}>{world.outfits.tops.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="block"><div className="mb-1 text-sm text-slate-400">下身</div><select className="field" value={draft.bottomId || ''} onChange={(event) => update('bottomId', event.target.value)}>{world.outfits.bottoms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            </div>
            <button type="submit" className="rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950">儲存訓練師設定</button>
          </div>
        </form>
      </div>
    </main>
  );
}
