interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Calculate delay with exponential backoff if enabled
      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

// Specific retry wrapper for AsyncStorage operations
export async function retryAsyncStorage<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3,
    delay: 500,
    backoff: true,
    onRetry: (attempt, error) => {
      console.warn(`AsyncStorage ${operationName} failed (attempt ${attempt}):`, error.message);
    },
  });
}

// Retry wrapper for network operations
export async function retryNetwork<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3,
    delay: 2000,
    backoff: true,
    onRetry: (attempt, error) => {
      console.warn(`Network ${operationName} failed (attempt ${attempt}):`, error.message);
    },
  });
}