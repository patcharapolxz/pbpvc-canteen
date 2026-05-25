'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  nick: string;
  phone: string;
  role: 'Student' | 'Merchant' | 'Admin';
  shop: string;
  email: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  options: { name: string; price?: number }[];
  note?: string;
  img?: string;
}

interface AppState {
  user: User | null;
  cart: CartItem[];
  cartShop: string;
  setUser: (u: User | null) => void;
  logout: () => void;
  addToCart: (item: CartItem, shop: string) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      cartShop: '',

      setUser: (u) => set({ user: u }),

      logout: () => set({ user: null, cart: [], cartShop: '' }),

      addToCart: (item, shop) => {
        const { cart, cartShop } = get();
        // If different shop, reset cart
        if (cartShop && cartShop !== shop) {
          set({ cart: [{ ...item, qty: 1 }], cartShop: shop });
          return;
        }
        const existing = cart.find((c) => c.id === item.id);
        if (existing) {
          set({ cart: cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)), cartShop: shop });
        } else {
          set({ cart: [...cart, { ...item, qty: 1 }], cartShop: shop });
        }
      },

      removeFromCart: (id) => set({ cart: get().cart.filter((c) => c.id !== id) }),

      updateQty: (id, qty) => {
        if (qty <= 0) {
          set({ cart: get().cart.filter((c) => c.id !== id) });
        } else {
          set({ cart: get().cart.map((c) => (c.id === id ? { ...c, qty } : c)) });
        }
      },

      clearCart: () => set({ cart: [], cartShop: '' }),

      cartTotal: () => get().cart.reduce((sum, c) => sum + c.price * c.qty, 0),
    }),
    {
      name: 'pbpvc-canteen-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export const getPersistedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pbpvc-canteen-store');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.user || null;
  } catch {
    return null;
  }
};

