import { DIRECTIONS } from './constants';

export const createEmptyBoard = () => Array(9).fill(null);

export function valueRank(value) {
  return value === '★' ? 10 : Number(value);
}

export function applyBasicFlips(board, placedIndex, owner) {
  const next = board.map((slot) => (slot ? { ...slot, animation: '' } : slot));
  const placed = next[placedIndex];
  if (!placed) return next;

  const row = Math.floor(placedIndex / 3);
  const col = placedIndex % 3;

  for (const direction of DIRECTIONS) {
    const targetRow = row + direction.row;
    const targetCol = col + direction.col;
    if (targetRow < 0 || targetRow > 2 || targetCol < 0 || targetCol > 2) continue;

    const targetIndex = targetRow * 3 + targetCol;
    const target = next[targetIndex];
    if (!target || target.owner === owner) continue;

    const attackerValue = valueRank(placed.card.values[direction.mySide]);
    const defenderValue = valueRank(target.card.values[direction.enemySide]);

    if (attackerValue > defenderValue) {
      next[targetIndex] = { ...target, owner, animation: 'flip' };
    }
  }

  return next;
}

export function getScore(board) {
  return board.reduce(
    (score, slot) => {
      if (slot?.owner === 1) score.player1 += 1;
      if (slot?.owner === 2) score.player2 += 1;
      return score;
    },
    { player1: 0, player2: 0 },
  );
}
