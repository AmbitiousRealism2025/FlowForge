import React, { useState, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, Plus } from 'lucide-react-native';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { PracticeItem } from '@/components/PracticeItem';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { usePracticeStore } from '@/store/practiceStore';
import { colors } from '@/constants/colors';
import { taskCompleted, taskDeleted, categoryChanged, errorOccurred } from '@/utils/haptics';
import { useContextualAnnouncement, a11y, useFocusManagement } from '@/utils/accessibility';

export default function PracticeScreen() {
  const { tasks, categories, isLoading, toggleTaskCompletion, deleteTask } = usePracticeStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { announce } = useContextualAnnouncement();
  const { setFocusWithDelay } = useFocusManagement();
  const screenRef = useRef<View>(null);

  const handleAddPress = useCallback(() => {
    router.push('/add-practice');
  }, []);

  const handleTaskPress = useCallback((taskId: string) => {
    router.push({
      pathname: '/edit-practice',
      params: { id: taskId }
    });
  }, []);

  const handleTaskToggle = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      await toggleTaskCompletion(taskId);
      taskCompleted();
      if (task) {
        const newState = !task.completed;
        const announcement = a11y.stateChangeAnnouncement(
          newState ? 'Completed' : 'Marked incomplete',
          task.title
        );
        announce(announcement, 'polite');
      }
    } catch (error) {
      errorOccurred();
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  }, [toggleTaskCompletion, tasks, announce]);

  const handleTaskLongPress = useCallback((taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this practice task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteTask(taskId);
            taskDeleted();
          } catch (error) {
            errorOccurred();
            Alert.alert('Error', 'Failed to delete task. Please try again.');
          }
        }}
      ]
    );
  }, [deleteTask]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const filteredTasks = useMemo(() => {
    return selectedCategory 
      ? tasks.filter(task => task.category === selectedCategory)
      : tasks;
  }, [tasks, selectedCategory]);

  const renderTask = useCallback(({ item }: { item: any }) => (
    <PracticeItem
      task={item}
      onToggle={() => handleTaskToggle(item.id)}
      onPress={() => handleTaskPress(item.id)}
    />
  ), [handleTaskToggle, handleTaskPress]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (isLoading && tasks.length === 0) {
    return <LoadingState type="skeleton" skeletonType="list" count={5} />;
  }

  return (
    <View 
      ref={screenRef}
      style={styles.container} 
      accessibilityLabel="Practice Screen" 
      focusable
      accessible
      accessibilityRole="main"
    >
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === null && styles.selectedCategoryChip]}
            onPress={() => {
              setSelectedCategory(null);
              categoryChanged();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === null }}
            accessibilityLabel="Filter tasks by All categories"
            accessibilityHint="Shows all practice tasks"
          >
            <Text style={[styles.categoryChipText, selectedCategory === null && styles.selectedCategoryChipText]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryChip, selectedCategory === category && styles.selectedCategoryChip]}
              onPress={() => {
                setSelectedCategory(category);
                categoryChanged();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === category }}
              accessibilityLabel={`Filter tasks by ${category} category`}
              accessibilityHint={`Shows practice tasks in the ${category} category`}
            >
              <Text style={[styles.categoryChipText, selectedCategory === category && styles.selectedCategoryChipText]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {filteredTasks.length > 0 ? (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 88, // Approximate height of PracticeItem
            offset: 88 * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <EmptyState
          title="No Practice Tasks"
          message="Add tasks to track your personal practice goals and progress."
          icon={<BookOpen size={48} color={colors.primary} />}
          accessibilityLabel={`No practice tasks found${selectedCategory ? ` for the ${selectedCategory} category` : ''}. Add tasks to track your personal practice goals and progress.`}
        />
      )}

      <FloatingActionButton
        onPress={handleAddPress}
        accessibilityLabel="Add new practice task"
        accessibilityHint="Opens a screen to create a new practice task"
        accessibilityRole="button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
});
