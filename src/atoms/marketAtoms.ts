
import { atomWithStorage } from 'jotai/utils';

export type MarketItem = {
  symbol: string;
  base: string;
  quote: string;
  volume: number;
  change: number;
  price: number;
};

export const marketListAtom = atomWithStorage<MarketItem[]>('market-list', []);
export const hasMoreAtom = atom(true);
