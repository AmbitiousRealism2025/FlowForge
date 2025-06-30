import React, { memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Check, Calendar, MapPin } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { RehearsalTask, RehearsalEvent } from '@/types';

interface TaskItemProps {
  task: RehearsalTask;
  onToggle: () => void;
  onPress: () => void;
}

export const TaskItem = memo(({ task, onToggle, onPress }: TaskItemProps) => {
  return (
    <TouchableOpacity 
      style={styles.taskContainer} 
      onPress={onPress} 
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${task.title}${task.completed ? ', completed' : ''}`}
      accessibilityHint="Opens the rehearsal task details"
    >
      <TouchableOpacity 
        style={[styles.checkbox, task.completed && styles.checkboxChecked]} 
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
        accessibilityHint="Toggles the completion status of this rehearsal task"
      >
        {task.completed && <Check size={16} color="#FFFFFF" />}
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>
          {task.title}
        </Text>
        {task.note && (
          <Text style={styles.taskNote} numberOfLines={1}>
            {task.note}
          </Text>
        )}
        {task.dueDate && (
          <View style={styles.dateContainer}>
            <Calendar size={14} color={colors.subtext} />
            <Text style={styles.dateText}>
              {task.dueDate.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

TaskItem.displayName = 'TaskItem';

interface EventItemProps {
  event: RehearsalEvent;
  onPress: () => void;
}

export const EventItem = memo(({ event, onPress }: EventItemProps) => {
  return (
    <TouchableOpacity 
      style={styles.eventContainer} 
      onPress={onPress} 
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${event.name}${event.date ? ` on ${event.date.toLocaleDateString()}` : ''}${event.location ? ` at ${event.location}` : ''}`}
      accessibilityHint="Opens the rehearsal event details"
    >
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.name}</Text>
        <View style={styles.eventDetails}>
          {event.date && (
            <View style={styles.eventDetail}>
              <Calendar size={14} color={colors.subtext} />
              <Text style={styles.eventDetailText}>
                {event.date.toLocaleDateString()}
              </Text>
            </View>
          )}
          {event.location && (
            <View style={styles.eventDetail}>
              <MapPin size={14} color={colors.subtext} />
              <Text style={styles.eventDetailText}>{event.location}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

EventItem.displayName = 'EventItem';

const styles = StyleSheet.create({
  taskContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: colors.subtext,
  },
  taskNote: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 4,
  },
  eventContainer: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.subtext,
    marginLeft: 4,
  },
});
