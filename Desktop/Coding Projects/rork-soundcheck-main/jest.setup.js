// jest.setup.js
import { jest } from '@jest/globals';

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native'); // Get actual react-native for other exports

  // Override the Linking export
  RN.Linking = {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return RN;
});

// Optional: A simple console log to confirm this file is executed.
// console.log('jest.setup.js executed');
