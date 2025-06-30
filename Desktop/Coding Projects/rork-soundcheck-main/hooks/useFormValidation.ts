import { useState, useCallback } from 'react';
import { validateForm, validateField, ValidationRules, ValidationErrors } from '@/utils/validation';

interface UseFormValidationProps<T> {
  initialValues: T;
  validationRules: ValidationRules;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormValidationProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T) => (value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if field has been touched
    if (touched[field as string]) {
      const rule = validationRules[field as string];
      if (rule) {
        const error = validateField(value, rule);
        setErrors(prev => ({
          ...prev,
          [field]: error || '',
        }));
      }
    }
  }, [touched, validationRules]);

  const handleBlur = useCallback((field: keyof T) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    const rule = validationRules[field as string];
    if (rule) {
      const error = validateField(values[field], rule);
      setErrors(prev => ({
        ...prev,
        [field]: error || '',
      }));
    }
  }, [values, validationRules]);

  const handleSubmit = useCallback(async () => {
    // Touch all fields
    const allTouched = Object.keys(validationRules).reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );
    setTouched(allTouched);

    // Validate all fields
    const validationErrors = validateForm(values, validationRules);
    setErrors(validationErrors);

    // Check if form is valid
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validationRules, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    handleChange(field)(value);
  }, [handleChange]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    isValid: Object.keys(errors).length === 0,
  };
}