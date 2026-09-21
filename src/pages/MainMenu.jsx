import { BookOpen, Settings, Sparkles, Sword, UserRound } from 'lucide-react';

export function MainMenu({ player, world, onNavigate }) {
  const items = [
    ['adventure', '冒險之書', BookOpen],
    ['deck', '牌組編輯', Settings],
    ['trainer', '訓練師設定', UserRound],
    ['gacha', '尋找夥伴', Sparkles],
    ['battle', '對戰', Sword],
  ];

  return (
    <main className="main-hub min-h-screen overflow-hidden text-white" style={{ backgroundImage: "url('/assets/main-menu-background-qqworld.png')" }}>
      <div className="hub-topbar">
        <div className="hub-player hub-player-text">
          <div>
            <div className="text-2xl font-black">{player.trainer.name}</div>
            <div className="text-sm text-white/85">AP {player.ap}　QP {player.qp}</div>
            <div className="mt-1 text-sm text-white/80">目前關卡：{world.stages.find((stage) => !player.completedStageIds.includes(stage.id))?.name || '冒險已完成'}</div>
          </div>
        </div>
      </div>
      <div className="hub-grid">
        {items.map(([target, label, Icon], index) => (
          <button key={label} onClick={() => onNavigate(target)} className={`pressable hub-tile hub-tile-${index}`}>
            <Icon className="h-9 w-9 text-cyan-100" />
            <div className="text-4xl font-black">{label}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
