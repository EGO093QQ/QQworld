export function GameOverModal({ score, onRestart, onExit, rewardLabel }) {
  const result = score.player1 > score.player2 ? '玩家勝利' : score.player2 > score.player1 ? '電腦勝利' : '平手';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-950 p-8 text-center shadow-[0_0_100px_rgba(34,211,238,.18)]">
        <div className="text-xs tracking-[.45em] text-cyan-300">戰鬥結束</div>
        <h2 className="mt-2 text-4xl font-black">{result}</h2>
        <div className="my-7 text-5xl font-black">{score.player1} <span className="text-slate-600">:</span> {score.player2}</div>
        {rewardLabel && <div className="mb-5 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{rewardLabel}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={onRestart} className="rounded-lg border border-white/10 px-5 py-4 font-black">再戰一次</button>
          <button onClick={onExit} className="rounded-lg bg-cyan-400 px-5 py-4 font-black text-slate-950">回到主選單</button>
        </div>
      </div>
    </div>
  );
}
