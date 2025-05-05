// store/useWatchlist.js
import { create } from 'zustand';

export const useWatchlist = create((set) => ({
    coins: ['bitcoin'], // estado inicial con “bitcoin”
    addCoin: (id) =>
        set((state) => ({
        coins: state.coins.includes(id)
            ? state.coins
            : [...state.coins, id],
        })),
    removeCoin: (id) =>
        set((state) => ({
        coins: state.coins.filter((c) => c !== id),
    })),
}));
