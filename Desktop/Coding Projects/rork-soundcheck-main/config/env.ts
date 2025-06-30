// Environment configuration
interface Environment {
  isDevelopment: boolean;
  isProduction: boolean;
  apiUrl?: string;
  enableLogging: boolean;
}

const ENV: Environment = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  enableLogging: __DEV__,
};

// Logger utility that respects environment
export const logger = {
  log: (...args: any[]) => {
    if (ENV.enableLogging) {
      console.log('[SoundCheck]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (ENV.enableLogging) {
      console.warn('[SoundCheck]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error('[SoundCheck]', ...args);
  },
  debug: (...args: any[]) => {
    if (ENV.isDevelopment) {
      console.debug('[SoundCheck Debug]', ...args);
    }
  },
};

export default ENV;