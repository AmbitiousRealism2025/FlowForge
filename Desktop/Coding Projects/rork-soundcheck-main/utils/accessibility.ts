import { useEffect, useState, useRef } from 'react';
import { AccessibilityInfo, AccessibilityActionEvent, AccessibilityRole } from 'react-native';

export const useAccessibilityAnnouncement = (message: string, delay = 100) => {
  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
    }, delay);

    return () => clearTimeout(timer);
  }, [message, delay]);
};

export const useScreenReaderStatus = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => subscription?.remove();
  }, []);

  return isEnabled;
};

// Accessibility helper functions
export const a11y = {
  // Generate accessible label for dates
  dateLabel: (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Generate accessible label for time
  timeLabel: (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: 'numeric'
    });
  },

  // Combine multiple labels
  combineLabels: (...labels: (string | undefined)[]): string => {
    return labels.filter(Boolean).join(', ');
  },

  // Generate progress announcement
  progressAnnouncement: (current: number, total: number, itemType: string = 'items'): string => {
    const percentage = Math.round((current / total) * 100);
    return `${current} of ${total} ${itemType}. ${percentage} percent complete.`;
  },

  // Generate state change announcement
  stateChangeAnnouncement: (action: string, itemName: string, newState?: string): string => {
    const baseMessage = `${action} ${itemName}`;
    return newState ? `${baseMessage}. ${newState}` : baseMessage;
  },

  // Generate list update announcement
  listUpdateAnnouncement: (action: 'added' | 'removed' | 'updated', itemType: string, itemName?: string): string => {
    const actionText = action === 'added' ? 'Added' : action === 'removed' ? 'Removed' : 'Updated';
    return itemName ? `${actionText} ${itemName}` : `${actionText} ${itemType}`;
  }
};

// Custom hook for managing focus
export const useFocusManagement = () => {
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setFocusWithDelay = (elementRef: React.RefObject<any>, delay: number = 500) => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    focusTimeoutRef.current = setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.focus();
      }
    }, delay);
  };

  const clearFocusTimeout = () => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
  };

  return {
    setFocusWithDelay,
    clearFocusTimeout
  };
};

// Hook for font scaling preferences
export const useFontScaling = () => {
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const getFontScale = async () => {
      try {
        // This would need to be implemented with a native module or expo-font
        // For now, we'll use a default scale
        setFontScale(1);
      } catch (error) {
        setFontScale(1);
      }
    };

    getFontScale();
  }, []);

  return {
    fontScale,
    scaledSize: (size: number) => size * fontScale
  };
};

// Hook for high contrast mode detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = async () => {
      try {
        // This would need to be implemented with accessibility settings
        // For now, we'll default to false
        setIsHighContrast(false);
      } catch (error) {
        setIsHighContrast(false);
      }
    };

    checkHighContrast();
  }, []);

  return isHighContrast;
};

// Enhanced accessibility announcement with context
export const useContextualAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Add context-aware delay based on priority
    const delay = priority === 'assertive' ? 100 : 300;
    
    setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
    }, delay);
  };

  return { announce };
};