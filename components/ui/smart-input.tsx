"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle,
  Copy,
  RefreshCw,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Badge } from "./badge";

export interface SmartInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  description?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;

  // Icons and actions
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  onRightIconClick?: () => void;

  // Validation
  rules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidationIcon?: boolean;

  // Help and suggestions
  helpText?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;

  // Smart features
  autoComplete?: boolean;
  autoCorrect?: boolean;
  smartSuggestions?: boolean;

  // Actions
  copyable?: boolean;
  clearable?: boolean;
  regeneratable?: boolean;
  onRegenerate?: () => void;

  // Formatting
  mask?: string;
  format?: (value: string) => string;

  // Styling
  variant?: "default" | "filled" | "outlined" | "ghost";
  size?: "sm" | "md" | "lg";

  // Callbacks
  onChange?: (
    value: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export interface ValidationRule {
  test: (value: string) => boolean | Promise<boolean>;
  message: string;
  type?: "error" | "warning" | "info";
}

const variantClasses = {
  default: "border border-input bg-background",
  filled: "border-0 bg-muted",
  outlined: "border-2 border-input bg-transparent",
  ghost: "border-0 bg-transparent",
};

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

export function SmartInput({
  label,
  description,
  error,
  success = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  rules = [],
  validateOnChange = true,
  validateOnBlur = true,
  showValidationIcon = true,
  helpText,
  suggestions = [],
  onSuggestionSelect,
  autoComplete = false,
  autoCorrect = false,
  smartSuggestions = false,
  copyable = false,
  clearable = false,
  regeneratable = false,
  onRegenerate,
  mask,
  format,
  variant = "default",
  size = "md",
  className,
  onChange,
  onValidationChange,
  type = "text",
  value,
  disabled,
  ...props
}: SmartInputProps) {
  const [internalValue, setInternalValue] = React.useState(value || "");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isValidating, setIsValidating] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<
    string[]
  >([]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  // Update internal value when prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(String(value));
    }
  }, [value]);

  // Filter suggestions based on input value
  React.useEffect(() => {
    if (suggestions.length > 0 && internalValue) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(internalValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [suggestions, internalValue]);

  // Validate input
  const validateInput = React.useCallback(
    async (inputValue: string) => {
      if (rules.length === 0) return true;

      setIsValidating(true);
      const errors: string[] = [];

      for (const rule of rules) {
        try {
          const isValid = await rule.test(inputValue);
          if (!isValid) {
            errors.push(rule.message);
          }
        } catch (err) {
          errors.push(rule.message);
        }
      }

      setValidationErrors(errors);
      setIsValidating(false);

      const isValid = errors.length === 0;
      onValidationChange?.(isValid, errors);

      return isValid;
    },
    [rules, onValidationChange]
  );

  // Handle input change
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = event.target.value;

      // Apply mask if provided
      if (mask) {
        newValue = applyMask(newValue, mask);
      }

      // Apply format if provided
      if (format) {
        newValue = format(newValue);
      }

      setInternalValue(newValue);
      onChange?.(newValue, event);

      // Validate on change if enabled
      if (validateOnChange) {
        validateInput(newValue);
      }

      // Show suggestions if smart suggestions are enabled
      if (smartSuggestions && newValue.length > 0) {
        setShowSuggestions(true);
      }
    },
    [mask, format, onChange, validateOnChange, validateInput, smartSuggestions]
  );

  // Handle blur
  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setShowSuggestions(false);

      if (validateOnBlur) {
        validateInput(internalValue);
      }

      props.onBlur?.(event);
    },
    [validateOnBlur, validateInput, internalValue, props]
  );

  // Handle focus
  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      if (smartSuggestions && filteredSuggestions.length > 0) {
        setShowSuggestions(true);
      }

      props.onFocus?.(event);
    },
    [smartSuggestions, filteredSuggestions.length, props]
  );

  // Handle suggestion select
  const handleSuggestionSelect = React.useCallback(
    (suggestion: string) => {
      setInternalValue(suggestion);
      setShowSuggestions(false);
      onChange?.(suggestion, {} as React.ChangeEvent<HTMLInputElement>);
      onSuggestionSelect?.(suggestion);
      inputRef.current?.focus();
    },
    [onChange, onSuggestionSelect]
  );

  // Handle copy
  const handleCopy = React.useCallback(async () => {
    if (internalValue) {
      try {
        await navigator.clipboard.writeText(internalValue);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  }, [internalValue]);

  // Handle clear
  const handleClear = React.useCallback(() => {
    setInternalValue("");
    onChange?.("", {} as React.ChangeEvent<HTMLInputElement>);
    inputRef.current?.focus();
  }, [onChange]);

  // Toggle password visibility
  const togglePasswordVisibility = React.useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  // Determine validation state
  const hasError = error || validationErrors.length > 0;
  const isValid =
    success || (!hasError && internalValue.length > 0 && rules.length > 0);

  // Determine right icon
  const FinalRightIcon = React.useMemo(() => {
    if (loading || isValidating) return RefreshCw;
    if (hasError && showValidationIcon) return AlertCircle;
    if (isValid && showValidationIcon) return CheckCircle2;
    if (isPassword) return showPassword ? EyeOff : Eye;
    return RightIcon;
  }, [
    loading,
    isValidating,
    hasError,
    isValid,
    showValidationIcon,
    isPassword,
    showPassword,
    RightIcon,
  ]);

  const handleRightIconClick = React.useCallback(() => {
    if (isPassword) {
      togglePasswordVisibility();
    } else if (onRightIconClick) {
      onRightIconClick();
    }
  }, [isPassword, togglePasswordVisibility, onRightIconClick]);

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              {label}
              {props.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </label>

            {helpText && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{helpText}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Input Container */}
        <div className="relative">
          <div
            className={cn(
              "relative flex items-center rounded-md transition-all duration-200",
              variantClasses[variant],
              sizeClasses[size],
              isFocused && "ring-2 ring-ring ring-offset-2",
              hasError && "border-destructive focus-within:ring-destructive",
              isValid && "border-green-500 focus-within:ring-green-500",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
          >
            {/* Left Icon */}
            {LeftIcon && (
              <LeftIcon className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
            )}

            {/* Input */}
            <input
              ref={inputRef}
              type={inputType}
              value={internalValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              className={cn(
                "flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground",
                "disabled:cursor-not-allowed"
              )}
              {...props}
            />

            {/* Action Icons */}
            <div className="flex items-center gap-1 ml-2">
              {clearable && internalValue && !disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={handleClear}
                  tabIndex={-1}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              {copyable && internalValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={handleCopy}
                  tabIndex={-1}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}

              {regeneratable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={onRegenerate}
                  disabled={loading}
                  tabIndex={-1}
                >
                  <Zap className="h-3 w-3" />
                </Button>
              )}

              {/* Right Icon */}
              {FinalRightIcon && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-4 w-4 p-0 hover:bg-transparent transition-colors",
                    (isPassword || onRightIconClick) && "cursor-pointer",
                    hasError && "text-destructive",
                    isValid && "text-green-500",
                    (loading || isValidating) && "animate-spin"
                  )}
                  onClick={handleRightIconClick}
                  disabled={disabled}
                  tabIndex={-1}
                >
                  <FinalRightIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {filteredSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Validation Messages */}
        <AnimatePresence>
          {(error || validationErrors.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1"
            >
              {error && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {validationErrors.map((validationError, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 text-sm text-destructive"
                >
                  <AlertCircle className="w-4 h-4" />
                  {validationError}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && !hasError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 text-sm text-green-600"
            >
              <CheckCircle2 className="w-4 h-4" />
              Input is valid
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

// Utility function to apply input mask
function applyMask(value: string, mask: string): string {
  let maskedValue = "";
  let valueIndex = 0;

  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar = mask[i];
    const valueChar = value[valueIndex];

    if (maskChar === "9") {
      // Numeric character
      if (/\d/.test(valueChar)) {
        maskedValue += valueChar;
        valueIndex++;
      } else {
        break;
      }
    } else if (maskChar === "A") {
      // Alphabetic character
      if (/[a-zA-Z]/.test(valueChar)) {
        maskedValue += valueChar;
        valueIndex++;
      } else {
        break;
      }
    } else if (maskChar === "*") {
      // Any character
      maskedValue += valueChar;
      valueIndex++;
    } else {
      // Literal character
      maskedValue += maskChar;
    }
  }

  return maskedValue;
}

// Common validation rules
export const validationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  phone: (message = "Please enter a valid phone number"): ValidationRule => ({
    test: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, "")),
    message,
  }),

  url: (message = "Please enter a valid URL"): ValidationRule => ({
    test: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    test: (value) => regex.test(value),
    message,
  }),

  custom: (
    test: (value: string) => boolean | Promise<boolean>,
    message: string
  ): ValidationRule => ({
    test,
    message,
  }),
};
