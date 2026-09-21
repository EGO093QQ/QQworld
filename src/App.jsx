import { useEffect, useMemo, useState } from 'react';
import { Database, Download, Save, Sparkles, Upload, UserRound } from 'lucide-react';
import { Card } from './components/Card';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { Hand } from './components/Hand';
import { ScoreBoard } from './components/ScoreBoard';
import { MainMenu } from './pages/MainMenu';
import { DeckScreen } from './pages/DeckScreen';
import { TrainerSettings } from './pages/TrainerSettings';
import { DEFAULT_CARDS, RARITIES } from './data/cards';
import { normalizeCards } from './data/cardSchema';
import { PLAYER_ONE, PLAYER_TWO } from './game/constants';
import { useGame } from './hooks/useGame';
import { loadJson, saveJson } from './storage/jsonStorage';

const APP_KEY = 'triple-realm-v01-save';
const WORLD_KEY = 'triple-realm-v01-world';
const LOG_KEY = 'triple-realm-v01-logs';

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const playTone = (type = 'confirm') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type === 'cancel' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(type === 'cancel' ? 260 : 520, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(type === 'cancel' ? 180 : 780, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  } catch {
    // Audio feedback is optional; browsers may block it in some contexts.
  }
};

function actionClick(callback, tone = 'confirm') {
  playTone(tone);
  callback?.();
}

const DEFAULT_WORLD = {
  title: 'QQ獸世界',
  opening: {
    background: '',
    music: '',
    lines: [
      '在星境的邊界，怪獸卡夥伴會回應勇敢訓練師的呼喚。',
      '你收到第一副牌組，準備踏上自己的冒險。',
      '每一次對戰，都是讓世界多亮一點的練習。',
    ],
  },
  titleScreen: { image: '', logo: '' },
  settings: { drawCostQP: 20, startingQP: 100, startingAP: 0 },
  cards: DEFAULT_CARDS,
  outfits: {
    tops: [
      { id: 'top-basic', name: '學院上衣', priceAP: 0, color: '#38BDF8' },
      { id: 'top-brave', name: '冒險外套', priceAP: 40, color: '#F97316' },
    ],
    bottoms: [
      { id: 'bottom-basic', name: '訓練長褲', priceAP: 0, color: '#334155' },
      { id: 'bottom-field', name: '遠行短褲', priceAP: 35, color: '#16A34A' },
    ],
  },
  cardPools: [
    {
      id: 'partner-basic',
      name: '初遇夥伴池',
      image: '',
      active: true,
      costQP: 20,
      cardIds: DEFAULT_CARDS.map((card) => card.id),
      rarityRates: { N: 62, R: 25, SR: 10, UR: 2.5, LR: 0.5 },
    },
  ],
  stages: [
    {
      id: 'stage-forest-01',
      type: '主線',
      name: '第一章：晨光草地',
      story: [
        { speaker: '莉行老師', portrait: '', background: '', text: '歡迎你，新的訓練師。先用手上的基本牌組，試著與我進行一場練習戰吧。' },
        { speaker: '莉行老師', portrait: '', background: '', text: '看清楚上下左右的數字，放牌的位置會決定勝負。' },
      ],
      opponent: {
        name: '莉行老師',
        image: '',
        deckIds: ['sprout-hopper', 'stone-pup', 'mist-fin', 'ember-cat', 'leaf-guard'],
      },
      rewards: { ap: 10, qp: 30, cardIds: ['spark-mouse'] },
    },
  ],
};

function normalizeWorld(world) {
  const source = world && typeof world === 'object' ? world : DEFAULT_WORLD;
  return {
    ...DEFAULT_WORLD,
    ...source,
    opening: { ...DEFAULT_WORLD.opening, ...(source.opening || {}) },
    titleScreen: { ...DEFAULT_WORLD.titleScreen, ...(source.titleScreen || {}) },
    settings: { ...DEFAULT_WORLD.settings, ...(source.settings || {}) },
    cards: normalizeCards(source.cards, DEFAULT_WORLD.cards),
    stages: Array.isArray(source.stages) && source.stages.length ? source.stages : DEFAULT_WORLD.stages,
    outfits: source.outfits || DEFAULT_WORLD.outfits,
    cardPools: Array.isArray(source.cardPools) ? source.cardPools : DEFAULT_WORLD.cardPools,
  };
}

function makeNewPlayer(world) {
  const allCards = world.cards.map((card) => card.id);
  const basicCards = allCards.slice(0, 5);
  return {
    trainer: {
      name: '新手訓練師',
      gender: '樣式 A',
      hairStyle: '短髮',
      hairColor: '#2B2118',
      topId: 'top-basic',
      bottomId: 'bottom-basic',
    },
    ap: world.settings.startingAP,
    qp: world.settings.startingQP,
    ownedCardIds: allCards,
    deckIds: basicCards,
    ownedOutfitIds: ['top-basic', 'bottom-basic'],
    completedStageIds: [],
    currentStageId: null,
  };
}

function logAction(message, detail = {}) {
  const logs = loadJson(LOG_KEY, []);
  const next = [{ id: uid('log'), at: new Date().toISOString(), message, detail }, ...logs].slice(0, 120);
  saveJson(LOG_KEY, next);
  return next;
}

function pickByRarity(pool, world) {
  const entries = Object.entries(pool.rarityRates || {}).filter(([, value]) => Number(value) > 0);
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0);
  let roll = Math.random() * total;
  let selectedRarity = entries[0]?.[0] || 'N';
  for (const [rarity, value] of entries) {
    roll -= Number(value);
    if (roll <= 0) {
      selectedRarity = rarity;
      break;
    }
  }

  const cards = world.cards.filter((card) => pool.cardIds.includes(card.id) && card.rarity === selectedRarity);
  const fallback = world.cards.filter((card) => pool.cardIds.includes(card.id));
  const source = cards.length ? cards : fallback;
  return source[Math.floor(Math.random() * source.length)];
}

