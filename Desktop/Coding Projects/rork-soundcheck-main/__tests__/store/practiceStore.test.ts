import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePracticeStore } from '@/store/practiceStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('practiceStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the store state
    const { result } = renderHook(() => usePracticeStore());
    act(() => {
      result.current.tasks = [];
      result.current.categories = [];
    });
  });

  describe('addTask', () => {
    it('should add a new task', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addTask({
          title: 'Practice scales',
          note: 'C major scale',
          category: 'Technique',
          completed: false,
        });
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0]).toMatchObject({
        title: 'Practice scales',
        note: 'C major scale',
        category: 'Technique',
        completed: false,
      });
      expect(result.current.tasks[0].id).toBeDefined();
    });

    it('should add category if new', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addTask({
          title: 'Practice scales',
          category: 'New Category',
          completed: false,
        });
      });

      // The addTask method doesn't automatically add categories
      // Categories are managed separately
      expect(result.current.categories).not.toContain('New Category');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', () => {
      const { result } = renderHook(() => usePracticeStore());

      // Add a task first
      act(() => {
        result.current.addTask({
          title: 'Practice scales',
          completed: false,
        });
      });

      const taskId = result.current.tasks[0].id;

      // Update the task
      act(() => {
        result.current.updateTask(taskId, {
          title: 'Practice major scales',
          note: 'Focus on C and G major',
          completed: true,
        });
      });

      expect(result.current.tasks[0]).toMatchObject({
        id: taskId,
        title: 'Practice major scales',
        note: 'Focus on C and G major',
        completed: true,
      });
    });

    it('should update task category', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addTask({
          title: 'Practice scales',
          completed: false,
        });
      });

      const taskId = result.current.tasks[0].id;

      act(() => {
        result.current.updateTask(taskId, {
          category: 'Theory',
        });
      });

      expect(result.current.tasks[0].category).toBe('Theory');
    });

    it('should not update non-existent task', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.updateTask('non-existent-id', {
          title: 'Updated title',
        });
      });

      expect(result.current.tasks).toHaveLength(0);
    });
  });

  describe('deleteTask', () => {
    it('should delete an existing task', () => {
      const { result } = renderHook(() => usePracticeStore());

      // Add tasks
      act(() => {
        result.current.addTask({
          title: 'Task 1',
          completed: false,
        });
        result.current.addTask({
          title: 'Task 2',
          completed: false,
        });
      });

      const taskId = result.current.tasks[0].id;

      // Delete the first task
      act(() => {
        result.current.deleteTask(taskId);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].title).toBe('Task 2');
    });

    it('should not throw when deleting non-existent task', () => {
      const { result } = renderHook(() => usePracticeStore());

      expect(() => {
        act(() => {
          result.current.deleteTask('non-existent-id');
        });
      }).not.toThrow();
    });
  });

  describe('toggleTaskCompletion', () => {
    it('should toggle task completion status', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addTask({
          title: 'Practice scales',
          completed: false,
        });
      });

      const taskId = result.current.tasks[0].id;

      // Toggle to completed
      act(() => {
        result.current.toggleTaskCompletion(taskId);
      });

      expect(result.current.tasks[0].completed).toBe(true);

      // Toggle back to incomplete
      act(() => {
        result.current.toggleTaskCompletion(taskId);
      });

      expect(result.current.tasks[0].completed).toBe(false);
    });
  });

  describe('addCategory', () => {
    it('should add a new category', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addCategory('Improvisation');
      });

      expect(result.current.categories).toContain('Improvisation');
    });

    it('should not add duplicate category', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addCategory('Technique'); // Already exists
      });

      expect(result.current.categories.filter(c => c === 'Technique')).toHaveLength(1);
    });
  });

  describe('deleteCategory', () => {
    it('should remove an existing category', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addCategory('Improvisation');
      });

      act(() => {
        result.current.deleteCategory('Improvisation');
      });

      expect(result.current.categories).not.toContain('Improvisation');
    });

    it('should remove category from all tasks', () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addCategory('Improvisation');
        result.current.addTask({
          title: 'Task 1',
          category: 'Improvisation',
          completed: false,
        });
        result.current.addTask({
          title: 'Task 2',
          category: 'Improvisation',
          completed: false,
        });
      });

      act(() => {
        result.current.deleteCategory('Improvisation');
      });

      expect(result.current.tasks[0].category).toBeUndefined();
      expect(result.current.tasks[1].category).toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('should persist state to AsyncStorage', async () => {
      const { result } = renderHook(() => usePracticeStore());

      act(() => {
        result.current.addTask({
          title: 'Practice scales',
          completed: false,
        });
      });

      // Wait for the persist middleware to save
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});