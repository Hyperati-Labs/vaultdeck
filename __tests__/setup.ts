// Jest setup for core-logic tests.
(global as { __DEV__?: boolean }).__DEV__ = true;

// Silence console noise during tests (logger tests still assert via spies).
console.debug = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
