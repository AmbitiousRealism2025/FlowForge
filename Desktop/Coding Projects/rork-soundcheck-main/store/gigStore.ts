import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Gig } from '@/types';
import { PERSIST_STORAGE_GIGS } from '@/constants/storageKeys';
import { retryAsyncStorage } from '@/utils/retry';
import { logError, logWarning } from '@/services/errorLogging';

/**
 * Current version of the store schema for migration purposes
 */
const STORE_VERSION = 1;

/**
 * Gig store state history for undo/redo functionality
 */
interface GigStoreHistory {
  past: Gig[][];
  present: Gig[];
  future: Gig[][];
}

/**
 * Optimistic update operations for better UX
 */
type OptimisticOperation = {
  id: string;
  type: 'add' | 'update' | 'delete';
  originalState?: Gig[];
  rollback: () => void;
};

// Define the keys that represent dates in the Gig object
const gigDateKeys: (keyof Gig)[] = ['date', 'callTime'];

/**
 * Custom storage handler for Gig store with enhanced error handling
 */
const customGigStorage = {
  setItem: async (name: string, value: { state: any, version?: number }) => {
    try {
      // JSON.stringify will convert Dates to ISO strings automatically.
      const stringifiedValue = JSON.stringify(value);
      await retryAsyncStorage(
        () => AsyncStorage.setItem(name, stringifiedValue),
        'gig-save'
      );
    } catch (error) {
      logError(error as Error, { operation: 'gig-save', storageKey: name });
      throw error;
    }
  },
  getItem: async (name: string) => {
    try {
      const str = await AsyncStorage.getItem(name);
      if (!str) {
        return null;
      }
      // Parse the string back into an object
      const parsedValue: { state: any, version?: number } = JSON.parse(str);

      // Revive date strings back into Date objects
      if (parsedValue.state && parsedValue.state.gigs) {
        parsedValue.state.gigs = parsedValue.state.gigs.map((gig: any) => {
          const newGig = { ...gig };
          for (const key of gigDateKeys) {
            if (newGig[key] && typeof newGig[key] === 'string') {
              const d = new Date(newGig[key]);
              // Assign the Date object if valid, otherwise keep original or set to null
              newGig[key] = !isNaN(d.getTime()) ? d : null;
            }
          }
          return newGig as Gig;
        });
      }
      return parsedValue;
    } catch (error) {
      logError(error as Error, { operation: 'gig-load', storageKey: name });
      return null;
    }
  },
  removeItem: async (name: string) => {
    try {
      await retryAsyncStorage(
        () => AsyncStorage.removeItem(name),
        'gig-remove'
      );
    } catch (error) {
      logError(error as Error, { operation: 'gig-remove', storageKey: name });
      throw error;
    }
  }
};

/**
 * Enhanced Gig store state interface with optimistic updates and selectors
 */
interface GigState {
  // Core state
  gigs: Gig[];
  history: GigStoreHistory;
  pendingOperations: Map<string, OptimisticOperation>;
  isLoading: boolean;
  error: string | null;
  
  // Actions with optimistic updates
  addGig: (gig: Omit<Gig, 'id'>) => Promise<void>;
  updateGig: (id: string, updates: Partial<Gig>) => Promise<void>;
  deleteGig: (id: string) => Promise<void>;
  
  // Undo/Redo functionality
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Error handling
  clearError: () => void;
  retryFailedOperation: (operationId: string) => Promise<void>;
  
  // Selectors (computed state)
  getUpcomingGigs: () => Gig[];
  getPastGigs: () => Gig[];
  getGigsByMonth: (year: number, month: number) => Gig[];
  getGigById: (id: string) => Gig | undefined;
  getTotalGigs: () => number;
  getGigsWithinDateRange: (startDate: Date, endDate: Date) => Gig[];
}

/**
 * Creates the enhanced Gig store with optimistic updates, selectors, and undo/redo
 */
