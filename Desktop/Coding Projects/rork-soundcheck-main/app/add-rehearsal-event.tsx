import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useRehearsalStore } from '@/store/rehearsalStore';
import { CustomDateTimePicker } from '@/components/DateTimePicker';
import { colors } from '@/constants/colors';

export default function AddRehearsalEventScreen() {
  const { addEvent } = useRehearsalStore();
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    addEvent({
      name: name.trim(),
      date,
      location: location.trim() || undefined,
    });

    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Band rehearsal, Practice session, etc."
          placeholderTextColor={colors.subtext}
          autoFocus
        />
      </View>

      <CustomDateTimePicker
        label="Date"
        value={date}
        onChange={setDate}
        mode="date"
        placeholder="Select a date (optional)"
      />

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Where is this rehearsal taking place?"
          placeholderTextColor={colors.subtext}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!name.trim()}
        >
          <Text style={styles.saveButtonText}>Save Event</Text>
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
