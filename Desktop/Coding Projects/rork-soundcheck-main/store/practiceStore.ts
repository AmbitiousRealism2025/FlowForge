import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { PracticeTask } from '@/types';
import { PERSIST_STORAGE_PRACTICE } from '@/constants/storageKeys';
import { retryAsyncStorage } from '@/utils/retry';
import { logError, logWarning } from '@/services/errorLogging';

/**
 * Current version of the store schema for migration purposes
 */
const STORE_VERSION = 1;

/**
 * Practice store state history for undo/redo functionality
 */
interface PracticeStoreHistory {
  past: { tasks: PracticeTask[], categories: string[] }[];
  present: { tasks: PracticeTask[], categories: string[] };
  future: { tasks: PracticeTask[], categories: string[] }[];
}

/**
 * Optimistic update operations for better UX
 */
type OptimisticOperation = {
  id: string;
  type: 'add' | 'update' | 'delete' | 'toggle' | 'addCategory' | 'deleteCategory';
  originalState?: { tasks: PracticeTask[], categories: string[] };
  rollback: () => void;
};

// Define the keys that represent dates in the PracticeTask object
const practiceTaskDateKeys: (keyof PracticeTask)[] = ['dueDate'];

/**
 * Custom storage handler for Practice store with enhanced error handling
 */
const customPracticeStorage = {
  setItem: async (name: string, value: { state: any, version?: number }) => {
    try {
      const stringifiedValue = JSON.stringify(value);
      await retryAsyncStorage(
        () => AsyncStorage.setItem(name, stringifiedValue),
        'practice-save'
      );
    } catch (error) {
      logError(error as Error, { operation: 'practice-save', storageKey: name });
      throw error;
    }
  },
  getItem: async (name: string) => {
    try {
      const str = await AsyncStorage.getItem(name);
      if (!str) {
        return null;
      }
      const parsedValue: { state: any, version?: number } = JSON.parse(str);

      if (parsedValue.state && parsedValue.state.tasks) {
        parsedValue.state.tasks = parsedValue.state.tasks.map((task: any) => {
          const newTask = { ...task };
          for (const key of practiceTaskDateKeys) {
            if (newTask[key] && typeof newTask[key] === 'string') {
              const d = new Date(newTask[key]);
              newTask[key] = !isNaN(d.getTime()) ? d : null;
            }
          }
          return newTask as PracticeTask;
        });
      }
      return parsedValue;
    } catch (error) {
      logError(error as Error, { operation: 'practice-load', storageKey: name });
      return null;
    }
  },
  removeItem: async (name: string) => {
    try {
      await retryAsyncStorage(
        () => AsyncStorage.removeItem(name),
        'practice-remove'
      );
    } catch (error) {
      logError(error as Error, { operation: 'practice-remove', storageKey: name });
      throw error;
    }
  }
};

/**
 * Enhanced Practice store state interface with optimistic updates and selectors
 */
interface PracticeState {
  // Core state
  tasks: PracticeTask[];
  categories: string[];
  history: PracticeStoreHistory;
  pendingOperations: Map<string, OptimisticOperation>;
  isLoading: boolean;
  error: string | null;
  
  // Actions with optimistic updates
  addTask: (task: Omit<PracticeTask, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<PracticeTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  
  // Batch operations
  markMultipleCompleted: (taskIds: string[]) => Promise<void>;
  deleteMultipleTasks: (taskIds: string[]) => Promise<void>;
  
  // Undo/Redo functionality
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Error handling
  clearError: () => void;
  retryFailedOperation: (operationId: string) => Promise<void>;
  
  // Selectors (computed state)
  getTasksByCategory: (category?: string) => PracticeTask[];
  getCompletedTasks: () => PracticeTask[];
  getPendingTasks: () => PracticeTask[];
  getOverdueTasks: () => PracticeTask[];
  getTasksForToday: () => PracticeTask[];
  getTaskById: (id: string) => PracticeTask | undefined;
  getTotalTasks: () => number;
  getCompletionStats: () => { completed: number; total: number; percentage: number };
  getTasksByDateRange: (startDate: Date, endDate: Date) => PracticeTask[];
}

/**
 * Creates the enhanced Practice store with optimistic updates, selectors, and undo/redo
 */
export const usePracticeStore = create<PracticeState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        tasks: [],
        categories: ['Technique', 'Repertoire', 'Theory', 'Other'],
        history: {
          past: [],
          present: { tasks: [], categories: ['Technique', 'Repertoire', 'Theory', 'Other'] },
          future: []
        },
        pendingOperations: new Map(),
        isLoading: false,
        error: null,
        
