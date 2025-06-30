import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useRehearsalStore } from '@/store/rehearsalStore';
import { CustomDateTimePicker } from '@/components/DateTimePicker';
import { ValidatedInput } from '@/components/ValidatedInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidationRules, commonRules } from '@/utils/validation';
import { colors } from '@/constants/colors';

const validationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Event name must be between 2 and 100 characters',
  },
  location: {
    maxLength: 200,
    message: 'Location must be less than 200 characters',
  },
};

export default function EditRehearsalEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, updateEvent, deleteEvent } = useRehearsalStore();

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
      name: '',
      date: undefined as Date | undefined,
      location: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      if (!id) return;
      
      try {
        updateEvent(id, {
          name: formValues.name.trim(),
          date: formValues.date,
          location: formValues.location.trim() || undefined,
        });
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to update event. Please try again.');
      }
    },
  });

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const event = events.find(e => e.id === id);
    if (!event) {
      router.back();
      return;
    }

    // Set individual field values
    setFieldValue('name', event.name);
    setFieldValue('date', event.date);
    setFieldValue('location', event.location || '');
  }, [id, events, setFieldValue]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? All associated tasks will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            if (id) {
              try {
                deleteEvent(id);
                router.back();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete event. Please try again.');
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
          label="Event Name"
          required
          value={values.name}
          onChangeText={handleChange('name')}
          onBlur={handleBlur('name')}
          error={errors.name}
          touched={touched.name}
          placeholder="Band Practice, Recording Session, etc."
        />
      </View>

      <View style={styles.formGroup}>
        <CustomDateTimePicker
          label="Date"
          value={values.date}
          onChange={(date) => setFieldValue('date', date)}
          mode="date"
          placeholder="Select event date (optional)"
        />
      </View>

      <View style={styles.formGroup}>
        <ValidatedInput
          label="Location"
          value={values.location}
          onChangeText={handleChange('location')}
          onBlur={handleBlur('location')}
          error={errors.location}
          touched={touched.location}
          placeholder="Studio A, John's Garage, etc."
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, (!values.name.trim() || isSubmitting) && styles.saveButtonDisabled]} 
          onPress={() => handleSubmit()}
          disabled={!values.name.trim() || isSubmitting}
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