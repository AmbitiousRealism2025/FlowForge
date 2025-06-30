/// <reference types="react-native" />

declare global {
  const __DEV__: boolean;
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    }
  }
}