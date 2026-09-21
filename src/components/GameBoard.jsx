import { Card } from './Card';

export function GameBoard({ board, hoverIndex, hideCardNames = false }) {
  return (
    <div className={`battle-field rounded-[28px] border border-lime-100/30 p-4 shadow-[0_24px_80px_rgba(0,0,0,.35)] ${board.some((slot) => slot?.animation === 'drop') ? 'board-impact' : ''}`}>
      <div className="grid grid-cols-3 gap-3">
        {board.map((slot, index) => (
          <div
            key={index}
            data-cell-index={index}
            className={`battle-cell relative aspect-[3/4] overflow-hidden rounded-lg transition ${slot ? 'occupied' : hoverIndex === index ? 'hovered' : ''}`}
          >
            {!slot && <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-lime-100/25">＋</div>}
            {slot && <div className="absolute inset-1"><Card card={slot.card} owner={slot.owner} animation={slot.animation} disabled hideName={hideCardNames} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
