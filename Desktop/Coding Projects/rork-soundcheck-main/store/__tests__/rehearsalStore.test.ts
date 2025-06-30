

import { useRehearsalStore } from '../rehearsalStore';
import type { RehearsalEvent, RehearsalTask } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('RehearsalStore', () => {
  let store: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    // Reset store state
    store = useRehearsalStore.getState();
    useRehearsalStore.setState({ tasks: [], events: [] });
  });

  describe('Task Management', () => {
    it('should add a new task', () => {
      const taskData = {
        title: 'Practice new song',
        note: 'Focus on the bridge section',
        dueDate: new Date('2024-12-31'),
      };

      store.addTask(taskData);

      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0]).toMatchObject({
        ...taskData,
        completed: false,
        id: expect.any(String),
      });
    });

    it('should update an existing task', () => {
      // First add a task
      store.addTask({ title: 'Original task' });
      const taskId = store.tasks[0].id;

      // Update the task
      store.updateTask(taskId, { 
        title: 'Updated task',
        completed: true 
      });

      expect(store.tasks[0]).toMatchObject({
        title: 'Updated task',
        completed: true,
        id: taskId,
      });
    });

    it('should toggle task completion', () => {
      store.addTask({ title: 'Test task' });
      const taskId = store.tasks[0].id;

      expect(store.tasks[0].completed).toBe(false);

      store.toggleTaskCompletion(taskId);
      expect(store.tasks[0].completed).toBe(true);

      store.toggleTaskCompletion(taskId);
      expect(store.tasks[0].completed).toBe(false);
    });

    it('should delete a task', () => {
      store.addTask({ title: 'Task 1' });
      store.addTask({ title: 'Task 2' });
      const taskId = store.tasks[0].id;

      expect(store.tasks).toHaveLength(2);

      store.deleteTask(taskId);

      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].title).toBe('Task 2');
    });

    it('should handle invalid task operations gracefully', () => {
      const invalidId = 'non-existent-id';

      // These should not throw errors
      expect(() => store.updateTask(invalidId, { title: 'New' })).not.toThrow();
      expect(() => store.toggleTaskCompletion(invalidId)).not.toThrow();
      expect(() => store.deleteTask(invalidId)).not.toThrow();
    });
  });

  describe('Event Management', () => {
    it('should add a new event', () => {
      const eventData = {
        name: 'Band Practice',
        date: new Date('2024-12-25'),
        location: 'Studio A',
      };

      store.addEvent(eventData);

      expect(store.events).toHaveLength(1);
      expect(store.events[0]).toMatchObject({
        ...eventData,
        id: expect.any(String),
      });
    });

    it('should update an existing event', () => {
      store.addEvent({ name: 'Original event' });
      const eventId = store.events[0].id;

      store.updateEvent(eventId, {
        name: 'Updated event',
        location: 'New location',
      });

      expect(store.events[0]).toMatchObject({
        name: 'Updated event',
        location: 'New location',
        id: eventId,
      });
    });

    it('should delete an event and its associated tasks', () => {
      // Add an event
      store.addEvent({ name: 'Test Event' });
      const eventId = store.events[0].id;

      // Add tasks associated with the event
      store.addTask({ title: 'Task 1', eventId });
      store.addTask({ title: 'Task 2', eventId });
      store.addTask({ title: 'Task 3' }); // No eventId

      expect(store.events).toHaveLength(1);
      expect(store.tasks).toHaveLength(3);

      // Delete the event
      store.deleteEvent(eventId);

      expect(store.events).toHaveLength(0);
      expect(store.tasks).toHaveLength(1);
      expect(store.tasks[0].title).toBe('Task 3');
    });
  });

  describe('Persistence', () => {
    it('should persist state changes', async () => {
      store.addTask({ title: 'Persistent task' });
      
      // Wait for the persist middleware to save
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});