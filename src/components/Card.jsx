import { RARITY_STYLES } from '../data/cards';

function EdgeValue({ value, className }) {
  return <div className={`edge-value absolute z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/85 text-sm font-black shadow ${className}`}>{value}</div>;
}

function RarityBadge({ rarity }) {
  const style = RARITY_STYLES[rarity] || RARITY_STYLES.N;
  const textStyle = style.gradient
    ? { backgroundImage: style.gradient, WebkitBackgroundClip: 'text', color: 'transparent' }
    : { color: style.color };

  return (
    <div className="rarity-text absolute right-1 top-1 z-20 text-[10px] font-black tracking-wider" style={textStyle}>
      {rarity}
    </div>
  );
}

export function Card({ card, owner = 1, compact = false, animation = '', onPointerDown, disabled = false, hideName = false }) {
  const ownerClass = owner === 1
    ? 'from-blue-950 via-blue-800 to-cyan-950 ring-blue-400'
    : 'from-red-950 via-red-800 to-rose-950 ring-red-400';
  const animationClass = animation === 'flip' ? 'card-flip' : animation === 'drop' ? 'card-drop' : '';
  const symbol = card.name?.slice(0, 1) || '?';
  const image = card.image || card.bgImage;

  return (
    <div
      onPointerDown={disabled ? undefined : onPointerDown}
      className={`card-3d ${animationClass} relative select-none overflow-hidden rounded-xl border-2 border-white/15 bg-gradient-to-br ${ownerClass} ring-1 shadow-[0_10px_30px_rgba(0,0,0,.45)] ${compact ? 'h-[126px] w-[94px]' : 'h-full w-full'} ${disabled ? '' : 'cursor-grab touch-none active:cursor-grabbing'}`}
    >
      <div className="absolute inset-[12%] overflow-hidden rounded-lg bg-black/30">
        {image ? (
          <img src={image} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,.2),rgba(0,0,0,.82))] text-4xl font-black text-white/50">
            {symbol}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
      </div>
      <EdgeValue value={card.values.top} className="left-1/2 top-1 -translate-x-1/2" />
      <EdgeValue value={card.values.right} className="right-1 top-1/2 -translate-y-1/2" />
      <EdgeValue value={card.values.bottom} className="bottom-1 left-1/2 -translate-x-1/2" />
      <EdgeValue value={card.values.left} className="left-1 top-1/2 -translate-y-1/2" />
      {!hideName && <div className="absolute bottom-[9%] left-1/2 z-20 w-[74%] -translate-x-1/2 truncate rounded bg-black/75 px-1 py-0.5 text-center text-[10px] font-bold">{card.name}</div>}
      <RarityBadge rarity={card.rarity} />
    </div>
  );
}
