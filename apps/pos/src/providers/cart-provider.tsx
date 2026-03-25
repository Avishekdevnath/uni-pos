import { createContext, useMemo, useReducer, type ReactNode } from 'react';

export type PosPhase = 'cart' | 'checkout' | 'processing' | 'receipt';

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface CartState {
  items: CartItem[];
  phase: PosPhase;
  completedOrderId: string | null;
}

export type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'SET_PHASE'; phase: PosPhase }
  | { type: 'SET_COMPLETED_ORDER'; orderId: string | null }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  phase: 'cart',
  completedOrderId: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((item) => item.productId === action.item.productId);
      if (!existing) {
        return { ...state, items: [...state.items, action.item] };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.item.productId
            ? { ...item, quantity: item.quantity + action.item.quantity }
            : item,
        ),
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.productId !== action.productId) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.productId === action.productId ? { ...item, quantity: action.quantity } : item,
          )
          .filter((item) => item.quantity > 0),
      };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SET_COMPLETED_ORDER':
      return { ...state, completedOrderId: action.orderId };
    case 'CLEAR_CART':
      return { ...state, items: [], phase: 'cart', completedOrderId: null };
    default:
      return state;
  }
}

interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totals: {
    itemCount: number;
    subtotal: number;
  };
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const totals = useMemo(() => {
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = state.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return { itemCount, subtotal };
  }, [state.items]);

  return <CartContext.Provider value={{ state, dispatch, totals }}>{children}</CartContext.Provider>;
}
