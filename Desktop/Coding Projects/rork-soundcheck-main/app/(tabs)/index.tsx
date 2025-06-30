import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Music, Plus, ListPlus } from 'lucide-react-native';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { TaskItem, EventItem } from '@/components/RehearsalItem';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { useRehearsalStore } from '@/store/rehearsalStore';
import { colors } from '@/constants/colors';
import { taskCompleted, taskDeleted, errorOccurred } from '@/utils/haptics';

export default function RehearsalScreen() {
  const { tasks, events, isLoading, toggleTaskCompletion, deleteTask, deleteEvent } = useRehearsalStore();
  const [activeTab, setActiveTab] = useState<'tasks' | 'events'>('tasks');
  const [refreshing, setRefreshing] = useState(false);

  const handleAddPress = useCallback(() => {
    if (activeTab === 'tasks') {
      router.push('/add-rehearsal');
    } else {
      router.push('/add-rehearsal-event');
    }
  }, [activeTab]);

  const handleTaskPress = useCallback((taskId: string) => {
    router.push({
      pathname: '/edit-rehearsal',
      params: { id: taskId }
    });
  }, []);

  const handleEventPress = useCallback((eventId: string) => {
    router.push({
      pathname: '/edit-rehearsal-event',
      params: { id: eventId }
    });
  }, []);

  const handleTaskToggle = useCallback(async (taskId: string) => {
    try {
      await toggleTaskCompletion(taskId);
      taskCompleted();
    } catch (error) {
      errorOccurred();
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  }, [toggleTaskCompletion]);

  const handleTaskLongPress = useCallback((taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
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

  const handleEventLongPress = useCallback((eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? All associated tasks will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteEvent(eventId);
            taskDeleted();
          } catch (error) {
            errorOccurred();
            Alert.alert('Error', 'Failed to delete event. Please try again.');
          }
        }}
      ]
    );
  }, [deleteEvent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const renderTaskItem = useCallback(({ item }: { item: any }) => (
    <TaskItem
      task={item}
      onToggle={() => handleTaskToggle(item.id)}
      onPress={() => handleTaskPress(item.id)}
    />
  ), [handleTaskToggle, handleTaskPress]);

  const renderEventItem = useCallback(({ item }: { item: any }) => (
    <EventItem
      event={item}
      onPress={() => handleEventPress(item.id)}
    />
  ), [handleEventPress]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  if (isLoading && tasks.length === 0 && events.length === 0) {
    return <LoadingState type="skeleton" skeletonType="list" count={5} />;
  }

  return (
    <View style={styles.container} accessibilityLabel="Rehearsal Screen" focusable>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
          accessibilityRole="button"
          accessibilityState={{ selected: activeTab === 'tasks' }}
          accessibilityLabel="Tasks tab"
          accessibilityHint="Shows your rehearsal tasks"
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
            Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
          accessibilityRole="button"
          accessibilityState={{ selected: activeTab === 'events' }}
          accessibilityLabel="Events tab"
          accessibilityHint="Shows your rehearsal events"
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tasks' ? (
        tasks.length > 0 ? (
          <FlatList
            data={tasks}
            renderItem={renderTaskItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 88,
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
            title="No Rehearsal Tasks"
            message="Add tasks to prepare for your rehearsals and track your progress."
            icon={<Music size={48} color={colors.primary} />}
            accessibilityLabel="No rehearsal tasks found. Add tasks to prepare for your rehearsals and track your progress."
          />
        )
      ) : (
        events.length > 0 ? (
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 120,
              offset: 120 * index,
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
            title="No Rehearsal Events"
            message="Create events to organize your rehearsal schedule."
            icon={<ListPlus size={48} color={colors.primary} />}
            accessibilityLabel="No rehearsal events found. Create events to organize your rehearsal schedule."
          />
        )
      )}

      <FloatingActionButton
        onPress={handleAddPress}
        accessibilityLabel={activeTab === 'tasks' ? "Add new rehearsal task" : "Add new rehearsal event"}
        accessibilityHint="Opens a screen to create a new item"
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
});
