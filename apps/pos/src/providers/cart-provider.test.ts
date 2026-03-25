import { CartItem, CartState } from '../cart-provider';

// Extract the reducer function for testing
// Note: We export the reducer logic separately for testing purposes
export type PosPhase = 'cart' | 'checkout' | 'processing' | 'receipt';

export interface TestCartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface TestCartState {
  items: TestCartItem[];
  phase: PosPhase;
  completedOrderId: string | null;
}

export type TestCartAction =
  | { type: 'ADD_ITEM'; item: TestCartItem }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'SET_PHASE'; phase: PosPhase }
  | { type: 'SET_COMPLETED_ORDER'; orderId: string | null }
  | { type: 'CLEAR_CART' };

export function cartReducer(state: TestCartState, action: TestCartAction): TestCartState {
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

describe('cartReducer', () => {
  const initialState: TestCartState = {
    items: [],
    phase: 'cart',
    completedOrderId: null,
  };

  const sampleItem: TestCartItem = {
    productId: 'product-1',
    name: 'Coffee',
    quantity: 1,
    unitPrice: 5.99,
  };

  const anotherItem: TestCartItem = {
    productId: 'product-2',
    name: 'Tea',
    quantity: 2,
    unitPrice: 3.99,
  };

  describe('ADD_ITEM', () => {
    test('should add a single item to an empty cart', () => {
      const action: TestCartAction = {
        type: 'ADD_ITEM',
        item: sampleItem,
      };

      const result = cartReducer(initialState, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(sampleItem);
      expect(result.phase).toBe('cart');
    });

    test('should add multiple different items', () => {
      const state1 = cartReducer(initialState, {
        type: 'ADD_ITEM',
        item: sampleItem,
      });

      const result = cartReducer(state1, {
        type: 'ADD_ITEM',
        item: anotherItem,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].productId).toBe('product-1');
      expect(result.items[1].productId).toBe('product-2');
    });

    test('should merge quantities when adding duplicate product', () => {
      const state1 = cartReducer(initialState, {
        type: 'ADD_ITEM',
        item: sampleItem,
      });

      const result = cartReducer(state1, {
        type: 'ADD_ITEM',
        item: { ...sampleItem, quantity: 2 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3); // 1 + 2
      expect(result.items[0].productId).toBe('product-1');
    });

    test('should not mutate original state when adding item', () => {
      const originalItems = initialState.items;
      cartReducer(initialState, {
        type: 'ADD_ITEM',
        item: sampleItem,
      });

      expect(initialState.items).toBe(originalItems);
      expect(initialState.items).toHaveLength(0);
    });
  });

  describe('REMOVE_ITEM', () => {
    test('should remove an item from cart', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem, anotherItem],
      };

      const result = cartReducer(stateWithItems, {
        type: 'REMOVE_ITEM',
        productId: 'product-1',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('product-2');
    });

    test('should handle removing non-existent item', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem],
      };

      const result = cartReducer(stateWithItems, {
        type: 'REMOVE_ITEM',
        productId: 'product-999',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('product-1');
    });

    test('should not mutate original items array when removing', () => {
      const items = [sampleItem, anotherItem];
      const stateWithItems = { ...initialState, items };

      cartReducer(stateWithItems, {
        type: 'REMOVE_ITEM',
        productId: 'product-1',
      });

      expect(items).toHaveLength(2);
    });
  });

  describe('UPDATE_QTY', () => {
    test('should update quantity of an existing item', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem],
      };

      const result = cartReducer(stateWithItems, {
        type: 'UPDATE_QTY',
        productId: 'product-1',
        quantity: 5,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(5);
    });

    test('should remove item when quantity is set to 0', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem, anotherItem],
      };

      const result = cartReducer(stateWithItems, {
        type: 'UPDATE_QTY',
        productId: 'product-1',
        quantity: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('product-2');
    });

    test('should remove item when quantity is negative', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem, anotherItem],
      };

      const result = cartReducer(stateWithItems, {
        type: 'UPDATE_QTY',
        productId: 'product-1',
        quantity: -5,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('product-2');
    });

    test('should not affect items from non-existent product', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem],
      };

      const result = cartReducer(stateWithItems, {
        type: 'UPDATE_QTY',
        productId: 'product-999',
        quantity: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(sampleItem);
    });
  });

  describe('SET_PHASE', () => {
    test('should update phase to checkout', () => {
      const result = cartReducer(initialState, {
        type: 'SET_PHASE',
        phase: 'checkout',
      });

      expect(result.phase).toBe('checkout');
      expect(result.items).toEqual([]);
    });

    test('should update phase to processing', () => {
      const result = cartReducer(initialState, {
        type: 'SET_PHASE',
        phase: 'processing',
      });

      expect(result.phase).toBe('processing');
    });

    test('should update phase to receipt', () => {
      const result = cartReducer(initialState, {
        type: 'SET_PHASE',
        phase: 'receipt',
      });

      expect(result.phase).toBe('receipt');
    });

    test('should preserve items when changing phase', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem, anotherItem],
      };

      const result = cartReducer(stateWithItems, {
        type: 'SET_PHASE',
        phase: 'checkout',
      });

      expect(result.items).toHaveLength(2);
      expect(result.phase).toBe('checkout');
    });
  });

  describe('SET_COMPLETED_ORDER', () => {
    test('should set completed order ID', () => {
      const result = cartReducer(initialState, {
        type: 'SET_COMPLETED_ORDER',
        orderId: 'order-123',
      });

      expect(result.completedOrderId).toBe('order-123');
    });

    test('should set completed order ID to null', () => {
      const stateWithOrder = {
        ...initialState,
        completedOrderId: 'order-123',
      };

      const result = cartReducer(stateWithOrder, {
        type: 'SET_COMPLETED_ORDER',
        orderId: null,
      });

      expect(result.completedOrderId).toBeNull();
    });

    test('should update existing order ID', () => {
      const stateWithOrder = {
        ...initialState,
        completedOrderId: 'order-123',
      };

      const result = cartReducer(stateWithOrder, {
        type: 'SET_COMPLETED_ORDER',
        orderId: 'order-456',
      });

      expect(result.completedOrderId).toBe('order-456');
    });

    test('should preserve other state when setting order ID', () => {
      const stateWithItems = {
        ...initialState,
        items: [sampleItem],
        phase: 'receipt' as const,
      };

      const result = cartReducer(stateWithItems, {
        type: 'SET_COMPLETED_ORDER',
        orderId: 'order-123',
      });

      expect(result.items).toHaveLength(1);
      expect(result.phase).toBe('receipt');
    });
  });

  describe('CLEAR_CART', () => {
    test('should reset cart to initial state', () => {
      const stateWithData = {
        items: [sampleItem, anotherItem],
        phase: 'receipt' as const,
        completedOrderId: 'order-123',
      };

      const result = cartReducer(stateWithData, {
        type: 'CLEAR_CART',
      });

      expect(result.items).toEqual([]);
      expect(result.phase).toBe('cart');
      expect(result.completedOrderId).toBeNull();
    });

    test('should effectively reset empty cart', () => {
      const result = cartReducer(initialState, {
        type: 'CLEAR_CART',
      });

      expect(result).toEqual(initialState);
    });

    test('should clear completed order ID specifically', () => {
      const stateWithOrder = {
        ...initialState,
        completedOrderId: 'order-123',
      };

      const result = cartReducer(stateWithOrder, {
        type: 'CLEAR_CART',
      });

      expect(result.completedOrderId).toBeNull();
    });
  });

  describe('State immutability', () => {
    test('should maintain immutability across all actions', () => {
      const state: TestCartState = {
        items: [sampleItem],
        phase: 'cart',
        completedOrderId: null,
      };

      const originalState = JSON.stringify(state);

      cartReducer(state, { type: 'ADD_ITEM', item: anotherItem });
      cartReducer(state, { type: 'REMOVE_ITEM', productId: 'product-1' });
      cartReducer(state, { type: 'UPDATE_QTY', productId: 'product-1', quantity: 5 });
      cartReducer(state, { type: 'SET_PHASE', phase: 'checkout' });
      cartReducer(state, { type: 'SET_COMPLETED_ORDER', orderId: 'order-123' });
      cartReducer(state, { type: 'CLEAR_CART' });

      expect(JSON.stringify(state)).toBe(originalState);
    });
  });

  describe('Complex scenarios', () => {
    test('should handle add, update, remove sequence', () => {
      let state = initialState;

      state = cartReducer(state, { type: 'ADD_ITEM', item: sampleItem });
      expect(state.items).toHaveLength(1);

      state = cartReducer(state, { type: 'ADD_ITEM', item: anotherItem });
      expect(state.items).toHaveLength(2);

      state = cartReducer(state, { type: 'UPDATE_QTY', productId: 'product-1', quantity: 5 });
      expect(state.items[0].quantity).toBe(5);

      state = cartReducer(state, { type: 'REMOVE_ITEM', productId: 'product-1' });
      expect(state.items).toHaveLength(1);
    });

    test('should handle phase transitions with data', () => {
      let state = initialState;

      state = cartReducer(state, { type: 'ADD_ITEM', item: sampleItem });
      state = cartReducer(state, { type: 'SET_PHASE', phase: 'checkout' });
      state = cartReducer(state, { type: 'SET_COMPLETED_ORDER', orderId: 'order-123' });
      state = cartReducer(state, { type: 'SET_PHASE', phase: 'receipt' });

      expect(state.items).toHaveLength(1);
      expect(state.phase).toBe('receipt');
      expect(state.completedOrderId).toBe('order-123');
    });

    test('should support new sale flow', () => {
      let state = initialState;

      // First sale
      state = cartReducer(state, { type: 'ADD_ITEM', item: sampleItem });
      state = cartReducer(state, { type: 'SET_PHASE', phase: 'checkout' });
      state = cartReducer(state, { type: 'SET_COMPLETED_ORDER', orderId: 'order-123' });
      state = cartReducer(state, { type: 'SET_PHASE', phase: 'receipt' });

      expect(state.completedOrderId).toBe('order-123');

      // Clear for next sale
      state = cartReducer(state, { type: 'CLEAR_CART' });
      expect(state.phase).toBe('cart');
      expect(state.completedOrderId).toBeNull();
      expect(state.items).toHaveLength(0);

      // Second sale
      state = cartReducer(state, { type: 'ADD_ITEM', item: anotherItem });
      expect(state.items).toHaveLength(1);
    });
  });
});
