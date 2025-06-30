import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { RehearsalTask, RehearsalEvent } from '@/types';
import { PERSIST_STORAGE_REHEARSALS } from '@/constants/storageKeys';
import { retryAsyncStorage } from '@/utils/retry';

// Define date keys for RehearsalTask and RehearsalEvent
const rehearsalTaskDateKeys: (keyof RehearsalTask)[] = ['dueDate'];
const rehearsalEventDateKeys: (keyof RehearsalEvent)[] = ['date'];

// Define the state structure for type safety in custom storage
interface RehearsalStorageState {
  tasks: RehearsalTask[];
  events: RehearsalEvent[];
}

// Custom storage object for Rehearsal store
const customRehearsalStorage = {
  setItem: async (name: string, value: { state: RehearsalStorageState, version?: number }) => {
    try {
      const stringifiedValue = JSON.stringify(value);
      await retryAsyncStorage(
        () => AsyncStorage.setItem(name, stringifiedValue),
        'rehearsal-save'
      );
    } catch (error) {
      console.error('Error saving rehearsal data:', error);
      throw error;
    }
  },
  getItem: async (name: string) => {
    try {
      const str = await AsyncStorage.getItem(name);
      if (!str) {
        return null;
      }
      const parsedValue: { state: RehearsalStorageState, version?: number } = JSON.parse(str);

      // Revive dates for tasks
      if (parsedValue.state.tasks) {
        parsedValue.state.tasks = parsedValue.state.tasks.map((task) => {
          const newTask = { ...task };
          for (const key of rehearsalTaskDateKeys) {
            if (newTask[key] && typeof newTask[key] === 'string') {
              const d = new Date(newTask[key] as string);
              (newTask as any)[key] = !isNaN(d.getTime()) ? d : null;
            }
          }
          return newTask as RehearsalTask;
        });
      }

      // Revive dates for events
      if (parsedValue.state.events) {
        parsedValue.state.events = parsedValue.state.events.map((event) => {
          const newEvent = { ...event };
          for (const key of rehearsalEventDateKeys) {
            if (newEvent[key] && typeof newEvent[key] === 'string') {
              const d = new Date(newEvent[key] as string);
              (newEvent as any)[key] = !isNaN(d.getTime()) ? d : null;
            }
          }
          return newEvent as RehearsalEvent;
        });
      }
      return parsedValue;
    } catch (error) {
      console.error('Error loading rehearsal data:', error);
      return null;
    }
  },
  removeItem: async (name: string) => {
    try {
      await retryAsyncStorage(
        () => AsyncStorage.removeItem(name),
        'rehearsal-remove'
      );
    } catch (error) {
      console.error('Error removing rehearsal data:', error);
      throw error;
    }
  }
};

interface RehearsalState extends RehearsalStorageState {
  isLoading: boolean;
  addTask: (task: Omit<RehearsalTask, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<RehearsalTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  reorderTasks: (tasks: RehearsalTask[]) => void;
  addEvent: (event: Omit<RehearsalEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<RehearsalEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useRehearsalStore = create<RehearsalState>()(
  persist(
    (set) => ({
      tasks: [],
      events: [],
      isLoading: false,
      
      addTask: async (task) => {
        set({ isLoading: true });
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 300));
          set((state) => ({
            tasks: [...state.tasks, { ...task, id: uuidv4(), completed: false }],
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateTask: async (id, updates) => {
        set({ isLoading: true });
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 200));
          set((state) => ({
            tasks: state.tasks.map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      deleteTask: async (id) => {
        set({ isLoading: true });
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 200));
          set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      toggleTaskCompletion: async (id) => {
        set({ isLoading: true });
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 150));
          set((state) => ({
            tasks: state.tasks.map(t =>
              t.id === id ? { ...t, completed: !t.completed } : t
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      reorderTasks: (tasks) => set(() => ({ tasks })),
      
      addEvent: async (event) => {
        set({ isLoading: true });
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 300));
          set((state) => ({
            events: [...state.events, { ...event, id: uuidv4() }],
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateEvent: async (id, updates) => {
        set({ isLoading: true });
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 200));
          set((state) => ({
            events: state.events.map(e =>
              e.id === id ? { ...e, ...updates } : e
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      deleteEvent: async (id) => {
        set({ isLoading: true });
        try {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 200));
          set((state) => ({
            events: state.events.filter(e => e.id !== id),
            tasks: state.tasks.filter(t => t.eventId !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: PERSIST_STORAGE_REHEARSALS,
      storage: customRehearsalStorage, // Use the custom storage object
    }
  )
);
