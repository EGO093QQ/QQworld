export function ScoreBoard({ score, currentPlayer }) {
  return (
    <div className="mx-auto mb-5 flex max-w-md items-center justify-center gap-8 rounded-lg border border-white/10 bg-black/40 px-6 py-3">
      <div className="text-center"><div className="text-xs text-blue-300">玩家</div><div className="text-4xl font-black">{score.player1}</div></div>
      <div className="text-center"><div className="text-[10px] tracking-[.35em] text-slate-500">回合</div><div className="font-black">{currentPlayer === 1 ? '玩家' : '電腦'}</div></div>
      <div className="text-center"><div className="text-xs text-red-300">電腦</div><div className="text-4xl font-black">{score.player2}</div></div>
    </div>
  );
}
