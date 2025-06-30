import { validateField, validateForm, commonRules } from '@/utils/validation';

describe('validation utilities', () => {
  describe('validateField', () => {
    describe('required validation', () => {
      it('should return error for empty string', () => {
        const rule = { required: true, message: 'Field is required' };
        expect(validateField('', rule)).toBe('Field is required');
        expect(validateField('   ', rule)).toBe('Field is required');
      });

      it('should return error for null/undefined', () => {
        const rule = { required: true, message: 'Field is required' };
        expect(validateField(null, rule)).toBe('Field is required');
        expect(validateField(undefined, rule)).toBe('Field is required');
      });

      it('should pass for non-empty values', () => {
        const rule = { required: true, message: 'Field is required' };
        expect(validateField('test', rule)).toBeNull();
        expect(validateField(123, rule)).toBeNull();
        expect(validateField(new Date(), rule)).toBeNull();
      });
    });

    describe('minLength validation', () => {
      it('should return error for strings shorter than minLength', () => {
        const rule = { minLength: 5, message: 'Too short' };
        expect(validateField('test', rule)).toBe('Too short');
        // Empty string should not trigger minLength if field is not required
        expect(validateField('', rule)).toBeNull();
      });

      it('should pass for strings meeting minLength', () => {
        const rule = { minLength: 5, message: 'Too short' };
        expect(validateField('hello', rule)).toBeNull();
        expect(validateField('hello world', rule)).toBeNull();
      });
    });

    describe('maxLength validation', () => {
      it('should return error for strings longer than maxLength', () => {
        const rule = { maxLength: 5, message: 'Too long' };
        expect(validateField('hello world', rule)).toBe('Too long');
      });

      it('should pass for strings within maxLength', () => {
        const rule = { maxLength: 5, message: 'Too long' };
        expect(validateField('hello', rule)).toBeNull();
        expect(validateField('hi', rule)).toBeNull();
      });
    });

    describe('pattern validation', () => {
      it('should return error for non-matching patterns', () => {
        const rule = { pattern: /^\d+$/, message: 'Must be numbers only' };
        expect(validateField('abc', rule)).toBe('Must be numbers only');
        expect(validateField('12a', rule)).toBe('Must be numbers only');
      });

      it('should pass for matching patterns', () => {
        const rule = { pattern: /^\d+$/, message: 'Must be numbers only' };
        expect(validateField('123', rule)).toBeNull();
        expect(validateField('0', rule)).toBeNull();
      });
    });

    describe('custom validation', () => {
      it('should use custom validation function', () => {
        const rule = {
          custom: (value: any) => {
            if (value < 18) return 'Must be 18 or older';
            return null;
          },
          message: 'Invalid age',
        };
        expect(validateField(17, rule)).toBe('Must be 18 or older');
        expect(validateField(18, rule)).toBeNull();
        expect(validateField(25, rule)).toBeNull();
      });
    });

    describe('multiple validations', () => {
      it('should check all validations and return first error', () => {
        const rule = {
          required: true,
          minLength: 3,
          maxLength: 10,
          message: 'Invalid input',
        };
        expect(validateField('', rule)).toBe('Invalid input'); // Required fails first
        expect(validateField('ab', rule)).toBe('Invalid input'); // MinLength fails
        expect(validateField('this is too long', rule)).toBe('Invalid input'); // MaxLength fails
        expect(validateField('perfect', rule)).toBeNull();
      });
    });
  });

  describe('validateForm', () => {
    it('should validate all fields and return errors object', () => {
      const values = {
        name: '',
        email: 'invalid',
        age: 15,
      };
      const rules = {
        name: { required: true, message: 'Name is required' },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
        age: { custom: (v: number) => v >= 18 ? null : 'Must be 18+', message: 'Invalid age' },
      };

      const errors = validateForm(values, rules);

      expect(errors).toEqual({
        name: 'Name is required',
        email: 'Invalid email',
        age: 'Must be 18+',
      });
    });

    it('should return empty object for valid form', () => {
      const values = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };
      const rules = {
        name: { required: true, message: 'Name is required' },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
        age: { custom: (v: number) => v >= 18 ? null : 'Must be 18+', message: 'Invalid age' },
      };

      const errors = validateForm(values, rules);

      expect(errors).toEqual({});
    });

    it('should skip validation for fields without rules', () => {
      const values = {
        name: 'John',
        description: '', // No rule for this field
      };
      const rules = {
        name: { required: true, message: 'Name is required' },
      };

      const errors = validateForm(values, rules);

      expect(errors).toEqual({});
      expect(errors.description).toBeUndefined();
    });
  });

  describe('commonRules', () => {
    describe('title rule', () => {
      it('should validate title correctly', () => {
        expect(validateField('', commonRules.title)).toBe('Title is required and must be between 1-100 characters');
        expect(validateField('a'.repeat(101), commonRules.title)).toBe('Title is required and must be between 1-100 characters');
        expect(validateField('Valid Title', commonRules.title)).toBeNull();
      });
    });

    describe('venueName rule', () => {
      it('should validate venue name correctly', () => {
        expect(validateField('', commonRules.venueName)).toBe('Venue name is required');
        expect(validateField('a'.repeat(101), commonRules.venueName)).toBe('Venue name is required');
        expect(validateField('Blue Note Jazz Club', commonRules.venueName)).toBeNull();
      });
    });

    describe('email rule', () => {
      it('should validate email correctly', () => {
        expect(validateField('invalid', commonRules.email)).toBe('Please enter a valid email address');
        expect(validateField('test@', commonRules.email)).toBe('Please enter a valid email address');
        expect(validateField('@example.com', commonRules.email)).toBe('Please enter a valid email address');
        expect(validateField('test@example.com', commonRules.email)).toBeNull();
        expect(validateField('user.name+tag@example.co.uk', commonRules.email)).toBeNull();
        // Should pass validation when empty since it's not required
        expect(validateField('', commonRules.email)).toBeNull();
      });
    });

    describe('phone rule', () => {
      it('should validate phone correctly', () => {
        expect(validateField('abcdefghij', commonRules.phone)).toBe('Please enter a valid phone number');
        expect(validateField('1234567890', commonRules.phone)).toBeNull();
        expect(validateField('123-456-7890', commonRules.phone)).toBeNull();
        expect(validateField('(123) 456-7890', commonRules.phone)).toBeNull();
        expect(validateField('+1 234 567 8900', commonRules.phone)).toBeNull();
        // Should pass validation when empty since it's not required
        expect(validateField('', commonRules.phone)).toBeNull();
      });
    });

    describe('compensation rule', () => {
      it('should validate compensation correctly', () => {
        expect(validateField('invalid-amount', commonRules.compensation)).toBe('Please enter a valid amount (e.g., 100 or $100.00)');
        expect(validateField('$500', commonRules.compensation)).toBeNull();
        expect(validateField('100', commonRules.compensation)).toBeNull();
        expect(validateField('$100.50', commonRules.compensation)).toBeNull();
        // Should pass validation when empty since it's not required
        expect(validateField('', commonRules.compensation)).toBeNull();
      });
    });

    describe('futureDate rule', () => {
      it('should validate future dates correctly', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        expect(validateField(pastDate, commonRules.futureDate)).toBe('Date must be in the future');
        expect(validateField(futureDate, commonRules.futureDate)).toBeNull();
      });

      it('should accept today as valid', () => {
        const today = new Date();
        // Test with current time, which should be valid since the rule only checks if date < new Date()
        expect(validateField(today, commonRules.futureDate)).toBeNull();
      });
    });
  });
});