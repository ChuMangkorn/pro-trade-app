
import { atomWithStorage } from 'jotai/utils';

export const favoriteTickersAtom = atomWithStorage<Set<string>>('tickerFavorites', new Set(), {
  getItem: (key) => {
    const val = localStorage.getItem(key);
    return val ? new Set(JSON.parse(val)) : new Set();
  },
  setItem: (key, value) => {
    localStorage.setItem(key, JSON.stringify(Array.from(value)));
  },
});
