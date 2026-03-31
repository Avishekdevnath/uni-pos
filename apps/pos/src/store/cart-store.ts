import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type CartPhase = 'cart' | 'processing' | 'receipt';

export interface CartTotals {
  itemCount: number;
  subtotal: number;
}

interface CartStore {
  items: CartItem[];
  phase: CartPhase;
  completedOrderId: string | null;
  selectedCustomerId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setPhase: (phase: CartPhase) => void;
  setCompletedOrderId: (id: string) => void;
  setCustomer: (id: string | null) => void;
  getTotals: () => CartTotals;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  phase: 'cart',
  completedOrderId: null,
  selectedCustomerId: null,

  addItem: (incoming) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === incoming.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === incoming.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, incoming] };
    }),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

  updateQty: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) return { items: state.items.filter((i) => i.productId !== productId) };
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i,
        ),
      };
    }),

  clearCart: () => set({ items: [], phase: 'cart', completedOrderId: null, selectedCustomerId: null }),

  setPhase: (phase) => set({ phase }),

  setCompletedOrderId: (id) => set({ completedOrderId: id }),

  setCustomer: (id) => set({ selectedCustomerId: id }),

  getTotals: () => {
    const { items } = get();
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return { itemCount, subtotal };
  },
}));
