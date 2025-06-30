import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light feedback for small interactions like selection
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium feedback for confirmations and completions
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy feedback for important actions like deletion
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Success feedback for positive actions
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Warning feedback for warnings or attention-needed actions
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // Error feedback for errors or failed operations
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Selection feedback for picking items
  selection: () => {
    Haptics.selectionAsync();
  },
};

// Specific feedback functions for common actions
export const taskCompleted = () => HapticFeedback.success();
export const taskDeleted = () => HapticFeedback.heavy();
export const formSaved = () => HapticFeedback.medium();
export const itemSelected = () => HapticFeedback.light();
export const categoryChanged = () => HapticFeedback.selection();
export const errorOccurred = () => HapticFeedback.error();