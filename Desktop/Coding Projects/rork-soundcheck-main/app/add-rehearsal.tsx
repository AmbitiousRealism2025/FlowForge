import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useRehearsalStore } from '@/store/rehearsalStore';
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

export default function AddRehearsalScreen() {
  const { addTask, events } = useRehearsalStore();
  
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
      eventId: undefined as string | undefined,
    },
    validationRules,
    onSubmit: async (formValues) => {
      try {
        addTask({
          title: formValues.title.trim(),
          note: formValues.note.trim() || undefined,
          dueDate: formValues.dueDate,
          eventId: formValues.eventId,
          completed: false,
        });
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to add rehearsal task. Please try again.');
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
          placeholder="What do you need to do?"
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
          placeholder="Add any details about this task"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
      </View>

      <View style={styles.formGroup}>
        <CustomDateTimePicker
          label="Due Date"
          value={values.dueDate}
          onChange={(date) => setFieldValue('dueDate', date)}
          mode="date"
          placeholder="Select a due date (optional)"
        />
      </View>

      {events.length > 0 && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Assign to Event</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsContainer}>
            <TouchableOpacity
              style={[styles.eventChip, !values.eventId && styles.selectedEventChip]}
              onPress={() => setFieldValue('eventId', undefined)}
            >
              <Text style={[styles.eventChipText, !values.eventId && styles.selectedEventChipText]}>
                None
              </Text>
            </TouchableOpacity>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventChip, values.eventId === event.id && styles.selectedEventChip]}
                onPress={() => setFieldValue('eventId', event.id)}
              >
                <Text style={[styles.eventChipText, values.eventId === event.id && styles.selectedEventChipText]}>
                  {event.name}
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
          onPress={handleSubmit}
          disabled={!values.title.trim() || isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save Task'}
          </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  eventsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  eventChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedEventChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventChipText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedEventChipText: {
    color: colors.background,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});