        /**
         * Adds a new practice task with optimistic updates
         * @param task - The task data without ID
         */
        addTask: async (task) => {
          const operationId = uuidv4();
          const newTask = { ...task, id: uuidv4(), completed: false };
          const currentState = get();
          
          try {
            // Optimistic update
            const newTasks = [...currentState.tasks, newTask];
            const newPresent = { tasks: newTasks, categories: currentState.categories };
            
            set({
              tasks: newTasks,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'add',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to add task'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'addTask', taskId: newTask.id });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Updates an existing practice task with optimistic updates
         * @param id - The task ID to update
         * @param updates - Partial task data to update
         */
        updateTask: async (id, updates) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newTasks = currentState.tasks.map(t =>
              t.id === id ? { ...t, ...updates } : t
            );
            const newPresent = { tasks: newTasks, categories: currentState.categories };
            
            set({
              tasks: newTasks,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'update',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to update task'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'updateTask', taskId: id });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Deletes a practice task with optimistic updates
         * @param id - The task ID to delete
         */
        deleteTask: async (id) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newTasks = currentState.tasks.filter(t => t.id !== id);
            const newPresent = { tasks: newTasks, categories: currentState.categories };
            
            set({
              tasks: newTasks,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'delete',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to delete task'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'deleteTask', taskId: id });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Toggles task completion status with optimistic updates
         * @param id - The task ID to toggle
         */
        toggleTaskCompletion: async (id) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newTasks = currentState.tasks.map(t =>
              t.id === id ? { ...t, completed: !t.completed } : t
            );
            const newPresent = { tasks: newTasks, categories: currentState.categories };
            
            set({
              tasks: newTasks,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'toggle',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to toggle task completion'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'toggleTaskCompletion', taskId: id });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Adds a new category with optimistic updates
         * @param category - The category name to add
         */
        addCategory: async (category) => {
          const operationId = uuidv4();
          const currentState = get();
          
          // Check if category already exists
          if (currentState.categories.includes(category)) {
            logWarning('Category already exists', { category });
            return;
          }
          
          try {
            // Optimistic update
            const newCategories = [...currentState.categories, category];
            const newPresent = { tasks: currentState.tasks, categories: newCategories };
            
            set({
              categories: newCategories,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'addCategory',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to add category'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'addCategory', category });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Deletes a category and updates tasks with optimistic updates
         * @param category - The category name to delete
         */
        deleteCategory: async (category) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newCategories = currentState.categories.filter(c => c !== category);
            const newTasks = currentState.tasks.map(t =>
              t.category === category ? { ...t, category: undefined } : t
            );
            const newPresent = { tasks: newTasks, categories: newCategories };
            
            set({
              categories: newCategories,
              tasks: newTasks,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'deleteCategory',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to delete category'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'deleteCategory', category });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Mark multiple tasks as completed
         * @param taskIds - Array of task IDs to mark as completed
         */
        markMultipleCompleted: async (taskIds) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newTasks = currentState.tasks.map(t =>
              taskIds.includes(t.id) ? { ...t, completed: true } : t
            );
            const newPresent = { tasks: newTasks, categories: currentState.categories };
            
            set({
              tasks: newTasks,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'update',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to mark tasks as completed'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'markMultipleCompleted', taskIds });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Delete multiple tasks
         * @param taskIds - Array of task IDs to delete
         */
        deleteMultipleTasks: async (taskIds) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newTasks = currentState.tasks.filter(t => !taskIds.includes(t.id));
            const newPresent = { tasks: newTasks, categories: currentState.categories };
            
            set({
              tasks: newTasks,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newPresent,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'delete',
              originalState: { tasks: currentState.tasks, categories: currentState.categories },
              rollback: () => {
                set({
                  tasks: currentState.tasks,
                  categories: currentState.categories,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to delete tasks'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'deleteMultipleTasks', taskIds });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Undo the last operation
         */
        undo: () => {
          const currentState = get();
          const { past, present, future } = currentState.history;
          
          if (past.length === 0) {
            logWarning('No actions to undo');
            return;
          }
          
          const previous = past[past.length - 1];
          const newPast = past.slice(0, past.length - 1);
          
          set({
            tasks: previous.tasks,
            categories: previous.categories,
            history: {
              past: newPast,
              present: previous,
              future: [present, ...future]
            }
          });
        },
        
        /**
         * Redo the last undone operation
         */
        redo: () => {
          const currentState = get();
          const { past, present, future } = currentState.history;
          
          if (future.length === 0) {
            logWarning('No actions to redo');
            return;
          }
          
          const next = future[0];
          const newFuture = future.slice(1);
          
          set({
            tasks: next.tasks,
            categories: next.categories,
            history: {
              past: [...past, present],
              present: next,
              future: newFuture
            }
          });
        },
        
        /**
         * Check if undo is available
         */
        canUndo: () => get().history.past.length > 0,
        
        /**
         * Check if redo is available
         */
        canRedo: () => get().history.future.length > 0,
        
        /**
         * Clear the current error state
         */
        clearError: () => set({ error: null }),
        
        /**
         * Retry a failed operation
         * @param operationId - The ID of the failed operation
         */
        retryFailedOperation: async (operationId) => {
          const operation = get().pendingOperations.get(operationId);
          if (operation) {
            logWarning(`Retrying operation: ${operation.type}`, { operationId });
            // This would typically re-execute the original operation
          }
        },
        
        // Selectors (computed state)
        /**
         * Get tasks by category
         * @param category - Optional category filter
         */
        getTasksByCategory: (category) => {
          const tasks = get().tasks;
          if (!category) return tasks;
          return tasks.filter(task => task.category === category);
        },
        
        /**
         * Get all completed tasks
         */
        getCompletedTasks: () => {
          return get().tasks.filter(task => task.completed);
        },
        
        /**
         * Get all pending (incomplete) tasks
         */
        getPendingTasks: () => {
          return get().tasks.filter(task => !task.completed);
        },
        
        /**
         * Get all overdue tasks
         */
        getOverdueTasks: () => {
          const now = new Date();
          return get().tasks.filter(task => 
            !task.completed && task.dueDate && task.dueDate < now
          );
        },
        
        /**
         * Get tasks due today
         */
        getTasksForToday: () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          return get().tasks.filter(task => 
            task.dueDate && 
            task.dueDate >= today && 
            task.dueDate < tomorrow
          );
        },
        
        /**
         * Get a specific task by ID
         * @param id - The task ID
         */
        getTaskById: (id) => {
          return get().tasks.find(task => task.id === id);
        },
        
        /**
         * Get the total number of tasks
         */
        getTotalTasks: () => get().tasks.length,
        
        /**
         * Get completion statistics
         */
        getCompletionStats: () => {
          const tasks = get().tasks;
          const completed = tasks.filter(task => task.completed).length;
          const total = tasks.length;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          
          return { completed, total, percentage };
        },
        
        /**
         * Get tasks within a date range
         * @param startDate - The start date
         * @param endDate - The end date
         */
        getTasksByDateRange: (startDate, endDate) => {
          return get().tasks.filter(task => {
            if (!task.dueDate) return false;
            return task.dueDate >= startDate && task.dueDate <= endDate;
          });
        }
      }),
      {
        name: PERSIST_STORAGE_PRACTICE,
        storage: customPracticeStorage,
        version: STORE_VERSION,
        migrate: (persistedState: any, version: number) => {
          // Handle state migration for app updates
          if (version < STORE_VERSION) {
            logWarning('Migrating practice store state', { fromVersion: version, toVersion: STORE_VERSION });
            
            // Add migration logic here for future versions
            return {
              ...persistedState,
              history: {
                past: [],
                present: { 
                  tasks: persistedState.tasks || [], 
                  categories: persistedState.categories || ['Technique', 'Repertoire', 'Theory', 'Other'] 
                },
                future: []
              },
              pendingOperations: new Map(),
              isLoading: false,
              error: null
            };
          }
          return persistedState;
        }
      }
    )
  )
);

/**
 * Selector hooks for optimized re-renders
 */
export const useTasksByCategory = (category?: string) => usePracticeStore(state => state.getTasksByCategory(category));
export const useCompletedTasks = () => usePracticeStore(state => state.getCompletedTasks());
export const usePendingTasks = () => usePracticeStore(state => state.getPendingTasks());
export const useOverdueTasks = () => usePracticeStore(state => state.getOverdueTasks());
export const useTasksForToday = () => usePracticeStore(state => state.getTasksForToday());
export const useTaskById = (id: string) => usePracticeStore(state => state.getTaskById(id));
export const usePracticeStoreError = () => usePracticeStore(state => state.error);
export const usePracticeStoreLoading = () => usePracticeStore(state => state.isLoading);
export const usePracticeStoreHistory = () => usePracticeStore(state => ({ 
  canUndo: state.canUndo(), 
  canRedo: state.canRedo(),
  undo: state.undo,
  redo: state.redo
}));
export const useCompletionStats = () => usePracticeStore(state => state.getCompletionStats());
export const usePracticeCategories = () => usePracticeStore(state => state.categories);