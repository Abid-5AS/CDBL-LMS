"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";

export interface ValidationRule<T = any> {
  field: keyof T;
  validator: (
    value: any,
    formData: T
  ) => string | null | Promise<string | null>;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  dependencies?: (keyof T)[];
}

export interface ValidationState {
  [field: string]: {
    error: string | null;
    isValidating: boolean;
    touched: boolean;
  };
}

export interface UseRealTimeValidationOptions<T> {
  initialData: T;
  rules: ValidationRule<T>[];
  validateOnMount?: boolean;
  debounceMs?: number;
}

export function useRealTimeValidation<T extends Record<string, any>>({
  initialData,
  rules,
  validateOnMount = false,
  debounceMs = 300,
}: UseRealTimeValidationOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [validationState, setValidationState] = useState<ValidationState>({});
  const [isValidating, setIsValidating] = useState(false);
  const validationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const validationPromises = useRef<Map<string, Promise<void>>>(new Map());

  // Initialize validation state
  useEffect(() => {
    const initialState: ValidationState = {};
    rules.forEach((rule) => {
      const fieldName = String(rule.field);
      initialState[fieldName] = {
        error: null,
        isValidating: false,
        touched: false,
      };
    });
    setValidationState(initialState);

    if (validateOnMount) {
      validateAllFields();
    }
  }, []);

  const validateField = useCallback(
    async (
      fieldName: string,
      value: any,
      currentData: T,
      options: { markAsTouched?: boolean } = {}
    ) => {
      const rule = rules.find((r) => String(r.field) === fieldName);
      if (!rule) return;

      const { markAsTouched = true } = options;

      // Mark field as validating
      setValidationState((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isValidating: true,
          touched: markAsTouched ? true : prev[fieldName]?.touched || false,
        },
      }));

      try {
        const error = await rule.validator(value, currentData);

        setValidationState((prev) => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            error,
            isValidating: false,
          },
        }));

        return error;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Validation error";

        setValidationState((prev) => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            error: errorMessage,
            isValidating: false,
          },
        }));

        return errorMessage;
      }
    },
    [rules]
  );

  const debouncedValidateField = useCallback(
    debounce(validateField, debounceMs),
    [validateField, debounceMs]
  );

  const validateAllFields = useCallback(async () => {
    setIsValidating(true);
    const validationPromises: Promise<string | null>[] = [];

    rules.forEach((rule) => {
      const fieldName = String(rule.field);
      const value = data[rule.field];
      validationPromises.push(
        validateField(fieldName, value, data, { markAsTouched: false })
      );
    });

    await Promise.all(validationPromises);
    setIsValidating(false);
  }, [data, rules, validateField]);

  const validateDependentFields = useCallback(
    async (changedField: keyof T) => {
      const dependentRules = rules.filter((rule) =>
        rule.dependencies?.includes(changedField)
      );

      const validationPromises = dependentRules.map((rule) => {
        const fieldName = String(rule.field);
        const value = data[rule.field];
        return validateField(fieldName, value, data);
      });

      await Promise.all(validationPromises);
    },
    [data, rules, validateField]
  );

  const updateField = useCallback(
    (field: keyof T, value: any) => {
      const newData = { ...data, [field]: value };
      setData(newData);

      const rule = rules.find((r) => r.field === field);
      if (!rule) return;

      const fieldName = String(field);

      // Clear existing timeout
      const existingTimeout = validationTimeouts.current.get(fieldName);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Validate on change if enabled
      if (rule.validateOnChange !== false) {
        const timeout = setTimeout(() => {
          validateField(fieldName, value, newData);
          validateDependentFields(field);
        }, rule.debounceMs || debounceMs);

        validationTimeouts.current.set(fieldName, timeout);
      }
    },
    [data, rules, validateField, validateDependentFields, debounceMs]
  );

  const updateFields = useCallback(
    (updates: Partial<T>) => {
      const newData = { ...data, ...updates };
      setData(newData);

      // Validate all updated fields
      Object.keys(updates).forEach((field) => {
        const rule = rules.find((r) => String(r.field) === field);
        if (rule && rule.validateOnChange !== false) {
          const fieldName = String(field);
          const timeout = setTimeout(() => {
            validateField(fieldName, updates[field as keyof T], newData);
          }, rule.debounceMs || debounceMs);

          validationTimeouts.current.set(fieldName, timeout);
        }
      });
    },
    [data, rules, validateField, debounceMs]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      const rule = rules.find((r) => r.field === field);
      if (!rule || rule.validateOnBlur === false) return;

      const fieldName = String(field);
      const value = data[field];

      // Clear any pending debounced validation
      const existingTimeout = validationTimeouts.current.get(fieldName);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Validate immediately on blur
      validateField(fieldName, value, data);
    },
    [data, rules, validateField]
  );

  const clearFieldError = useCallback((field: keyof T) => {
    const fieldName = String(field);
    setValidationState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error: null,
      },
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationState((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((field) => {
        newState[field] = {
          ...newState[field],
          error: null,
        };
      });
      return newState;
    });
  }, []);

  const reset = useCallback(
    (newData?: T) => {
      const resetData = newData || initialData;
      setData(resetData);

      // Clear all validation timeouts
      validationTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      validationTimeouts.current.clear();

      // Reset validation state
      const resetState: ValidationState = {};
      rules.forEach((rule) => {
        const fieldName = String(rule.field);
        resetState[fieldName] = {
          error: null,
          isValidating: false,
          touched: false,
        };
      });
      setValidationState(resetState);
    },
    [initialData, rules]
  );

  const getFieldError = useCallback(
    (field: keyof T) => {
      const fieldName = String(field);
      return validationState[fieldName]?.error || null;
    },
    [validationState]
  );

  const getFieldState = useCallback(
    (field: keyof T) => {
      const fieldName = String(field);
      return (
        validationState[fieldName] || {
          error: null,
          isValidating: false,
          touched: false,
        }
      );
    },
    [validationState]
  );

  const isFieldValid = useCallback(
    (field: keyof T) => {
      const fieldName = String(field);
      const state = validationState[fieldName];
      return state ? !state.error && !state.isValidating : true;
    },
    [validationState]
  );

  const isFormValid = useCallback(() => {
    return Object.values(validationState).every(
      (state) => !state.error && !state.isValidating
    );
  }, [validationState]);

  const hasErrors = useCallback(() => {
    return Object.values(validationState).some((state) => state.error);
  }, [validationState]);

  const getTouchedFields = useCallback(() => {
    return Object.entries(validationState)
      .filter(([_, state]) => state.touched)
      .map(([field]) => field);
  }, [validationState]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      validationTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      validationTimeouts.current.clear();
    };
  }, []);

  return {
    // Data
    data,

    // Validation state
    validationState,
    isValidating,

    // Actions
    updateField,
    updateFields,
    handleBlur,
    validateField,
    validateAllFields,
    clearFieldError,
    clearAllErrors,
    reset,

    // Getters
    getFieldError,
    getFieldState,
    isFieldValid,
    isFormValid,
    hasErrors,
    getTouchedFields,
  };
}

// Common validation rules
export const validationRules = {
  required:
    (message = "This field is required") =>
    (value: any) => {
      if (value === null || value === undefined || value === "") {
        return message;
      }
      return null;
    },

  minLength: (min: number, message?: string) => (value: string) => {
    if (typeof value === "string" && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (typeof value === "string" && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },

  email:
    (message = "Please enter a valid email address") =>
    (value: string) => {
      if (typeof value === "string" && value.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return message;
        }
      }
      return null;
    },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (typeof value === "string" && value.length > 0 && !regex.test(value)) {
      return message;
    }
    return null;
  },

  custom: <T>(validator: (value: any, formData: T) => string | null) =>
    validator,

  async: <T>(validator: (value: any, formData: T) => Promise<string | null>) =>
    validator,
};
