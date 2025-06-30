module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js' // Added
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Removed AsyncStorage from here, the manual mock in __mocks__ should be used.
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-gesture-handler|nativewind|lucide-react-native|uuid))"
  ],
};
