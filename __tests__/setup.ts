(global as { __DEV__?: boolean }).__DEV__ = true;

console.debug = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
