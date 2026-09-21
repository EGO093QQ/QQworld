const DEFAULT_VALUE = 1;

export const CARD_SIDES = ['top', 'right', 'bottom', 'left'];

function normalizeValue(value) {
  if (value === '★') return '★';
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_VALUE;
  return Math.max(1, Math.min(10, number));
}

export function normalizeCard(card = {}, index = 0) {
  const source = card && typeof card === 'object' ? card : {};
  const sourceValues = source.values && typeof source.values === 'object' ? source.values : {};
  const image = source.image || source.bgImage || '';

  return {
    ...source,
    id: source.id || `card-${index + 1}`,
    name: String(source.name || '未命名怪獸卡'),
    image,
    // bgImage is kept temporarily so existing saves and components remain compatible.
    bgImage: image,
    values: Object.fromEntries(
      CARD_SIDES.map((side) => [side, normalizeValue(source[side] ?? sourceValues[side])]),
    ),
  };
}

export function normalizeCards(cards, fallback = []) {
  const source = Array.isArray(cards) && cards.length ? cards : fallback;
  return source.map((card, index) => normalizeCard(card, index));
}
