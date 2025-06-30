import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { itemSelected } from '@/utils/haptics';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  showClearButton = true,
  autoFocus = false,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChangeText('');
    itemSelected();
    onClear?.();
  }, [onChangeText, onClear]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    itemSelected();
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <View style={[
      styles.container,
      isFocused && styles.containerFocused,
      disabled && styles.containerDisabled
    ]}>
      <Search
        size={20}
        color={isFocused ? colors.primary : colors.subtext}
        style={styles.searchIcon}
      />
      
      <TextInput
        style={[
          styles.input,
          disabled && styles.inputDisabled
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        editable={!disabled}
        returnKeyType="search"
        clearButtonMode="never" // We'll handle clear button ourselves
        accessibilityLabel={`Search input. ${placeholder}`}
        accessibilityHint="Enter text to search"
        accessibilityRole="searchbox"
      />

      {showClearButton && value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          accessibilityLabel="Clear search"
          accessibilityHint="Clears the search text"
          accessibilityRole="button"
        >
          <X size={18} color={colors.subtext} />
        </TouchableOpacity>
      )}
    </View>
  );
};

interface SearchResultsProps {
  query: string;
  totalResults: number;
  isSearching: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  totalResults,
  isSearching,
}) => {
  if (!query.trim()) {
    return null;
  }

  return (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultsText}>
        {isSearching
          ? 'Searching...'
          : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"`
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  containerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0, // Remove default padding
  },
  inputDisabled: {
    color: colors.subtext,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: colors.subtext,
    fontStyle: 'italic',
  },
});