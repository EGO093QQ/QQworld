import { Card } from './Card';

export function Hand({ player, title, cards, currentPlayer, onDragStart, hideCardNames = false }) {
  const active = player === currentPlayer;
  return (
    <section className={`rounded-lg border p-4 transition ${active ? (player === 1 ? 'border-blue-400 bg-blue-950/30' : 'border-red-400 bg-red-950/30') : 'border-white/10 bg-black/20 opacity-55'}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[.35em] text-slate-500">{active ? '目前回合' : '等待中'}</div>
          <h2 className={player === 1 ? 'font-black text-blue-300' : 'font-black text-red-300'}>{title}</h2>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{cards.length} 張</div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {cards.map((card) => (
          <Card key={card._handId} card={card} owner={player} compact disabled={!active} hideName={hideCardNames} onPointerDown={(event) => onDragStart(event, card, player)} />
        ))}
      </div>
    </section>
  );
}
