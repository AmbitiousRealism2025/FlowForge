import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useGigStore } from '@/store/gigStore';
import { CustomDateTimePicker } from '@/components/DateTimePicker';
import { ValidatedInput } from '@/components/ValidatedInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidationRules, commonRules } from '@/utils/validation';
import { colors } from '@/constants/colors';

const validationRules: ValidationRules = {
  title: commonRules.title,
  venueName: commonRules.venueName,
  address: {
    maxLength: 200,
    message: 'Address must be less than 200 characters',
  },
  contact: {
    maxLength: 100,
    message: 'Contact must be less than 100 characters',
  },
  compensation: commonRules.compensation,
  notes: {
    maxLength: 500,
    message: 'Notes must be less than 500 characters',
  },
  date: {
    required: true,
    custom: commonRules.futureDate.custom,
    message: 'Please select a valid future date',
  },
};

export default function AddGigScreen() {
  const { addGig } = useGigStore();

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
      venueName: '',
      address: '',
      date: undefined as Date | undefined,
      callTime: undefined as Date | undefined,
      contact: '',
      compensation: '',
      notes: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      try {
        addGig({
          title: formValues.title.trim(),
          venueName: formValues.venueName.trim(),
          address: formValues.address.trim() || undefined,
          date: formValues.date!,
          callTime: formValues.callTime,
          contact: formValues.contact.trim() || undefined,
          compensation: formValues.compensation.trim() || undefined,
          notes: formValues.notes.trim() || undefined,
        });
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to add gig. Please try again.');
      }
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.formGroup}>
        <ValidatedInput
          label="Gig Title"
          required
          value={values.title}
          onChangeText={handleChange('title')}
          onBlur={handleBlur('title')}
          error={errors.title}
          touched={touched.title}
          placeholder="Jazz Night, Wedding Performance, etc."
          autoFocus
        />
      </View>

      <View style={styles.formGroup}>
        <ValidatedInput
          label="Venue Name"
          required
          value={values.venueName}
          onChangeText={handleChange('venueName')}
          onBlur={handleBlur('venueName')}
          error={errors.venueName}
          touched={touched.venueName}
          placeholder="The Blue Note, City Hall, etc."
        />
      </View>

      <View style={styles.formGroup}>
        <ValidatedInput
          label="Address"
          value={values.address}
          onChangeText={handleChange('address')}
          onBlur={handleBlur('address')}
          error={errors.address}
          touched={touched.address}
          placeholder="123 Main St, City, State"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.formGroup}>
        <CustomDateTimePicker
          label="Date"
          value={values.date}
          onChange={(date) => setFieldValue('date', date)}
          mode="date"
          placeholder="Select a date"
        />
        {touched.date && errors.date && (
          <Text style={styles.errorText}>{errors.date}</Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <CustomDateTimePicker
          label="Call Time"
          value={values.callTime}
          onChange={(callTime) => setFieldValue('callTime', callTime)}
          mode="time"
          placeholder="Select call time"
        />
      </View>

      <View style={styles.formGroup}>
        <ValidatedInput
          label="Contact"
          value={values.contact}
          onChangeText={handleChange('contact')}
          onBlur={handleBlur('contact')}
          error={errors.contact}
          touched={touched.contact}
          placeholder="Venue manager, booker, etc."
        />
      </View>

      <View style={styles.formGroup}>
        <ValidatedInput
          label="Compensation"
          value={values.compensation}
          onChangeText={handleChange('compensation')}
          onBlur={handleBlur('compensation')}
          error={errors.compensation}
          touched={touched.compensation}
          placeholder="$200, $50/hr, etc."
        />
      </View>

      <View style={styles.formGroup}>
        <ValidatedInput
          label="Notes"
          value={values.notes}
          onChangeText={handleChange('notes')}
          onBlur={handleBlur('notes')}
          error={errors.notes}
          touched={touched.notes}
          placeholder="Additional details about the gig"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, (!values.title.trim() || !values.venueName.trim() || !values.date || isSubmitting) && styles.saveButtonDisabled]} 
          onPress={() => handleSubmit()}
          disabled={!values.title.trim() || !values.venueName.trim() || !values.date || isSubmitting}
        >
          <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save Gig'}</Text>
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
    paddingBottom: 40,
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
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  required: {
    color: colors.error,
  },
});