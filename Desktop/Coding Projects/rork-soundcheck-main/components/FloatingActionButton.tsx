import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface FloatingActionButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
}

export const FloatingActionButton = memo(({
  onPress,
  accessibilityLabel = "Add new item",
  accessibilityHint = "Opens a screen to add a new item",
  accessibilityRole = "button"
}: FloatingActionButtonProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        importantForAccessibility="yes"
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
