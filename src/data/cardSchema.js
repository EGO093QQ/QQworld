const DEFAULT_VALUE = 1;

export const CARD_SIDES = ['top', 'right', 'bottom', 'left'];

function normalizeValue(value) {
  if (value === '★') return '★';
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_VALUE;
  return Math.max(1, Math.min(10, number));
}

export function normalizeCard(card = {}, index = 0) {
  const sourceValues = card.values || {};
  const image = card.image || card.bgImage || '';

  return {
    ...card,
    id: card.id || `card-${index + 1}`,
    name: String(card.name || '未命名怪獸卡'),
    image,
    // bgImage is kept temporarily so existing saves and components remain compatible.
    bgImage: image,
    values: Object.fromEntries(
      CARD_SIDES.map((side) => [side, normalizeValue(card[side] ?? sourceValues[side])]),
    ),
  };
}

export function normalizeCards(cards, fallback = []) {
  const source = Array.isArray(cards) && cards.length ? cards : fallback;
  return source.map((card, index) => normalizeCard(card, index));
}
