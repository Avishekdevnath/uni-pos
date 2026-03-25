import {
  clearCheckoutIntent,
  getOrCreateCheckoutIntent,
  setCheckoutIntentOrderId,
} from '../lib/idempotency';

describe('idempotency', () => {
  const STORAGE_KEY = 'uni-pos.pos.checkout-intent';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('getOrCreateCheckoutIntent', () => {
    test('should create new intent for fresh cart', () => {
      const cartSignature = 'sig-123';

      const intent = getOrCreateCheckoutIntent(cartSignature);

      expect(intent).toBeDefined();
      expect(intent.cartSignature).toBe(cartSignature);
      expect(intent.key).toBeDefined();
      expect(intent.key).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(intent.orderId).toBeUndefined();
    });

    test('should generate unique keys for different carts', () => {
      const intent1 = getOrCreateCheckoutIntent('sig-123');
      const intent2 = getOrCreateCheckoutIntent('sig-456');

      expect(intent1.key).not.toBe(intent2.key);
    });

    test('should return existing intent for same cart signature', () => {
      const cartSignature = 'sig-123';

      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      const intent2 = getOrCreateCheckoutIntent(cartSignature);

      expect(intent1.key).toBe(intent2.key);
      expect(intent1.cartSignature).toBe(intent2.cartSignature);
    });

    test('should create new intent when cart signature changes', () => {
      const intent1 = getOrCreateCheckoutIntent('sig-123');
      const intent2 = getOrCreateCheckoutIntent('sig-456');

      expect(intent1.key).not.toBe(intent2.key);
      expect(intent1.cartSignature).not.toBe(intent2.cartSignature);
    });

    test('should persist intent to localStorage', () => {
      const cartSignature = 'sig-123';

      getOrCreateCheckoutIntent(cartSignature);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.cartSignature).toBe(cartSignature);
      expect(parsed.key).toBeDefined();
    });

    test('should preserve orderId when returning existing intent', () => {
      const cartSignature = 'sig-123';

      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      setCheckoutIntentOrderId(cartSignature, 'order-123');

      const intent2 = getOrCreateCheckoutIntent(cartSignature);

      expect(intent2.orderId).toBe('order-123');
      expect(intent2.key).toBe(intent1.key);
    });
  });

  describe('setCheckoutIntentOrderId', () => {
    test('should set order ID for existing intent', () => {
      const cartSignature = 'sig-123';

      getOrCreateCheckoutIntent(cartSignature);
      setCheckoutIntentOrderId(cartSignature, 'order-123');

      const intent = getOrCreateCheckoutIntent(cartSignature);
      expect(intent.orderId).toBe('order-123');
    });

    test('should create intent if not exists and set order ID', () => {
      const cartSignature = 'sig-123';

      setCheckoutIntentOrderId(cartSignature, 'order-123');

      const intent = getOrCreateCheckoutIntent(cartSignature);
      expect(intent.orderId).toBe('order-123');
      expect(intent.cartSignature).toBe(cartSignature);
    });

    test('should update order ID on subsequent calls', () => {
      const cartSignature = 'sig-123';

      getOrCreateCheckoutIntent(cartSignature);
      setCheckoutIntentOrderId(cartSignature, 'order-123');
      setCheckoutIntentOrderId(cartSignature, 'order-456');

      const intent = getOrCreateCheckoutIntent(cartSignature);
      expect(intent.orderId).toBe('order-456');
    });

    test('should not update if order ID is already the same', () => {
      const cartSignature = 'sig-123';

      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      const originalKey = intent1.key;

      setCheckoutIntentOrderId(cartSignature, 'order-123');
      setCheckoutIntentOrderId(cartSignature, 'order-123');

      const intent2 = getOrCreateCheckoutIntent(cartSignature);
      expect(intent2.key).toBe(originalKey);
      expect(intent2.orderId).toBe('order-123');
    });

    test('should maintain idempotent key when updating order', () => {
      const cartSignature = 'sig-123';

      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      const originalKey = intent1.key;

      setCheckoutIntentOrderId(cartSignature, 'order-123');
      const intent2 = getOrCreateCheckoutIntent(cartSignature);

      expect(intent2.key).toBe(originalKey);
    });
  });

  describe('clearCheckoutIntent', () => {
    test('should remove intent from localStorage', () => {
      const cartSignature = 'sig-123';

      getOrCreateCheckoutIntent(cartSignature);
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

      clearCheckoutIntent();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    test('should allow creating new intent after clear', () => {
      const cartSignature = 'sig-123';

      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      clearCheckoutIntent();
      const intent2 = getOrCreateCheckoutIntent(cartSignature);

      expect(intent1.key).not.toBe(intent2.key);
    });

    test('should handle clearing empty storage gracefully', () => {
      expect(() => clearCheckoutIntent()).not.toThrow();
    });
  });

  describe('localStorage persistence', () => {
    test('should handle corrupted JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {');

      const intent = getOrCreateCheckoutIntent('sig-123');
      expect(intent).toBeDefined();
      expect(intent.cartSignature).toBe('sig-123');
    });

    test('should clear corrupted intent and create new one', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      getOrCreateCheckoutIntent('sig-123');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(() => JSON.parse(stored!)).not.toThrow();
    });

    test('should persist complex intent data', () => {
      const cartSignature = 'sig-complex-123';

      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      setCheckoutIntentOrderId(cartSignature, 'order-complex-456');

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);

      expect(parsed.cartSignature).toBe(cartSignature);
      expect(parsed.key).toBe(intent1.key);
      expect(parsed.orderId).toBe('order-complex-456');
    });
  });

  describe('Retry scenarios', () => {
    test('should detect cart mutation via signature change', () => {
      // Initial cart
      const intent1 = getOrCreateCheckoutIntent('sig-initial');
      const key1 = intent1.key;

      // Cart contents changed (signature changed)
      const intent2 = getOrCreateCheckoutIntent('sig-modified');
      const key2 = intent2.key;

      expect(key1).not.toBe(key2);
    });

    test('should reuse same intent for successful idempotent retry', () => {
      const cartSignature = 'sig-123';

      // First attempt
      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      setCheckoutIntentOrderId(cartSignature, 'order-123');

      // Retry with same cart state
      const intent2 = getOrCreateCheckoutIntent(cartSignature);

      expect(intent2.key).toBe(intent1.key);
      expect(intent2.orderId).toBe('order-123');
    });

    test('should create new intent if cart changed between attempts', () => {
      // First attempt with cart sig 1
      const intent1 = getOrCreateCheckoutIntent('sig-123');
      const key1 = intent1.key;
      setCheckoutIntentOrderId('sig-123', 'order-123');

      // Add item, cart signature changes
      const intent2 = getOrCreateCheckoutIntent('sig-456');
      const key2 = intent2.key;

      // Old intent no longer current
      expect(key1).not.toBe(key2);
      expect(intent2.orderId).toBeUndefined();
    });

    test('should support multi-attempt retry pattern', () => {
      const cartSignature = 'sig-123';
      const key = getOrCreateCheckoutIntent(cartSignature).key;

      // Attempt 1: Network error
      const attempt1Intent = getOrCreateCheckoutIntent(cartSignature);
      expect(attempt1Intent.key).toBe(key);

      // Attempt 2: Network error
      const attempt2Intent = getOrCreateCheckoutIntent(cartSignature);
      expect(attempt2Intent.key).toBe(key);

      // Attempt 3: Success
      setCheckoutIntentOrderId(cartSignature, 'order-123');
      const attempt3Intent = getOrCreateCheckoutIntent(cartSignature);
      expect(attempt3Intent.key).toBe(key);
      expect(attempt3Intent.orderId).toBe('order-123');
    });

    test('should prevent duplicate order creation on retry', () => {
      const cartSignature = 'sig-123';

      // First checkout - creates draft
      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      setCheckoutIntentOrderId(cartSignature, 'draft-123');

      // Retry - should reuse draft
      const intent2 = getOrCreateCheckoutIntent(cartSignature);
      expect(intent2.orderId).toBe('draft-123');
      expect(intent2.key).toBe(intent1.key);

      // Even on multiple retries
      const intent3 = getOrCreateCheckoutIntent(cartSignature);
      expect(intent3.orderId).toBe('draft-123');
    });

    test('should differentiate between cart mutations', () => {
      // Cart state 1
      const sig1 = 'CART_STATE_1';
      const intent1 = getOrCreateCheckoutIntent(sig1);

      setCheckoutIntentOrderId(sig1, 'order-1');

      // User adds item (cart changed)
      const sig2 = 'CART_STATE_2';
      const intent2 = getOrCreateCheckoutIntent(sig2);

      // Different orders, different intents
      expect(intent2.orderId).toBeUndefined();
      expect(intent1.key).not.toBe(intent2.key);

      // Original cart intent still valid with order ID
      const intentRecall1 = getOrCreateCheckoutIntent(sig1);
      expect(intentRecall1.orderId).toBe('order-1');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty cart signature', () => {
      const intent = getOrCreateCheckoutIntent('');

      expect(intent.cartSignature).toBe('');
      expect(intent.key).toBeDefined();
    });

    test('should handle very long cart signature', () => {
      const longSig = 'a'.repeat(10000);

      const intent = getOrCreateCheckoutIntent(longSig);

      expect(intent.cartSignature).toBe(longSig);
      expect(intent.key).toBeDefined();
    });

    test('should handle special characters in signatures', () => {
      const specialSig = 'sig-!@#$%^&*()_+-=[]{}|;:,.<>?';

      const intent = getOrCreateCheckoutIntent(specialSig);

      expect(intent.cartSignature).toBe(specialSig);
      expect(intent.key).toBeDefined();
    });

    test('should handle unicode in signatures', () => {
      const unicodeSig = 'sig-🎯-😀-中文';

      const intent = getOrCreateCheckoutIntent(unicodeSig);

      expect(intent.cartSignature).toBe(unicodeSig);
      expect(intent.key).toBeDefined();
    });

    test('should maintain intent across multiple operations', () => {
      const cartSignature = 'sig-123';

      const intent1 = getOrCreateCheckoutIntent(cartSignature);
      const originalKey = intent1.key;

      setCheckoutIntentOrderId(cartSignature, 'order-1');
      let currentIntent = getOrCreateCheckoutIntent(cartSignature);
      expect(currentIntent.key).toBe(originalKey);

      setCheckoutIntentOrderId(cartSignature, 'order-2');
      currentIntent = getOrCreateCheckoutIntent(cartSignature);
      expect(currentIntent.key).toBe(originalKey);

      clearCheckoutIntent();
      const intent2 = getOrCreateCheckoutIntent(cartSignature);
      expect(intent2.key).not.toBe(originalKey);
    });
  });
});
