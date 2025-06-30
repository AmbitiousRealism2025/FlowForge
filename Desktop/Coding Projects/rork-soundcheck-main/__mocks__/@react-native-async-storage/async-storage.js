// __mocks__/@react-native-async-storage/async-storage.js

let store = {};

const mock = {
  setItem: jest.fn((key, value) => {
    store[key] = value;
    return Promise.resolve(null);
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(store[key] || null);
  }),
  removeItem: jest.fn((key) => {
    delete store[key];
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    store = {};
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
  multiGet: jest.fn(keys => Promise.resolve(keys.map(key => [key, store[key] || null]))),
  multiSet: jest.fn(keyValuePairs => {
    keyValuePairs.forEach(([key, value]) => {
      store[key] = value;
    });
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn(keys => {
    keys.forEach(key => {
      delete store[key];
    });
    return Promise.resolve(null);
  }),
  multiMerge: jest.fn(keyValuePairs => {
    keyValuePairs.forEach(([key, value]) => {
      const existingValue = store[key];
      const newValue = JSON.stringify({...JSON.parse(existingValue || '{}'), ...JSON.parse(value)});
      store[key] = newValue;
    });
    return Promise.resolve(null);
  }),
  flushGetRequests: jest.fn(),
};

export default mock;
