import { useForm } from 'react-hook-form';

/**
 * Reusable Form Hook with common validation patterns
 * @param {Object} defaultValues - Initial form values
 * @param {Object} options - Additional react-hook-form options
 * @returns {Object} - Form methods and state
 */
export const useFormHandler = (defaultValues = {}, options = {}) => {
  const methods = useForm({
    defaultValues,
    mode: 'onChange',
    ...options,
  });

  return {
    ...methods,
    // Expose all react-hook-form methods
  };
};

/**
 * Common validation rules
 */
export const validationRules = {
  required: (fieldName) => ({
    required: `${fieldName} is required`,
  }),

  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },

  password: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters',
    },
    pattern: {
      value: /\d/,
      message: 'Password must include at least one number',
    },
  },

  username: {
    required: 'Username is required',
    minLength: {
      value: 3,
      message: 'Username must be at least 3 characters',
    },
  },

  phone: {
    pattern: {
      value: /^[0-9]{10}$/,
      message: 'Phone number must be 10 digits',
    },
  },

  number: (fieldName, min = 0) => ({
    required: `${fieldName} is required`,
    min: {
      value: min,
      message: `${fieldName} must be at least ${min}`,
    },
  }),

  positiveNumber: (fieldName) => ({
    required: `${fieldName} is required`,
    min: {
      value: 0.01,
      message: `${fieldName} must be greater than 0`,
    },
  }),

  maxLength: (fieldName, max) => ({
    maxLength: {
      value: max,
      message: `${fieldName} must not exceed ${max} characters`,
    },
  }),

  minLength: (fieldName, min) => ({
    minLength: {
      value: min,
      message: `${fieldName} must be at least ${min} characters`,
    },
  }),

  url: {
    pattern: {
      value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      message: 'Invalid URL format',
    },
  },

  alphanumeric: (fieldName) => ({
    pattern: {
      value: /^[a-zA-Z0-9]+$/,
      message: `${fieldName} must be alphanumeric`,
    },
  }),
};

/**
 * Form field validator helper
 */
export const createValidation = (...rules) => {
  return Object.assign({}, ...rules);
};

/**
 * Custom validators
 */
export const customValidators = {
  matchField: (fieldName, getValues) => ({
    validate: (value) =>
      value === getValues(fieldName) || `Passwords do not match`,
  }),

  greaterThan: (fieldName, getValues) => ({
    validate: (value) =>
      Number(value) > Number(getValues(fieldName)) ||
      `Must be greater than ${fieldName}`,
  }),

  lessThan: (fieldName, getValues) => ({
    validate: (value) =>
      Number(value) < Number(getValues(fieldName)) ||
      `Must be less than ${fieldName}`,
  }),

  unique: (existingValues, message = 'Already exists') => ({
    validate: (value) =>
      !existingValues.includes(value.toLowerCase().trim()) || message,
  }),
};

export default useFormHandler;
