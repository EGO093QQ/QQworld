import { useState } from 'react';
import { Card } from '../components/Card';

export function DeckScreen({ world, player, onBack, toggleDeck }) {
  const [selectedCardId, setSelectedCardId] = useState(player.deckIds[0] || world.cards[0]?.id);
  const selectedCard = world.cards.find((card) => card.id === selectedCardId) || world.cards[0];
  const deckCards = player.deckIds.map((id) => world.cards.find((card) => card.id === id)).filter(Boolean);

  return (
    <main className="deck-screen min-h-screen p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-black tracking-[.45em] text-cyan-300">DECK EDIT</div>
          <h1 className="text-4xl font-black">牌組編輯</h1>
        </div>
        <button onClick={onBack} className="pressable rounded-lg border border-white/20 bg-black/40 px-5 py-3 font-black">返回</button>
      </div>
      <div className="deck-layout">
        <aside className="deck-panel deck-detail">
          {selectedCard && (
            <>
              <div className="mx-auto mb-4 h-[252px] w-[188px]"><Card card={selectedCard} disabled /></div>
              <div className="mb-2 text-2xl font-black">{selectedCard.name}</div>
              <div className="mb-3 inline-block rounded bg-cyan-300 px-3 py-1 text-sm font-black text-slate-950">{selectedCard.rarity}</div>
              <div className="mb-3 grid grid-cols-4 gap-2 text-center text-lg font-black">
                <div>上<br />{selectedCard.values.top}</div>
                <div>右<br />{selectedCard.values.right}</div>
                <div>下<br />{selectedCard.values.bottom}</div>
                <div>左<br />{selectedCard.values.left}</div>
              </div>
              <p className="text-sm leading-6 text-slate-200">{selectedCard.description}</p>
            </>
          )}
        </aside>
        <section className="deck-panel">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-black">牌庫</h2>
            <div className="rounded bg-lime-300 px-3 py-1 text-sm font-black text-slate-950">{world.cards.length} 張</div>
          </div>
          <div className="deck-card-grid">
            {world.cards.map((card) => (
              <button key={card.id} onClick={() => { setSelectedCardId(card.id); toggleDeck(card.id); }} className={`deck-card-button ${player.deckIds.includes(card.id) ? 'selected' : ''}`}>
                <Card card={card} disabled compact />
              </button>
            ))}
          </div>
        </section>
        <aside className="deck-panel">
          <h2 className="mb-3 text-2xl font-black">現在的牌組</h2>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => {
              const card = deckCards[index];
              return (
                <div key={index} className="deck-slot">
                  {card ? (
                    <button onClick={() => { setSelectedCardId(card.id); toggleDeck(card.id); }} className="flex items-center gap-3 text-left">
                      <div className="h-[84px] w-[63px]"><Card card={card} disabled compact /></div>
                      <div>
                        <div className="font-black">{card.name}</div>
                        <div className="text-xs text-slate-400">{card.values.top}/{card.values.right}/{card.values.bottom}/{card.values.left}</div>
                      </div>
                    </button>
                  ) : <div className="py-7 text-center text-slate-500">空格</div>}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
