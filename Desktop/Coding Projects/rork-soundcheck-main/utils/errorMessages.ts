export const getErrorMessage = (error: unknown): string => {
  // Handle different error types
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('Network request failed')) {
      return 'Unable to connect to the internet. Please check your connection and try again.';
    }
    
    // Storage errors
    if (error.message.includes('AsyncStorage')) {
      return 'Unable to save data. Please check your device storage.';
    }
    
    // Permission errors
    if (error.message.includes('permission')) {
      return 'Permission denied. Please check your app settings.';
    }
    
    // Date parsing errors
    if (error.message.includes('Invalid Date')) {
      return 'Invalid date format. Please check your input.';
    }
    
    // Generic error with message
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback for unknown errors
  return 'An unexpected error occurred. Please try again.';
};

export const getActionMessage = (action: string, success: boolean = true): string => {
  const messages: Record<string, { success: string; error: string }> = {
    'add-rehearsal': {
      success: 'Rehearsal task added successfully!',
      error: 'Failed to add rehearsal task. Please try again.',
    },
    'update-rehearsal': {
      success: 'Rehearsal task updated successfully!',
      error: 'Failed to update rehearsal task. Please try again.',
    },
    'delete-rehearsal': {
      success: 'Rehearsal task deleted successfully!',
      error: 'Failed to delete rehearsal task. Please try again.',
    },
    'add-practice': {
      success: 'Practice task added successfully!',
      error: 'Failed to add practice task. Please try again.',
    },
    'update-practice': {
      success: 'Practice task updated successfully!',
      error: 'Failed to update practice task. Please try again.',
    },
    'delete-practice': {
      success: 'Practice task deleted successfully!',
      error: 'Failed to delete practice task. Please try again.',
    },
    'add-gig': {
      success: 'Gig added successfully!',
      error: 'Failed to add gig. Please try again.',
    },
    'update-gig': {
      success: 'Gig updated successfully!',
      error: 'Failed to update gig. Please try again.',
    },
    'delete-gig': {
      success: 'Gig deleted successfully!',
      error: 'Failed to delete gig. Please try again.',
    },
  };
  
  const message = messages[action];
  if (message) {
    return success ? message.success : message.error;
  }
  
  return success ? 'Operation completed successfully!' : 'Operation failed. Please try again.';
};