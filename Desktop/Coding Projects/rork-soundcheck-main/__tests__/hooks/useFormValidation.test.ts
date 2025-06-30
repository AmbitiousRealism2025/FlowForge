import { renderHook, act } from '@testing-library/react-native';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ValidationRules } from '@/utils/validation';

describe('useFormValidation', () => {
  const mockOnSubmit = jest.fn();
  
  const validationRules: ValidationRules = {
    name: {
      required: true,
      minLength: 2,
      message: 'Name is invalid',
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email is invalid',
    },
    age: {
      custom: (value: any) => {
        if (value < 18) return 'Must be 18 or older';
        return null;
      },
      message: 'Age is invalid',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with provided values', () => {
      const initialValues = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const { result } = renderHook(() =>
        useFormValidation({
          initialValues,
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('handleChange', () => {
    it('should update field value', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', email: '', age: 0 },
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.handleChange('name')('John Doe');
      });

      expect(result.current.values.name).toBe('John Doe');
    });

    it('should validate field on change if touched', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', email: '', age: 0 },
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      // First touch the field
      act(() => {
        result.current.handleBlur('name')();
      });

      // Then change it with invalid value
      act(() => {
        result.current.handleChange('name')('a');
      });

      expect(result.current.errors.name).toBe('Name is invalid');
    });
  });

  describe('handleBlur', () => {
    it('should mark field as touched', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', email: '', age: 0 },
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.handleBlur('name')();
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('should validate field on blur', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', email: '', age: 0 },
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.handleBlur('name')();
      });

      expect(result.current.errors.name).toBe('Name is invalid');
    });
  });

  describe('setFieldValue', () => {
    it('should update field value directly', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', email: '', age: 0 },
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.setFieldValue('age', 25);
      });

      expect(result.current.values.age).toBe(25);
    });

    it('should validate field if touched', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', email: '', age: 0 },
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      // Touch the field first
      act(() => {
        result.current.handleBlur('age')();
      });

      // Set invalid value
      act(() => {
        result.current.setFieldValue('age', 15);
      });

      expect(result.current.errors.age).toBe('Must be 18 or older');
    });
  });

  describe('handleSubmit', () => {
    it('should validate all fields before submitting', async () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', email: '', age: 0 },
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Debug: log the actual errors
      console.log('Actual errors:', result.current.errors);

      expect(result.current.errors).toEqual({
        name: 'Name is invalid',
        email: 'Email is invalid',
        age: 'Must be 18 or older',
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should call onSubmit with valid values', async () => {
      const validValues = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: validValues,
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(validValues);
      expect(result.current.errors).toEqual({});
    });

    it('should set isSubmitting during submission', async () => {
      const slowSubmit = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: 'John', email: 'john@example.com', age: 25 },
          validationRules,
          onSubmit: slowSubmit,
        })
      );

      let submittingDuringCall = false;

      await act(async () => {
        const submitPromise = result.current.handleSubmit();
        // Need to wait for next tick to see the state change
        await new Promise(resolve => setTimeout(resolve, 0));
        submittingDuringCall = result.current.isSubmitting;
        await submitPromise;
      });

      expect(submittingDuringCall).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle submission errors', async () => {
      const errorSubmit = jest.fn(async () => {
        throw new Error('Submission failed');
      });

      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: 'John', email: 'john@example.com', age: 25 },
          validationRules,
          onSubmit: errorSubmit,
        })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset form to initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com', age: 25 };

      const { result } = renderHook(() =>
        useFormValidation({
          initialValues,
          validationRules,
          onSubmit: mockOnSubmit,
        })
      );

      // Modify values
      act(() => {
        result.current.handleChange('name')('Jane');
        result.current.handleBlur('name')();
        result.current.handleBlur('email')();
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle fields without validation rules', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '', description: '' },
          validationRules: {
            name: { required: true, message: 'Required' },
            // No rule for description
          },
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.handleChange('description')('Some text');
        result.current.handleBlur('description')();
      });

      expect(result.current.values.description).toBe('Some text');
      expect(result.current.errors.description).toBeUndefined();
    });

    it('should handle dynamic field addition', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          initialValues: { name: '' } as any,
          validationRules: {
            name: { required: true, message: 'Required' },
          },
          onSubmit: mockOnSubmit,
        })
      );

      act(() => {
        result.current.setFieldValue('newField', 'value');
      });

      expect(result.current.values.newField).toBe('value');
    });
  });
});