export const useGigStore = create<GigState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        gigs: [],
        history: {
          past: [],
          present: [],
          future: []
        },
        pendingOperations: new Map(),
        isLoading: false,
        error: null,
        
        /**
         * Adds a new gig with optimistic updates
         * @param gig - The gig data without ID
         */
        addGig: async (gig) => {
          const operationId = uuidv4();
          const newGig = { ...gig, id: uuidv4() };
          const currentState = get();
          
          try {
            // Optimistic update
            const newGigs = [...currentState.gigs, newGig];
            set({
              gigs: newGigs,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newGigs,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'add',
              originalState: currentState.gigs,
              rollback: () => {
                set({
                  gigs: currentState.gigs,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to add gig'
                });
              }
            };
            
            get().pendingOperations.set(operationId, operation);
            
            // Simulate async operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Success - remove from pending operations
            get().pendingOperations.delete(operationId);
            set({ isLoading: false });
            
          } catch (error) {
            logError(error as Error, { operation: 'addGig', gigId: newGig.id });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Updates an existing gig with optimistic updates
         * @param id - The gig ID to update
         * @param updates - Partial gig data to update
         */
        updateGig: async (id, updates) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newGigs = currentState.gigs.map(g =>
              g.id === id ? { ...g, ...updates } : g
            );
            
            set({
              gigs: newGigs,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newGigs,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'update',
              originalState: currentState.gigs,
              rollback: () => {
                set({
                  gigs: currentState.gigs,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to update gig'
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
            logError(error as Error, { operation: 'updateGig', gigId: id });
            
            // Rollback optimistic update
            const operation = get().pendingOperations.get(operationId);
            if (operation) {
              operation.rollback();
              get().pendingOperations.delete(operationId);
            }
          }
        },
        
        /**
         * Deletes a gig with optimistic updates
         * @param id - The gig ID to delete
         */
        deleteGig: async (id) => {
          const operationId = uuidv4();
          const currentState = get();
          
          try {
            // Optimistic update
            const newGigs = currentState.gigs.filter(g => g.id !== id);
            
            set({
              gigs: newGigs,
              history: {
                past: [...currentState.history.past, currentState.history.present],
                present: newGigs,
                future: []
              },
              isLoading: true,
              error: null
            });
            
            // Track the operation for potential rollback
            const operation: OptimisticOperation = {
              id: operationId,
              type: 'delete',
              originalState: currentState.gigs,
              rollback: () => {
                set({
                  gigs: currentState.gigs,
                  history: currentState.history,
                  isLoading: false,
                  error: 'Failed to delete gig'
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
            logError(error as Error, { operation: 'deleteGig', gigId: id });
            
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
            gigs: previous,
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
            gigs: next,
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
            // Implement retry logic based on operation type
            logWarning(`Retrying operation: ${operation.type}`, { operationId });
            // This would typically re-execute the original operation
          }
        },
        
        // Selectors (computed state)
        /**
         * Get all upcoming gigs sorted by date
         */
        getUpcomingGigs: () => {
          const now = new Date();
          return get().gigs
            .filter(gig => gig.date && gig.date > now)
            .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        },
        
        /**
         * Get all past gigs sorted by date (most recent first)
         */
        getPastGigs: () => {
          const now = new Date();
          return get().gigs
            .filter(gig => gig.date && gig.date <= now)
            .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
        },
        
        /**
         * Get gigs for a specific month
         * @param year - The year
         * @param month - The month (0-11)
         */
        getGigsByMonth: (year, month) => {
          return get().gigs.filter(gig => {
            if (!gig.date) return false;
            return gig.date.getFullYear() === year && gig.date.getMonth() === month;
          });
        },
        
        /**
         * Get a specific gig by ID
         * @param id - The gig ID
         */
        getGigById: (id) => {
          return get().gigs.find(gig => gig.id === id);
        },
        
        /**
         * Get the total number of gigs
         */
        getTotalGigs: () => get().gigs.length,
        
        /**
         * Get gigs within a date range
         * @param startDate - The start date
         * @param endDate - The end date
         */
        getGigsWithinDateRange: (startDate, endDate) => {
          return get().gigs.filter(gig => {
            if (!gig.date) return false;
            return gig.date >= startDate && gig.date <= endDate;
          });
        }
      }),
      {
        name: PERSIST_STORAGE_GIGS,
        storage: customGigStorage,
        version: STORE_VERSION,
        migrate: (persistedState: any, version: number) => {
          // Handle state migration for app updates
          if (version < STORE_VERSION) {
            logWarning('Migrating gig store state', { fromVersion: version, toVersion: STORE_VERSION });
            
            // Add migration logic here for future versions
            return {
              ...persistedState,
              history: {
                past: [],
                present: persistedState.gigs || [],
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
export const useUpcomingGigs = () => useGigStore(state => state.getUpcomingGigs());
export const usePastGigs = () => useGigStore(state => state.getPastGigs());
export const useGigById = (id: string) => useGigStore(state => state.getGigById(id));
export const useGigStoreError = () => useGigStore(state => state.error);
export const useGigStoreLoading = () => useGigStore(state => state.isLoading);
export const useGigStoreHistory = () => useGigStore(state => ({ 
  canUndo: state.canUndo(), 
  canRedo: state.canRedo(),
  undo: state.undo,
  redo: state.redo
}));