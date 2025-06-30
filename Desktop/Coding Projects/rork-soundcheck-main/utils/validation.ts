export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationErrors {
  [field: string]: string;
}

export const validateField = (value: any, rule: ValidationRule): string | null => {
  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return rule.message || 'This field is required';
  }

  // Skip other validations if value is empty and not required
  // Note: Check for null/undefined, not falsy values (0, false are valid values)
  if ((value === null || value === undefined || value === '') && !rule.required) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `Must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `Must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || 'Invalid format';
    }
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    console.log(`Custom validation for value ${value}:`, customError);
    if (customError) {
      return customError;
    }
  }

  return null;
};

export const validateForm = (values: Record<string, any>, rules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {};

  console.log('validateForm called with:', { values, rules });
  Object.keys(rules).forEach(field => {
    console.log(`Validating field ${field} with value:`, values[field]);
    const error = validateField(values[field], rules[field]);
    console.log(`Validation result for ${field}:`, error);
    if (error) {
      errors[field] = error;
    }
  });

  console.log('Final errors:', errors);
  return errors;
};

// Common validation rules
export const commonRules = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Title is required and must be between 1-100 characters',
  },
  venueName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Venue name is required',
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^[\d\s\-\+\(\)]+$/,
    message: 'Please enter a valid phone number',
  },
  compensation: {
    pattern: /^\$?\d+(\.\d{1,2})?$/,
    message: 'Please enter a valid amount (e.g., 100 or $100.00)',
  },
  futureDate: {
    custom: (value: Date | null) => {
      if (value && new Date(value) < new Date()) {
        return 'Date must be in the future';
      }
      return null;
    },
  },
};