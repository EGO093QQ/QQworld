import { DEFAULT_CARDS } from '../data/cards';
import { normalizeCards } from '../data/cardSchema';
import { loadJson, saveJson } from './jsonStorage';

const STORAGE_KEY = 'triple-realm-v3-cards';

export function loadCards() {
  return normalizeCards(loadJson(STORAGE_KEY, DEFAULT_CARDS), DEFAULT_CARDS);
}

export function saveCards(cards) {
  return saveJson(STORAGE_KEY, normalizeCards(cards, DEFAULT_CARDS));
}
