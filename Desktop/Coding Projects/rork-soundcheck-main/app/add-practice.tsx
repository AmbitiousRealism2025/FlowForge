import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { usePracticeStore } from '@/store/practiceStore';
import { CustomDateTimePicker } from '@/components/DateTimePicker';
import { colors } from '@/constants/colors';

import { Alert } from 'react-native';
import { ValidatedInput } from '@/components/ValidatedInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidationRules, commonRules } from '@/utils/validation';

const validationRules: ValidationRules = {
  title: commonRules.title,
  note: {
    maxLength: 500,
    message: 'Notes must be less than 500 characters',
  },
};

export default function AddPracticeScreen() {
  const { addTask, categories } = usePracticeStore();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useFormValidation({
    initialValues: {
      title: '',
      note: '',
      dueDate: undefined as Date | undefined,
      category: undefined as string | undefined,
    },
    validationRules,
    onSubmit: async (formValues) => {
      try {
        addTask({
          title: formValues.title.trim(),
          note: formValues.note.trim() || undefined,
          dueDate: formValues.dueDate,
          category: formValues.category,
          completed: false,
        });
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to add practice task. Please try again.');
      }
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.formGroup}>
        <ValidatedInput
          label="Task Title"
          required
          value={values.title}
          onChangeText={handleChange('title')}
          onBlur={handleBlur('title')}
          error={errors.title}
          touched={touched.title}
          placeholder="What do you need to practice?"
          autoFocus
        />
      </View>

      <View style={styles.formGroup}>
        <ValidatedInput
          label="Notes"
          value={values.note}
          onChangeText={handleChange('note')}
          onBlur={handleBlur('note')}
          error={errors.note}
          touched={touched.note}
          placeholder="Add any details about this practice task"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
      </View>

      <CustomDateTimePicker
        label="Target Date"
        value={values.dueDate}
        onChange={(date) => setFieldValue('dueDate', date)}
        mode="date"
        placeholder="Select a target date (optional)"
      />

      {categories.length > 0 && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            <TouchableOpacity
              style={[styles.categoryChip, !values.category && styles.selectedCategoryChip]}
              onPress={() => setFieldValue('category', undefined)}
            >
              <Text style={[styles.categoryChipText, !values.category && styles.selectedCategoryChipText]}>
                None
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, values.category === cat && styles.selectedCategoryChip]}
                onPress={() => setFieldValue('category', cat)}
              >
                <Text style={[styles.categoryChipText, values.category === cat && styles.selectedCategoryChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (!values.title.trim() || isSubmitting) && styles.saveButtonDisabled]}
          onPress={() => handleSubmit()}
          disabled={!values.title.trim() || isSubmitting}
        >
          <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save Task'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.text,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
