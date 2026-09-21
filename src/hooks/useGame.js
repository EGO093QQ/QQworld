import { useCallback, useMemo, useState } from 'react';
import { PLAYER_ONE, PLAYER_TWO } from '../game/constants';
import { applyBasicFlips, createEmptyBoard, getScore } from '../game/rulesEngine';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const withHandId = (card, prefix, index) => ({ ...card, _handId: `${prefix}-${index}-${Date.now()}-${Math.random()}` });

function buildHand(cards, prefix) {
  const source = [...cards];
  while (source.length < 5) source.push(...cards);
  return source.slice(0, 5).map((card, index) => withHandId(card, prefix, index));
}

export function useGame(cards) {
  const [board, setBoard] = useState(createEmptyBoard);
  const [player1Hand, setPlayer1Hand] = useState([]);
  const [player2Hand, setPlayer2Hand] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_ONE);
  const [gameOver, setGameOver] = useState(false);

  const startGame = useCallback((playerDeck, opponentDeck) => {
    const playerCards = playerDeck?.length ? playerDeck : shuffle(cards).slice(0, 5);
    const rivalCards = opponentDeck?.length ? opponentDeck : shuffle(cards).slice(0, 5);
    if (!playerCards.length || !rivalCards.length) return;
    setPlayer1Hand(buildHand(playerCards, 'p1'));
    setPlayer2Hand(buildHand(rivalCards, 'p2'));
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER_ONE);
    setGameOver(false);
  }, [cards]);

  const placeCard = useCallback((index, card, owner) => {
    if (owner !== currentPlayer || board[index] || gameOver) return false;

    const placedBoard = board.map((slot) => (slot ? { ...slot, animation: '' } : slot));
    placedBoard[index] = { card, owner, animation: 'drop' };
    const resolvedBoard = applyBasicFlips(placedBoard, index, owner);
    resolvedBoard[index] = { ...resolvedBoard[index], animation: 'drop' };
    setBoard(resolvedBoard);

    if (owner === PLAYER_ONE) setPlayer1Hand((hand) => hand.filter((x) => x._handId !== card._handId));
    else setPlayer2Hand((hand) => hand.filter((x) => x._handId !== card._handId));

    if (resolvedBoard.filter(Boolean).length === 9) setGameOver(true);
    else setCurrentPlayer(owner === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE);
    return true;
  }, [board, currentPlayer, gameOver]);

  const score = useMemo(() => getScore(board), [board]);

  return { board, player1Hand, player2Hand, currentPlayer, gameOver, score, startGame, placeCard };
}
