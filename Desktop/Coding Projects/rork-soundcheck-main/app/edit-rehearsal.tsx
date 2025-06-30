import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useRehearsalStore } from '@/store/rehearsalStore';
import { CustomDateTimePicker } from '@/components/DateTimePicker';
import { colors } from '@/constants/colors';

export default function EditRehearsalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, events, updateTask, deleteTask } = useRehearsalStore();
  
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [completed, setCompleted] = useState(false);

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

    setTitle(task.title);
    setNote(task.note || '');
    setDueDate(task.dueDate);
    setEventId(task.eventId);
    setCompleted(task.completed);
  }, [id, tasks]);

  const handleSave = () => {
    if (!title.trim() || !id) {
      return;
    }

    updateTask(id, {
      title: title.trim(),
      note: note.trim() || undefined,
      dueDate,
      eventId,
      completed,
    });

    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            if (id) {
              deleteTask(id);
              router.back();
            }
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Task Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What do you need to do?"
          placeholderTextColor={colors.subtext}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={note}
          onChangeText={setNote}
          placeholder="Add any details about this task"
          placeholderTextColor={colors.subtext}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <CustomDateTimePicker
        label="Due Date"
        value={dueDate}
        onChange={setDueDate}
        mode="date"
        placeholder="Select a due date (optional)"
      />

      {events.length > 0 && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Assign to Event</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsContainer}>
            <TouchableOpacity
              style={[styles.eventChip, !eventId && styles.selectedEventChip]}
              onPress={() => setEventId(undefined)}
            >
              <Text style={[styles.eventChipText, !eventId && styles.selectedEventChipText]}>
                None
              </Text>
            </TouchableOpacity>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventChip, eventId === event.id && styles.selectedEventChip]}
                onPress={() => setEventId(event.id)}
              >
                <Text style={[styles.eventChipText, eventId === event.id && styles.selectedEventChipText]}>
                  {event.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.completionContainer}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[styles.statusButton, !completed && styles.activeStatusButton]}
            onPress={() => setCompleted(false)}
          >
            <Text style={[styles.statusButtonText, !completed && styles.activeStatusButtonText]}>
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, completed && styles.activeStatusButton]}
            onPress={() => setCompleted(true)}
          >
            <Text style={[styles.statusButtonText, completed && styles.activeStatusButtonText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!title.trim()}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
  eventsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  eventChip: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedEventChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventChipText: {
    color: colors.text,
    fontWeight: '500',
  },
  selectedEventChipText: {
    color: '#FFFFFF',
  },
  completionContainer: {
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  activeStatusButton: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    fontWeight: '500',
    color: colors.text,
  },
  activeStatusButtonText: {
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
