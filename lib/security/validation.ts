/**
 * Input Validation & Security
 *
 * Utilities for validating and sanitizing user input
 */

import { log } from "@/lib/logging/logger";

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim() === "") {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  } else if (email.length > 254) {
    errors.push("Email is too long");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: email.toLowerCase().trim(),
  };
}

/**
 * Password validation
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  const errors: string[] = [];

  if (!password || password === "") {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Username validation
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim() === "") {
    errors.push("Username is required");
  } else if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    errors.push(
      "Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: username.trim(),
  };
}

/**
 * URL validation
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || url.trim() === "") {
    errors.push("URL is required");
  } else {
    try {
      new URL(url);
    } catch {
      errors.push("Invalid URL format");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: url.trim(),
  };
}

/**
 * Number validation
 */
export function validateNumber(
  value: any,
  options: {
    min?: number;
    max?: number;
    isInteger?: boolean;
  } = {}
): ValidationResult {
  const { min, max, isInteger = false } = options;
  const errors: string[] = [];

  if (value === null || value === undefined || value === "") {
    errors.push("Number is required");
    return { isValid: false, errors };
  }

  const num = Number(value);

  if (isNaN(num)) {
    errors.push("Value must be a number");
  } else {
    if (isInteger && !Number.isInteger(num)) {
      errors.push("Value must be an integer");
    }

    if (min !== undefined && num < min) {
      errors.push(`Value must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      errors.push(`Value must be at most ${max}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: num,
  };
}

/**
 * String validation
 */
export function validateString(
  value: any,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
  } = {}
): ValidationResult {
  const {
    minLength = 0,
    maxLength = Infinity,
    pattern,
    required = true,
  } = options;
  const errors: string[] = [];

  if (!value) {
    if (required) {
      errors.push("Value is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  const str = String(value);

  if (str.length < minLength) {
    errors.push(
      `Value must be at least ${minLength} characters`
    );
  }

  if (str.length > maxLength) {
    errors.push(
      `Value must be at most ${maxLength} characters`
    );
  }

  if (pattern && !pattern.test(str)) {
    errors.push("Value does not match required pattern");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: str.trim(),
  };
}

/**
 * Sanitize object properties
 */
export function sanitizeObject(
  obj: Record<string, any>,
  allowedKeys: string[]
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  allowedKeys.forEach((key) => {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  });

  return sanitized;
}

/**
 * Validate and sanitize form data
 */
export function validateFormData(
  data: Record<string, any>,
  schema: Record<string, (value: any) => ValidationResult>
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitized: Record<string, any>;
} {
  const errors: Record<string, string[]> = {};
  const sanitized: Record<string, any> = {};
  let isValid = true;

  Object.entries(schema).forEach(([field, validator]) => {
    const result = validator(data[field]);

    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    } else if (result.sanitized !== undefined) {
      sanitized[field] = result.sanitized;
    } else {
      sanitized[field] = data[field];
    }
  });

  return {
    isValid,
    errors,
    sanitized,
  };
}

/**
 * Check for potential XSS patterns
 */
export function isXSSSuspicious(value: string): boolean {
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /on\w+\s*=/gi,
    /javascript:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(value));
}

/**
 * Check for potential SQL injection patterns
 */
export function isSQLSuspicious(value: string): boolean {
  const sqlPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /;.*\b(DROP|DELETE|EXEC)\b/gi,
    /'.*?or.*?'.*?=/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(value));
}

/**
 * Validate user input with logging
 */
export function validateUserInput(
  value: any,
  fieldName: string,
  validator: (value: any) => ValidationResult
): ValidationResult {
  const result = validator(value);

  if (!result.isValid) {
    log.warn(`Validation failed for field: ${fieldName}`, {
      errors: result.errors,
      value: typeof value === "object" ? "[object]" : value,
    });
  }

  return result;
}

/**
 * Get validation summary
 */
export function getValidationSummary(
  errors: Record<string, string[]>
): string {
  const errorCount = Object.values(errors).reduce((sum, arr) => sum + arr.length, 0);
  const fieldCount = Object.keys(errors).length;

  return `${fieldCount} field(s) with ${errorCount} error(s)`;
}
