import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: Date;
  deviceInfo: {
    brand?: string;
    modelName?: string;
    osName?: string;
    osVersion?: string;
    appVersion?: string;
  };
  context?: Record<string, any>;
}

class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private errorQueue: ErrorLog[] = [];
  private isProduction: boolean;

  private constructor() {
    this.isProduction = !__DEV__;
  }

  static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  logError(error: Error, context?: Record<string, any>): void {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      deviceInfo: {
        brand: Device.brand || undefined,
        modelName: Device.modelName || undefined,
        osName: Device.osName || undefined,
        osVersion: Device.osVersion || undefined,
        appVersion: Constants.expoConfig?.version,
      },
      context,
    };

    // In development, log to console
    if (!this.isProduction) {
      console.error('Error logged:', errorLog);
      return;
    }

    // In production, add to queue for batch sending
    this.errorQueue.push(errorLog);
    
    // If queue is getting large, send errors
    if (this.errorQueue.length >= 10) {
      this.sendErrors();
    }
  }

  logWarning(message: string, context?: Record<string, any>): void {
    if (!this.isProduction) {
      console.warn('Warning:', message, context);
      return;
    }

    // In production, you might want to handle warnings differently
    const warningLog: ErrorLog = {
      message: `Warning: ${message}`,
      timestamp: new Date(),
      deviceInfo: {
        brand: Device.brand || undefined,
        modelName: Device.modelName || undefined,
        osName: Device.osName || undefined,
        osVersion: Device.osVersion || undefined,
        appVersion: Constants.expoConfig?.version,
      },
      context,
    };

    this.errorQueue.push(warningLog);
  }

  private async sendErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // TODO: Replace with your actual error logging endpoint
      // For now, we'll just log that we would send these errors
      console.log('Would send errors to logging service:', errorsToSend);
      
      // Example implementation:
      // await fetch('https://your-error-logging-endpoint.com/errors', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ errors: errorsToSend }),
      // });
    } catch (error) {
      // If sending fails, add errors back to queue
      this.errorQueue = [...errorsToSend, ...this.errorQueue];
      console.error('Failed to send errors to logging service:', error);
    }
  }

  // Call this when app goes to background or on app termination
  async flush(): Promise<void> {
    await this.sendErrors();
  }
}

export const errorLogger = ErrorLoggingService.getInstance();

// Helper function for easy error logging
export const logError = (error: Error, context?: Record<string, any>) => {
  errorLogger.logError(error, context);
};

// Helper function for easy warning logging
export const logWarning = (message: string, context?: Record<string, any>) => {
  errorLogger.logWarning(message, context);
};