import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePracticeStore } from '@/store/practiceStore';
import { CustomDateTimePicker } from '@/components/DateTimePicker';
import { ValidatedInput } from '@/components/ValidatedInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidationRules, commonRules } from '@/utils/validation';
import { colors } from '@/constants/colors';

const validationRules: ValidationRules = {
  title: commonRules.title,
  note: {
    maxLength: 500,
    message: 'Notes must be less than 500 characters',
  },
};

export default function EditPracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, updateTask, deleteTask, categories } = usePracticeStore();

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
      completed: false,
    },
    validationRules,
    onSubmit: async (formValues) => {
      if (!id) return;
      
      try {
        updateTask(id, {
          title: formValues.title.trim(),
          note: formValues.note.trim() || undefined,
          dueDate: formValues.dueDate,
          category: formValues.category,
          completed: formValues.completed,
        });
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to update practice task. Please try again.');
      }
    },
  });

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const task = tasks.find(t => t.id === id);
    if (!task) {
      router.back();
      return;
    }

    // Set individual field values
    setFieldValue('title', task.title);
    setFieldValue('note', task.note || '');
    setFieldValue('dueDate', task.dueDate);
    setFieldValue('category', task.category);
    setFieldValue('completed', task.completed);
  }, [id, tasks, setFieldValue]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this practice task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            if (id) {
              try {
                deleteTask(id);
                router.back();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete task. Please try again.');
              }
            }
          } 
        }
      ]
    );
  };

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

      <View style={styles.formGroup}>
        <CustomDateTimePicker
          label="Target Date"
          value={values.dueDate}
          onChange={(date) => setFieldValue('dueDate', date)}
          mode="date"
          placeholder="Select a target date (optional)"
        />
      </View>

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
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, (!values.title.trim() || isSubmitting) && styles.saveButtonDisabled]} 
          onPress={() => handleSubmit()}
          disabled={!values.title.trim() || isSubmitting}
        >
          <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
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
  textArea: {
    minHeight: 100,
  },
  categoriesContainer: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
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
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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