// Polyfill crypto.randomUUID for Jest/Node environment  
if (typeof global !== 'undefined' && typeof global.crypto !== 'undefined' && !global.crypto.randomUUID) {
  try {
    const { randomUUID } = require('crypto');
    global.crypto.randomUUID = randomUUID;
  } catch (e) {
    // randomUUID not available
  }
}

// Only set up localStorage mock if we're NOT in jsdom (which provides it)
if (typeof window === 'undefined') {
  const localStorageMock = {
    getItem: (key) => {
      if (!localStorageMock.store[key]) {
        return null;
      }
      return localStorageMock.store[key];
    },
    setItem: (key, value) => {
      localStorageMock.store[key] = value.toString();
    },
    removeItem: (key) => {
      delete localStorageMock.store[key];
    },
    clear: () => {
      localStorageMock.store = {};
    },
    store: {},
  };

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
  });

  // Define global window object for browser APIs
  Object.defineProperty(global, 'window', {
    value: {
      localStorage: localStorageMock,
    },
  });
}