function applyRewards(player, rewards = {}) {
  const rewardCards = rewards.cardIds || [];
  return {
    ...player,
    ap: player.ap + (Number(rewards.ap) || 0),
    qp: player.qp + (Number(rewards.qp) || 0),
    ownedCardIds: [...new Set([...player.ownedCardIds, ...rewardCards])],
    completedStageIds: player.currentStageId
      ? [...new Set([...player.completedStageIds, player.currentStageId])]
      : player.completedStageIds,
  };
}

function rewardText(world, rewards = {}) {
  const bits = [];
  if (rewards.ap) bits.push(`AP +${rewards.ap}`);
  if (rewards.qp) bits.push(`QP +${rewards.qp}`);
  if (rewards.cardIds?.length) {
    const names = rewards.cardIds.map((id) => world.cards.find((card) => card.id === id)?.name || id).join('、');
    bits.push(`獲得卡牌：${names}`);
  }
  return bits.length ? `勝利獎勵：${bits.join('，')}` : '';
}

function TrainerAvatar({ trainer, world, large = false }) {
  const top = world.outfits.tops.find((item) => item.id === trainer.topId) || world.outfits.tops[0];
  const bottom = world.outfits.bottoms.find((item) => item.id === trainer.bottomId) || world.outfits.bottoms[0];
  return (
    <div className={`relative mx-auto ${large ? 'h-72 w-40' : 'h-44 w-28'}`}>
      <div className="absolute left-1/2 top-2 h-16 w-16 -translate-x-1/2 rounded-full border-2 border-black/40 bg-[#F3C8A8]" />
      <div className="absolute left-1/2 top-0 h-11 w-20 -translate-x-1/2 rounded-t-full" style={{ background: trainer.hairColor }} />
      <div className="absolute left-1/2 top-[72px] h-24 w-24 -translate-x-1/2 rounded-t-3xl border-2 border-black/40" style={{ background: top?.color }} />
      <div className="absolute left-1/2 top-[156px] h-24 w-20 -translate-x-1/2 rounded-b-3xl border-2 border-black/40" style={{ background: bottom?.color }} />
      <div className="absolute left-1/2 top-[52px] -translate-x-1/2 text-xs font-black text-slate-950">{trainer.hairStyle === '長髮' ? '長' : '短'}</div>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/35 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [world, setWorld] = useState(() => normalizeWorld(loadJson(WORLD_KEY, DEFAULT_WORLD)));
  const [player, setPlayer] = useState(() => loadJson(APP_KEY, null));
  const [screen, setScreen] = useState('opening');
  const [openingIndex, setOpeningIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [titlePhase, setTitlePhase] = useState('fade');
  const [worldEditor, setWorldEditor] = useState(null);
  const [storyTransitioning, setStoryTransitioning] = useState(false);
  const [drawResult, setDrawResult] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [rewardedBattle, setRewardedBattle] = useState(false);
  const [logs, setLogs] = useState(() => loadJson(LOG_KEY, []));
  const [drag, setDrag] = useState(null);
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
  const [hoverIndex, setHoverIndex] = useState(null);
  const game = useGame(world.cards);

  useEffect(() => {
    if (screen !== 'title') return;
    setTitlePhase('fade');
    const logoTimer = setTimeout(() => setTitlePhase('logo'), 800);
    const promptTimer = setTimeout(() => setTitlePhase('prompt'), 1500);
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(promptTimer);
    };
  }, [screen]);

  useEffect(() => saveJson(WORLD_KEY, world), [world]);
  useEffect(() => {
    if (player) saveJson(APP_KEY, player);
  }, [player]);

  const ownedCards = useMemo(
    () => player ? player.ownedCardIds.map((id) => world.cards.find((card) => card.id === id)).filter(Boolean) : [],
    [player, world.cards],
  );

  const deckCards = useMemo(
    () => player ? player.deckIds.map((id) => world.cards.find((card) => card.id === id)).filter(Boolean) : [],
    [player, world.cards],
  );

  useEffect(() => {
    if (screen !== 'battle' || !activeStage) return;
    const rivalDeck = activeStage.opponent.deckIds.map((id) => world.cards.find((card) => card.id === id)).filter(Boolean);
    game.startGame(deckCards, rivalDeck);
    setRewardedBattle(false);
  }, [screen, activeStage?.id]);

  useEffect(() => {
    if (screen !== 'battle' || game.currentPlayer !== PLAYER_TWO || game.gameOver) return;
    const timer = setTimeout(() => {
      const emptyIndexes = game.board.map((slot, index) => slot ? null : index).filter((index) => index !== null);
      const card = game.player2Hand[0];
      if (card && emptyIndexes.length) game.placeCard(emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)], card, PLAYER_TWO);
    }, 700);
    return () => clearTimeout(timer);
  }, [screen, game.currentPlayer, game.gameOver, game.board, game.player2Hand]);

  useEffect(() => {
    if (!game.gameOver || rewardedBattle || !activeStage || !player) return;
    if (game.score.player1 > game.score.player2) {
      const nextPlayer = applyRewards({ ...player, currentStageId: activeStage.id }, activeStage.rewards);
      setPlayer(nextPlayer);
      setLogs(logAction('完成關卡戰鬥', { stage: activeStage.name, rewards: activeStage.rewards }));
    }
    setRewardedBattle(true);
  }, [game.gameOver, game.score, rewardedBattle, activeStage, player]);

  function beginDrag(event, card, owner) {
    if (owner !== game.currentPlayer || owner !== PLAYER_ONE) return;
    event.preventDefault();
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    setDrag({ card, owner });
    setGhostPosition({ x: event.clientX, y: event.clientY });

    const onMove = (moveEvent) => {
      setGhostPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
      const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const cell = element?.closest?.('[data-cell-index]');
      const index = cell ? Number(cell.dataset.cellIndex) : null;
      setHoverIndex(index !== null && !game.board[index] ? index : null);
    };

    const cleanup = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancel);
      event.currentTarget?.releasePointerCapture?.(event.pointerId);
      setDrag(null);
      setHoverIndex(null);
    };

    const onUp = (upEvent) => {
      const element = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const cell = element?.closest?.('[data-cell-index]');
      const index = cell ? Number(cell.dataset.cellIndex) : null;
      if (index !== null && !game.board[index]) game.placeCard(index, card, owner);
      cleanup();
    };

    const onCancel = () => cleanup();

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp, { once: true });
    document.addEventListener('pointercancel', onCancel, { once: true });
  }

  function startNewAdventure() {
    const next = makeNewPlayer(world);
    setPlayer(next);
    setLogs(logAction('開始新的冒險'));
    setScreen('menu');
  }

  function continueAdventure() {
    if (!player) startNewAdventure();
    else setScreen('menu');
  }

  function drawFromPool(pool) {
    if (!player || player.qp < pool.costQP) return;
    const card = pickByRarity(pool, world);
    if (!card) return;
    const nextPlayer = {
      ...player,
      qp: player.qp - pool.costQP,
      ownedCardIds: [...new Set([...player.ownedCardIds, card.id])],
    };
    setPlayer(nextPlayer);
    setDrawResult(card);
    setLogs(logAction('尋找夥伴', { pool: pool.name, card: card.name, costQP: pool.costQP }));
  }

  function toggleDeck(cardId) {
    if (!player) return;
    const exists = player.deckIds.includes(cardId);
    const nextDeck = exists ? player.deckIds.filter((id) => id !== cardId) : [...player.deckIds, cardId].slice(0, 5);
    setPlayer({ ...player, deckIds: nextDeck });
  }

  function saveWorldPart(key) {
    return (nextValue) => {
      const value = key === 'cards' ? normalizeCards(nextValue, DEFAULT_CARDS) : nextValue;
      setWorld((current) => ({ ...current, [key]: value }));
      setLogs(logAction(`世界編輯：更新 ${key}`));
    };
  }

  function saveTitleScreen(nextValue) {
    setWorld((current) => ({
      ...current,
      title: nextValue.title,
      titleScreen: nextValue.titleScreen,
    }));
    setLogs(logAction('世界編輯：更新 titleScreen'));
  }

  function restartBattle() {
    if (!activeStage) return;
    const rivalDeck = activeStage.opponent.deckIds.map((id) => world.cards.find((card) => card.id === id)).filter(Boolean);
    game.startGame(deckCards, rivalDeck);
    setRewardedBattle(false);
  }

  function advanceStory() {
    if (!activeStage) return;
    const scene = activeStage.story[storyIndex];
    const goNext = () => {
      storyIndex < activeStage.story.length - 1 ? setStoryIndex(storyIndex + 1) : setScreen('battle');
    };
    if (scene?.transition === '淡化') {
      setStoryTransitioning(true);
      setTimeout(() => {
        goNext();
        setTimeout(() => setStoryTransitioning(false), 420);
      }, 420);
    } else {
      goNext();
    }
  }

  function exportBackup() {
    const data = JSON.stringify({ world, player, logs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `triple-realm-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.world) setWorld(normalizeWorld(data.world));
        if (data.player) setPlayer(data.player);
        if (data.logs) {
          setLogs(data.logs);
          saveJson(LOG_KEY, data.logs);
        }
      } catch {
        alert('備份檔無法讀取。');
      }
    };
    reader.readAsText(file);
  }

  if (screen === 'opening') {
    return (
      <main className="min-h-screen bg-[#07111F] text-white">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center">
          {world.opening.background && <img src={world.opening.background} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,.18),rgba(2,6,23,.94))]" />
          {world.opening.music && <audio src={world.opening.music} autoPlay loop controls className="absolute bottom-4 left-4 z-20 max-w-[calc(100%-2rem)] opacity-80" />}
          <div className="opening-staff relative mx-auto max-w-3xl text-center" onAnimationEnd={() => setScreen('title')}>
            {world.opening.lines.map((line, index) => (
              <p key={`${line}-${index}`} className="opening-story-line mb-6 text-xl font-bold leading-relaxed md:text-2xl">{line || '\u00A0'}</p>
            ))}
          </div>
          <button onClick={() => setScreen('title')} className="pressable absolute right-5 top-5 z-20 rounded-lg border border-white/20 bg-black/35 px-4 py-2 text-sm font-bold">略過</button>
        </div>
      </main>
    );
  }

  if (screen === 'title') {
    const showLogo = titlePhase === 'logo' || titlePhase === 'prompt' || titlePhase === 'choices';
    const showPrompt = titlePhase === 'prompt';
    const showChoices = titlePhase === 'choices';
    return (
      <main className="title-screen min-h-screen text-white">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
          <button onClick={() => actionClick(() => setScreen('world'))} className="pressable absolute right-5 top-5 z-20 rounded-lg border border-white/20 bg-black/35 px-4 py-2 text-sm font-bold">世界管理</button>
          {world.titleScreen.image && <img src={world.titleScreen.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="title-cloud title-cloud-a" />
          <div className="title-cloud title-cloud-b" />
          <div className="relative flex min-h-[520px] w-full max-w-3xl flex-col items-center justify-center">
            <div className={`absolute top-0 left-1/2 w-full -translate-x-1/2 transition duration-700 ${showLogo ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
              <img src="/assets/title-logo.png" alt={world.title} className="mx-auto w-[50vw] min-w-[300px] max-w-[760px] object-contain" />
            </div>
            {showPrompt && (
              <button onClick={() => actionClick(() => setTitlePhase('choices'))} className="pressable title-start-text absolute bottom-[9%] left-1/2 -translate-x-1/2 px-10 py-5 text-6xl font-black md:text-8xl">
                點選開始冒險
              </button>
            )}
            {showChoices && (
              <div className="absolute bottom-[12%] left-1/2 mx-auto grid w-full max-w-md -translate-x-1/2 gap-3 sm:grid-cols-2">
                <button onClick={() => actionClick(startNewAdventure)} className="pressable rounded-lg bg-cyan-300 px-6 py-4 font-black text-slate-950">新的冒險</button>
                <button onClick={() => actionClick(continueAdventure)} className="pressable rounded-lg border border-white/20 bg-white/5 px-6 py-4 font-black">繼續冒險</button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!player && screen !== 'world') {
    return null;
  }

  if (screen === 'menu') {
    return (
      <MainMenu
        player={player}
        world={world}
        onNavigate={(target) => target === 'battle' ? alert('對戰功能目前正在規劃中。') : setScreen(target)}
      />
    );
  }

  if (screen === 'deck') {
    return (
      <DeckScreen
        world={world}
        player={player}
        onBack={() => actionClick(() => setScreen('menu'), 'cancel')}
        toggleDeck={toggleDeck}
      />
    );
  }

  if (screen === 'trainer') {
    return (
      <TrainerSettings
        player={player}
        world={world}
        onBack={() => actionClick(() => setScreen('menu'), 'cancel')}
        onSave={(nextPlayer) => {
          setPlayer(nextPlayer);
          setLogs(logAction('更新訓練師設定', { trainer: nextPlayer.trainer }));
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'gacha') {
    return (
      <Shell title="尋找夥伴" player={player} setScreen={setScreen}>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Panel title="卡池列表">
            <div className="grid gap-4 md:grid-cols-2">
              {world.cardPools.filter((pool) => pool.active).map((pool) => (
                <div key={pool.id} className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <div className="mb-4 aspect-[16/9] overflow-hidden rounded-lg bg-cyan-950/50">
                    {pool.image ? <img src={pool.image} alt={pool.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl font-black text-cyan-100/60">{pool.name}</div>}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{pool.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">消耗 {pool.costQP} QP</p>
                    </div>
                    <button disabled={player.qp < pool.costQP} onClick={() => drawFromPool(pool)} className="rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">尋找</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                    {RARITIES.map((rarity) => <span key={rarity} className="rounded border border-white/10 px-2 py-1">{rarity} {pool.rarityRates[rarity] || 0}%</span>)}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="抽取結果">
            {drawResult ? (
              <div className="text-center">
                <div className="mx-auto h-[252px] w-[188px]"><Card card={drawResult} disabled /></div>
                <div className="mt-4 text-2xl font-black">{drawResult.name}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{drawResult.description}</p>
              </div>
            ) : <p className="text-sm leading-6 text-slate-400">選擇一個卡池後，消耗 QP 尋找新的怪獸卡夥伴。</p>}
          </Panel>
        </div>
      </Shell>
    );
  }

  if (screen === 'adventure') {
    return (
      <main className="adventure-map-screen min-h-screen p-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-black tracking-[.45em] text-emerald-900">ADVENTURE BOOK</div>
            <h1 className="text-4xl font-black text-slate-900">冒險之書</h1>
          </div>
          <button onClick={() => actionClick(() => setScreen('menu'), 'cancel')} className="pressable rounded-lg border border-slate-700/30 bg-white/80 px-5 py-3 font-black text-slate-900">返回</button>
        </div>
        <div className="map-frame">
          <div className="map-path" />
          {world.stages.map((stage, index) => {
            const done = player.completedStageIds.includes(stage.id);
            return (
              <button
                key={stage.id}
                onClick={() => { setActiveStage(stage); setStoryIndex(0); setScreen('story'); }}
                className={`pressable map-node map-node-${index % 6} ${done ? 'done' : ''}`}
              >
                <div className="map-node-icon">{index + 1}</div>
                <div className="map-node-label">{stage.name}</div>
                <div className="map-node-sub">{stage.type}</div>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  if (screen === 'story' && activeStage) {
    const scene = activeStage.story[storyIndex];
    return (
      <main className="min-h-screen bg-[#06101A] text-white">
        <div className="relative flex min-h-screen items-end overflow-hidden">
          {scene.background && <img src={scene.background} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,.3),rgba(3,7,18,.96))]" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-6 p-5 md:grid-cols-[260px_1fr]">
            <div className="flex min-h-72 items-end justify-center rounded-lg border border-white/10 bg-white/5 p-4">
              {scene.portrait ? <img src={scene.portrait} alt={scene.speaker} className="max-h-72 object-contain" /> : <div className="text-7xl font-black text-cyan-100/50">{scene.speaker.slice(0, 1)}</div>}
            </div>
            <div className="rounded-lg border border-white/10 bg-black/75 p-5">
              <div className="mb-3 text-xl font-black text-cyan-200">{scene.speaker}</div>
              <p className="min-h-28 text-2xl font-bold leading-relaxed">{scene.text}</p>
              <button
                onClick={advanceStory}
                className="mt-6 rounded-lg bg-cyan-300 px-6 py-3 font-black text-slate-950"
              >
                {storyIndex < activeStage.story.length - 1 ? '繼續劇情' : '開始戰鬥'}
              </button>
            </div>
          </div>
          {storyTransitioning && <div className="story-fade-cover absolute inset-0 z-50 bg-white" />}
        </div>
      </main>
    );
  }

  if (screen === 'battle' && activeStage) {
    const rewardLabel = game.score.player1 > game.score.player2 ? rewardText(world, activeStage.rewards) : '沒有獲得獎勵，再挑戰一次吧。';
    return (
      <main className="min-h-screen bg-[#050810] text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
          <header className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <div className="text-[10px] font-bold tracking-[.55em] text-cyan-300">BATTLE</div>
              <h1 className="text-3xl font-black md:text-5xl">{activeStage.name}</h1>
              <p className="mt-2 text-sm text-slate-400">對手：{activeStage.opponent.name}</p>
            </div>
            <button onClick={() => setScreen('adventure')} className="rounded-lg border border-white/10 px-4 py-3">離開戰鬥</button>
          </header>
          <ScoreBoard score={game.score} currentPlayer={game.currentPlayer} />
          <div className="grid items-start gap-6 xl:grid-cols-[330px_minmax(500px,590px)_330px] xl:justify-center">
            <Hand player={1} title={player.trainer.name} cards={game.player1Hand} currentPlayer={game.currentPlayer} onDragStart={beginDrag} hideCardNames />
            <GameBoard board={game.board} hoverIndex={hoverIndex} hideCardNames />
            <Hand player={2} title={activeStage.opponent.name} cards={game.player2Hand} currentPlayer={game.currentPlayer} onDragStart={beginDrag} hideCardNames />
          </div>
        </div>
        {drag && <div className="pointer-events-none fixed z-[9999] h-[126px] w-[94px] -translate-x-1/2 -translate-y-1/2 rotate-2 scale-105 opacity-90" style={{ left: ghostPosition.x, top: ghostPosition.y }}><Card card={drag.card} owner={drag.owner} compact disabled hideName /></div>}
        {game.gameOver && <GameOverModal score={game.score} rewardLabel={rewardLabel} onRestart={restartBattle} onExit={() => setScreen('menu')} />}
      </main>
    );
  }

  if (screen === 'world') {
    const editorMap = {
      cards: {
        title: '怪獸卡編輯器',
        render: () => <MonsterCardEditor cards={world.cards} onSave={saveWorldPart('cards')} expanded />,
      },
      opening: {
        title: '開頭動畫設定',
        render: () => <OpeningEditor opening={world.opening} onSave={saveWorldPart('opening')} expanded />,
      },
      stages: {
        title: '關卡編輯器',
        render: () => <StageEditor stages={world.stages} cards={world.cards} onSave={saveWorldPart('stages')} expanded />,
      },
      title: {
        title: '標題畫面設定',
        render: () => <TitleScreenEditor title={world.title} titleScreen={world.titleScreen} onSave={saveTitleScreen} expanded />,
      },
    };
    const currentEditor = editorMap[worldEditor];

    return (
      <main className="min-h-screen bg-[#06101A] px-4 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-black tracking-[.45em] text-cyan-300">WORLD MANAGEMENT</div>
              <h1 className="mt-2 text-4xl font-black">世界管理</h1>
              <p className="mt-2 text-sm text-slate-400">單機試玩版先用本機資料與 JSON 編輯器，正式線上版再加入老師帳號與班級權限。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => actionClick(() => setScreen('title'), 'cancel')} className="pressable rounded-lg border border-white/10 px-4 py-3">回標題</button>
              <button onClick={exportBackup} className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 font-black text-slate-950"><Download className="h-4 w-4" />匯出備份</button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 py-3"><Upload className="h-4 w-4" />匯入備份<input type="file" accept="application/json" onChange={importBackup} className="hidden" /></label>
            </div>
          </header>
          {currentEditor ? (
            <div>
              <button onClick={() => actionClick(() => setWorldEditor(null), 'cancel')} className="pressable mb-4 rounded-lg border border-white/10 px-4 py-3">返回世界管理</button>
              {currentEditor.render()}
            </div>
          ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <Panel title="【世界編輯】">
              <EditorTile title="怪獸卡編輯器" onClick={() => setWorldEditor('cards')} />
              <EditorTile title="關卡編輯器" onClick={() => setWorldEditor('stages')} />
              <WorldJsonEditor id="cardPools" title="卡池編輯器" value={world.cardPools} onSave={saveWorldPart('cardPools')} />
              <EditorTile title="開頭動畫設定" onClick={() => setWorldEditor('opening')} />
              <EditorTile title="標題畫面設定" onClick={() => setWorldEditor('title')} />
              <WorldJsonEditor id="settings" title="點數設定" value={world.settings} onSave={saveWorldPart('settings')} />
              <div className="mt-4 rounded-lg border border-white/10 bg-white/[.03] p-3 text-sm text-slate-400">老師帳號與權限管理：線上版使用。</div>
            </Panel>
            <Panel title="【世界資料】">
              <DataBlock icon={UserRound} title="玩家資料查看" data={player || { note: '尚未建立玩家存檔' }} />
              <DataBlock icon={Sparkles} title="抽卡紀錄查看" data={logs.filter((log) => log.message === '尋找夥伴')} />
              <DataBlock icon={Database} title="數據圖表與班級統計" data={{ note: '單機版先顯示原始資料，線上版再做班級圖表。', ownedCards: player?.ownedCardIds.length || 0, completedStages: player?.completedStageIds.length || 0 }} />
              <DataBlock icon={Save} title="操作紀錄" data={logs} />
              <div className="mt-4 rounded-lg border border-white/10 bg-white/[.03] p-3 text-sm text-slate-400">匯出 Excel：線上版再製作完整格式；目前可先用備份 JSON 測資料保存。</div>
            </Panel>
          </div>
          )}
        </div>
      </main>
    );
  }

  return null;
}

function Shell({ title, player, setScreen, children }) {
  return (
    <main className="min-h-screen bg-[#06101A] px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-black tracking-[.45em] text-cyan-300">QQ獸世界</div>
            <h1 className="mt-2 text-4xl font-black">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">{player.trainer.name}　AP {player.ap}　QP {player.qp}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => actionClick(() => setScreen('menu'), 'cancel')} className="pressable rounded-lg border border-white/10 px-4 py-3">主選單</button>
            <button onClick={() => actionClick(() => setScreen('title'), 'cancel')} className="pressable rounded-lg border border-white/10 px-4 py-3">標題畫面</button>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

function WorldJsonEditor({ id, title, value, onSave }) {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));

  useEffect(() => {
    setDraft(JSON.stringify(value, null, 2));
  }, [value]);

  function save() {
    try {
      onSave(JSON.parse(draft));
    } catch {
      alert('JSON 格式有問題，請檢查逗號、括號與引號。');
    }
  }

  return (
    <details className="mb-3 rounded-lg border border-white/10 bg-white/[.03] p-3">
      <summary className="cursor-pointer font-black">{title}</summary>
      <textarea
        id={`world-json-${id}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="mt-3 min-h-52 w-full rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs outline-none focus:border-cyan-300"
      />
      <button onClick={save} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 font-black text-slate-950"><Save className="h-4 w-4" />儲存</button>
    </details>
  );
}

function EditorTile({ title, onClick }) {
  return (
    <button onClick={onClick} className="pressable mb-3 w-full rounded-lg border border-white/10 bg-white/[.04] p-4 text-left text-lg font-black transition hover:border-cyan-300/60 hover:bg-cyan-300/10">
      <div className="text-lg font-black">{title}</div>
    </button>
  );
}

const numberOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '★'];

function blankCard() {
  return {
    id: uid('card'),
    name: '新的怪獸卡',
    values: { top: 5, right: 5, bottom: 5, left: 5 },
    rarity: 'N',
    description: '',
    image: '',
    bgImage: '',
  };
}

function FileImageButton({ label, onLoad }) {
  function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-cyan-100 hover:border-cyan-300/70">
      {label}
      <input type="file" accept="image/*" onChange={upload} className="hidden" />
    </label>
  );
}

function FileAudioButton({ label, onLoad }) {
  function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-cyan-100 hover:border-cyan-300/70">
      {label}
      <input type="file" accept="audio/*" onChange={upload} className="hidden" />
    </label>
  );
}

function MonsterCardEditor({ cards, onSave, expanded = false }) {
  const [selectedId, setSelectedId] = useState(cards[0]?.id || null);
  const selected = cards.find((card) => card.id === selectedId) || cards[0] || blankCard();
  const [draft, setDraft] = useState(selected);

  useEffect(() => {
    const next = cards.find((card) => card.id === selectedId) || cards[0] || blankCard();
    setDraft(next);
    if (!selectedId && next.id) setSelectedId(next.id);
  }, [cards, selectedId]);

  function updateValue(side, value) {
    setDraft((card) => ({ ...card, values: { ...card.values, [side]: value === '★' ? '★' : Number(value) } }));
  }

  function saveCard() {
    const clean = { ...draft, name: draft.name.trim() || '未命名怪獸卡' };
    const exists = cards.some((card) => card.id === clean.id);
    onSave(exists ? cards.map((card) => card.id === clean.id ? clean : card) : [...cards, clean]);
    setSelectedId(clean.id);
  }

  function addCard() {
    const next = blankCard();
    onSave([...cards, next]);
    setSelectedId(next.id);
  }

  function deleteCard() {
    if (cards.length <= 1) {
      alert('至少要保留一張怪獸卡。');
      return;
    }
    if (!confirm(`確定刪除「${draft.name}」？`)) return;
    const nextCards = cards.filter((card) => card.id !== draft.id);
    onSave(nextCards);
    setSelectedId(nextCards[0]?.id || null);
  }

  return (
    <details open className={`mb-4 rounded-lg border border-white/10 bg-white/[.03] ${expanded ? 'p-5' : 'p-3'}`}>
      <summary className="cursor-pointer text-lg font-black">怪獸卡編輯器</summary>
      <div className={`mt-4 grid gap-4 ${expanded ? 'xl:grid-cols-[280px_1fr]' : 'lg:grid-cols-[220px_1fr]'}`}>
        <div>
          <button onClick={addCard} className="mb-3 w-full rounded-lg bg-cyan-300 px-4 py-2 font-black text-slate-950">新增怪獸卡</button>
          <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
            {cards.map((card) => (
              <button key={card.id} onClick={() => setSelectedId(card.id)} className={`w-full rounded-lg border p-3 text-left ${card.id === draft.id ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-black/30'}`}>
                <div className="font-black">{card.name}</div>
                <div className="text-xs text-slate-400">{card.rarity}　{card.values.top}/{card.values.right}/{card.values.bottom}/{card.values.left}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <div>
            <div className="mx-auto h-[252px] w-[188px]"><Card card={draft} disabled /></div>
            <div className="mt-3 flex flex-wrap gap-2">
              <FileImageButton label="上傳卡圖" onLoad={(image) => setDraft((card) => ({ ...card, image, bgImage: image }))} />
              <button onClick={() => setDraft((card) => ({ ...card, bgImage: '' }))} className="rounded-lg border border-white/10 px-3 py-2 text-sm">清除圖片</button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block"><div className="mb-1 text-sm text-slate-400">名稱</div><input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries({ top: '上', right: '右', bottom: '下', left: '左' }).map(([side, label]) => (
                <label key={side} className="block">
                  <div className="mb-1 text-sm text-slate-400">{label}</div>
                  <select className="field" value={String(draft.values[side])} onChange={(e) => updateValue(side, e.target.value)}>
                    {numberOptions.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <label className="block">
              <div className="mb-1 text-sm text-slate-400">稀有度</div>
              <select className="field" value={draft.rarity} onChange={(e) => setDraft({ ...draft, rarity: e.target.value })}>
                {RARITIES.map((rarity) => <option key={rarity}>{rarity}</option>)}
              </select>
            </label>
            <label className="block"><div className="mb-1 text-sm text-slate-400">敘述</div><textarea className="field min-h-28" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            <div className="flex flex-wrap gap-2">
              <button onClick={saveCard} className="rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950">儲存怪獸卡</button>
              <button onClick={deleteCard} className="rounded-lg border border-red-400/40 bg-red-500/10 px-5 py-3 font-black text-red-100">刪除</button>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function blankStoryLine() {
  return { speaker: '角色姓名', portrait: '', background: '', text: '輸入台詞內容。', transition: '無' };
}

function blankStage(cards) {
  return {
    id: uid('stage'),
    type: '主線',
    name: '新的關卡',
    story: [blankStoryLine()],
    opponent: {
      name: '電腦對手',
      image: '',
      deckIds: cards.slice(0, 5).map((card) => card.id),
    },
    rewards: { ap: 0, qp: 0, cardIds: [] },
  };
}

function StageEditor({ stages, cards, onSave, expanded = false }) {
  const [selectedId, setSelectedId] = useState(stages[0]?.id || null);
  const selected = stages.find((stage) => stage.id === selectedId) || stages[0] || blankStage(cards);
  const [draft, setDraft] = useState(selected);

  useEffect(() => {
    const next = stages.find((stage) => stage.id === selectedId) || stages[0] || blankStage(cards);
    setDraft(next);
    if (!selectedId && next.id) setSelectedId(next.id);
  }, [stages, selectedId, cards]);

  const storyLines = Array.isArray(draft.story) ? draft.story : [];

  function normalizedStage(stage) {
    return {
      ...stage,
      story: Array.isArray(stage.story) ? stage.story : [],
      opponent: {
        name: stage.opponent?.name || '電腦對手',
        image: stage.opponent?.image || '',
        deckIds: Array.isArray(stage.opponent?.deckIds) ? stage.opponent.deckIds : [],
      },
      rewards: {
        ap: Number(stage.rewards?.ap) || 0,
        qp: Number(stage.rewards?.qp) || 0,
        cardIds: Array.isArray(stage.rewards?.cardIds) ? stage.rewards.cardIds : [],
      },
    };
  }

  function saveStage() {
    const safeDraft = normalizedStage(draft);
    const clean = {
      ...safeDraft,
      name: safeDraft.name.trim() || '未命名關卡',
      story: safeDraft.story.length ? safeDraft.story : [blankStoryLine()],
      opponent: {
        ...safeDraft.opponent,
        deckIds: safeDraft.opponent.deckIds.slice(0, 5),
      },
    };
    const exists = stages.some((stage) => stage.id === clean.id);
    onSave(exists ? stages.map((stage) => stage.id === clean.id ? clean : stage) : [...stages, clean]);
    setSelectedId(clean.id);
  }

  function addStage() {
    const next = blankStage(cards);
    onSave([...stages, next]);
    setSelectedId(next.id);
  }

  function deleteStage() {
    if (stages.length <= 1) {
      alert('至少要保留一個關卡。');
      return;
    }
    if (!confirm(`確定刪除「${draft.name}」？`)) return;
    const nextStages = stages.filter((stage) => stage.id !== draft.id);
    onSave(nextStages);
    setSelectedId(nextStages[0]?.id || null);
  }

  function updateStory(index, patch) {
    setDraft((stage) => ({
      ...stage,
      story: (Array.isArray(stage.story) ? stage.story : []).map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line),
    }));
  }

  function toggleOpponentCard(cardId) {
    const deck = Array.isArray(draft.opponent?.deckIds) ? draft.opponent.deckIds : [];
    const exists = deck.includes(cardId);
    const deckIds = exists
      ? deck.filter((id) => id !== cardId)
      : [...deck, cardId].slice(0, 5);
    setDraft({ ...draft, opponent: { ...(draft.opponent || {}), deckIds } });
  }

  function toggleRewardCard(cardId) {
    const rewardCards = Array.isArray(draft.rewards?.cardIds) ? draft.rewards.cardIds : [];
    const exists = rewardCards.includes(cardId);
    const cardIds = exists ? rewardCards.filter((id) => id !== cardId) : [...rewardCards, cardId];
    setDraft({ ...draft, rewards: { ...(draft.rewards || {}), cardIds } });
  }

  return (
    <details open className={`mb-4 rounded-lg border border-white/10 bg-white/[.03] ${expanded ? 'p-5' : 'p-3'}`}>
      <summary className="cursor-pointer text-lg font-black">關卡編輯器</summary>
      <div className={`mt-4 grid gap-4 ${expanded ? 'xl:grid-cols-[300px_1fr]' : 'lg:grid-cols-[220px_1fr]'}`}>
        <div>
          <button onClick={addStage} className="mb-3 w-full rounded-lg bg-cyan-300 px-4 py-2 font-black text-slate-950">新增關卡</button>
          <div className="space-y-2">
            {stages.map((stage) => (
              <button key={stage.id} onClick={() => setSelectedId(stage.id)} className={`w-full rounded-lg border p-3 text-left ${stage.id === draft.id ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-black/30'}`}>
                <div className="font-black">{stage.name}</div>
                <div className="text-xs text-slate-400">{stage.type}　對手：{stage.opponent.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label><div className="mb-1 text-sm text-slate-400">關卡名稱</div><input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label><div className="mb-1 text-sm text-slate-400">分類</div><select className="field" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option>主線</option><option>支線</option><option>特別活動</option></select></label>
          </div>

          <section className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-black">關卡劇情</h3>
              <button onClick={() => setDraft({ ...draft, story: [...storyLines, blankStoryLine()] })} className="rounded-lg border border-white/10 px-3 py-2 text-sm">新增台詞</button>
            </div>
            <div className="space-y-2">
              {storyLines.map((line, index) => (
                <div key={index} className="rounded-lg border border-white/10 bg-white/[.03] p-2 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-bold">第 {index + 1} 句</div>
                    <button onClick={() => setDraft({ ...draft, story: storyLines.filter((_, lineIndex) => lineIndex !== index) })} className="text-xs text-red-200">刪除</button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_140px_220px]">
                    <label><div className="mb-1 text-xs text-slate-400">人物姓名</div><input className="field compact-field" value={line.speaker} onChange={(e) => updateStory(index, { speaker: e.target.value })} /></label>
                    <label><div className="mb-1 text-xs text-slate-400">下一句轉場</div><select className="field compact-field" value={line.transition || '無'} onChange={(e) => updateStory(index, { transition: e.target.value })}><option>無</option><option>淡化</option></select></label>
                    <div className="flex items-end gap-2">
                      <FileImageButton label="人物圖檔" onLoad={(image) => updateStory(index, { portrait: image })} />
                      <FileImageButton label="背景圖片" onLoad={(image) => updateStory(index, { background: image })} />
                    </div>
                  </div>
                  {(line.portrait || line.background) && (
                    <div className="mt-2 flex gap-2">
                      {line.portrait && <img src={line.portrait} alt="人物預覽" className="h-16 w-16 rounded border border-white/10 object-cover" />}
                      {line.background && <img src={line.background} alt="背景預覽" className="h-16 w-28 rounded border border-white/10 object-cover" />}
                    </div>
                  )}
                  <label className="mt-2 block"><div className="mb-1 text-xs text-slate-400">台詞內容</div><textarea className="field compact-field min-h-20" value={line.text} onChange={(e) => updateStory(index, { text: e.target.value })} /></label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-black/20 p-3">
            <h3 className="mb-3 font-black">電腦對手</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label><div className="mb-1 text-sm text-slate-400">對手姓名</div><input className="field" value={draft.opponent?.name || ''} onChange={(e) => setDraft({ ...draft, opponent: { ...(draft.opponent || {}), name: e.target.value } })} /></label>
              <div className="flex items-end"><FileImageButton label="上傳對手圖片" onLoad={(image) => setDraft({ ...draft, opponent: { ...(draft.opponent || {}), image } })} /></div>
            </div>
            <div className="mt-3 text-sm text-slate-400">對手牌組：{(draft.opponent?.deckIds || []).length} / 5</div>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
              {cards.map((card) => (
                <button key={card.id} onClick={() => toggleOpponentCard(card.id)} className={`pressable rounded-lg border px-3 py-2 text-left text-sm ${(draft.opponent?.deckIds || []).includes(card.id) ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-black/30'}`}>{card.name}</button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-black/20 p-3">
            <h3 className="mb-3 font-black">勝利獎勵</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label><div className="mb-1 text-sm text-slate-400">AP</div><input type="number" className="field" value={draft.rewards?.ap || 0} onChange={(e) => setDraft({ ...draft, rewards: { ...(draft.rewards || {}), ap: Number(e.target.value) || 0 } })} /></label>
              <label><div className="mb-1 text-sm text-slate-400">QP</div><input type="number" className="field" value={draft.rewards?.qp || 0} onChange={(e) => setDraft({ ...draft, rewards: { ...(draft.rewards || {}), qp: Number(e.target.value) || 0 } })} /></label>
            </div>
            <div className="mt-3 text-sm text-slate-400">獎勵卡牌</div>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
              {cards.map((card) => (
                <button key={card.id} onClick={() => toggleRewardCard(card.id)} className={`pressable rounded-lg border px-3 py-2 text-left text-sm ${(draft.rewards?.cardIds || []).includes(card.id) ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-black/30'}`}>{card.name}</button>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <button onClick={saveStage} className="rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950">儲存關卡</button>
            <button onClick={deleteStage} className="rounded-lg border border-red-400/40 bg-red-500/10 px-5 py-3 font-black text-red-100">刪除關卡</button>
          </div>
        </div>
      </div>
    </details>
  );
}

function OpeningEditor({ opening, onSave, expanded = false }) {
  const [draft, setDraft] = useState(opening);

  useEffect(() => setDraft(opening), [opening]);

  return (
    <details open className={`mb-4 rounded-lg border border-white/10 bg-white/[.03] ${expanded ? 'p-5' : 'p-3'}`}>
      <summary className="cursor-pointer text-lg font-black">開頭動畫設定</summary>
      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {draft.background ? <img src={draft.background} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-400">尚未設定背景圖片</div>}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <FileImageButton label="上傳背景圖片" onLoad={(image) => setDraft({ ...draft, background: image })} />
            <FileAudioButton label="上傳背景音樂" onLoad={(music) => setDraft({ ...draft, music })} />
            <button onClick={() => setDraft({ ...draft, background: '' })} className="rounded-lg border border-white/10 px-3 py-2 text-sm">清除背景</button>
            <button onClick={() => setDraft({ ...draft, music: '' })} className="rounded-lg border border-white/10 px-3 py-2 text-sm">清除音樂</button>
          </div>
          <label className="block">
            <div className="mb-1 text-sm text-slate-400">開頭文字（每行一段）</div>
            <textarea className="field min-h-40" value={(draft.lines || []).join('\n')} onChange={(e) => setDraft({ ...draft, lines: e.target.value.split('\n') })} />
          </label>
          <button onClick={() => onSave(draft)} className="rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950">儲存開頭動畫</button>
        </div>
      </div>
    </details>
  );
}

function TitleScreenEditor({ title, titleScreen, onSave, expanded = false }) {
  const [draft, setDraft] = useState({ title, titleScreen });

  useEffect(() => setDraft({ title, titleScreen }), [title, titleScreen]);

  return (
    <details open className={`mb-4 rounded-lg border border-white/10 bg-white/[.03] ${expanded ? 'p-5' : 'p-3'}`}>
      <summary className="cursor-pointer text-lg font-black">標題畫面設定</summary>
      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {draft.titleScreen.image ? <img src={draft.titleScreen.image} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-400">尚未設定標題圖片</div>}
        </div>
        <div className="space-y-3">
          <label className="block"><div className="mb-1 text-sm text-slate-400">世界名稱</div><input className="field" value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          {draft.titleScreen.logo && <div className="rounded-lg border border-white/10 bg-black/30 p-4"><img src={draft.titleScreen.logo} alt="LOGO 預覽" className="mx-auto max-h-36 object-contain" /></div>}
          <div className="flex flex-wrap gap-2">
            <FileImageButton label="上傳標題背景" onLoad={(image) => setDraft({ ...draft, titleScreen: { ...draft.titleScreen, image } })} />
            <FileImageButton label="上傳 LOGO 圖案" onLoad={(logo) => setDraft({ ...draft, titleScreen: { ...draft.titleScreen, logo } })} />
            <button onClick={() => setDraft({ ...draft, titleScreen: { ...draft.titleScreen, image: '' } })} className="rounded-lg border border-white/10 px-3 py-2 text-sm">清除背景</button>
            <button onClick={() => setDraft({ ...draft, titleScreen: { ...draft.titleScreen, logo: '' } })} className="rounded-lg border border-white/10 px-3 py-2 text-sm">清除 LOGO</button>
          </div>
          <button onClick={() => onSave(draft)} className="rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950">儲存標題畫面</button>
        </div>
      </div>
    </details>
  );
}

function DataBlock({ icon: Icon, title, data }) {
  return (
    <details className="mb-3 rounded-lg border border-white/10 bg-white/[.03] p-3">
      <summary className="flex cursor-pointer items-center gap-2 font-black"><Icon className="h-4 w-4 text-cyan-200" />{title}</summary>
      <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black/50 p-3 text-xs text-slate-300">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}
