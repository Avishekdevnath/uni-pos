const CHECKOUT_INTENT_PREFIX = 'uni-pos.pos.checkout-intent';

interface StoredCheckoutIntent {
  cartSignature: string;
  key: string;
  orderId?: string;
}

function getStorageKey(cartSignature: string): string {
  // Use signature as part of the key to support multiple intents
  return `${CHECKOUT_INTENT_PREFIX}:${cartSignature}`;
}

function readIntent(cartSignature: string): StoredCheckoutIntent | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(getStorageKey(cartSignature));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredCheckoutIntent;
  } catch {
    localStorage.removeItem(getStorageKey(cartSignature));
    return null;
  }
}

function writeIntent(intent: StoredCheckoutIntent) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(intent.cartSignature), JSON.stringify(intent));
}

export function clearCheckoutIntent(cartSignature?: string) {
  if (typeof window === 'undefined') return;
  if (cartSignature) {
    localStorage.removeItem(getStorageKey(cartSignature));
  } else {
    // Clear all checkout intents
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CHECKOUT_INTENT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export function getOrCreateCheckoutIntent(cartSignature: string): StoredCheckoutIntent {
  const existing = readIntent(cartSignature);

  if (existing && existing.cartSignature === cartSignature) {
    return existing;
  }

  const intent = {
    cartSignature,
    key: crypto.randomUUID(),
  };

  writeIntent(intent);
  return intent;
}

export function setCheckoutIntentOrderId(cartSignature: string, orderId: string) {
  const intent = getOrCreateCheckoutIntent(cartSignature);
  if (intent.orderId === orderId) {
    return;
  }

  writeIntent({ ...intent, orderId });
}
