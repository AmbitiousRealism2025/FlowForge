import React, { memo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Check, Calendar, Tag } from 'lucide-react-native';
import { colors, getThemeColors } from '@/constants/colors';
import { useFontScaling, useHighContrast } from '@/utils/accessibility';
import { PracticeTask } from '@/types';

interface PracticeItemProps {
  task: PracticeTask;
  onToggle: () => void;
  onPress: () => void;
}

export const PracticeItem = memo(({ task, onToggle, onPress }: PracticeItemProps) => {
  // Ensure dueDate is a proper Date object
  const dueDate = task.dueDate instanceof Date ? task.dueDate : task.dueDate ? new Date(task.dueDate) : undefined;
  const { scaledSize } = useFontScaling();
  const isHighContrast = useHighContrast();
  const themeColors = getThemeColors(isHighContrast);

  return (
    <TouchableOpacity
      style={[styles.taskContainer, { backgroundColor: themeColors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${task.title}${task.completed ? ', completed' : ''}`}
      accessibilityHint="Opens the practice task details"
    >
      <TouchableOpacity
        style={[styles.checkbox, { borderColor: themeColors.primary }, task.completed && { backgroundColor: themeColors.primary }]}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
        accessibilityHint="Toggles the completion status of this task"
      >
        {task.completed && <Check size={16} color="#FFFFFF" />}
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: themeColors.text, fontSize: scaledSize(16) }, task.completed && { color: themeColors.subtext, textDecorationLine: 'line-through' }]}>
          {task.title}
        </Text>
        {task.note && (
          <Text style={[styles.taskNote, { fontSize: scaledSize(14) }]} numberOfLines={1}>
            {task.note}
          </Text>
        )}
        <View style={styles.taskDetails}>
          {dueDate && (
            <View style={styles.detailItem}>
              <Calendar size={14} color={colors.subtext} />
              <Text style={[styles.detailText, { fontSize: scaledSize(12) }]}>
                {dueDate.toLocaleDateString()}
              </Text>
            </View>
          )}
          {task.category && (
            <View style={styles.detailItem}>
              <Tag size={14} color={colors.subtext} />
              <Text style={[styles.detailText, { fontSize: scaledSize(12) }]}>
                {task.category}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

PracticeItem.displayName = 'PracticeItem';

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
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 4,
  },
});
