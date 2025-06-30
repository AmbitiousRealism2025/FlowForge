import React, { useState, useEffect, memo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors } from '@/constants/colors';

interface ValidatedInputProps extends TextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = memo(({
  label,
  error,
  touched,
  required,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedError = useState(new Animated.Value(0))[0];
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.timing(animatedError, {
      toValue: error && touched ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [error, touched, animatedError]);

  const showError = error && touched;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          showError && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.subtext}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={label + (required ? ', required' : '')}
        accessibilityHint={error && touched ? `Error: ${error}` : undefined}
        accessibilityRequired={required}
        accessibilityState={{
          invalid: showError
        }}
        {...props}
      />
      <Animated.View
        style={[
          styles.errorContainer,
          {
            opacity: animatedError,
            transform: [
              {
                translateY: animatedError.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
        {showError && (
          <Text 
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLive="polite"
          >
            {error}
          </Text>
        )}
      </Animated.View>
    </View>
  );
});

ValidatedInput.displayName = 'ValidatedInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error || '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error || '#ef4444',
  },
  errorContainer: {
    minHeight: 20,
  },
  errorText: {
    color: colors.error || '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
});