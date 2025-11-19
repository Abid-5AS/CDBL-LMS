"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FloatingLabelInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  onRightIconClick?: () => void;
  variant?: "default" | "filled" | "outlined";
}

const inputVariants = {
  default: {
    container: "relative",
    input:
      "peer w-full bg-transparent px-3 pt-6 pb-2 text-sm border border-input rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
    label:
      "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-foreground peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-foreground",
  },
  filled: {
    container: "relative",
    input:
      "peer w-full bg-muted px-3 pt-6 pb-2 text-sm border-0 border-b-2 border-transparent rounded-t-md transition-all duration-200 focus:outline-none focus:border-primary focus:bg-background disabled:cursor-not-allowed disabled:opacity-50",
    label:
      "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-foreground",
  },
  outlined: {
    container: "relative",
    input:
      "peer w-full bg-transparent px-3 pt-6 pb-2 text-sm border-2 border-input rounded-md transition-all duration-200 focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
    label:
      "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-foreground bg-background px-1 -ml-1",
  },
};

export const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      success,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      variant = "default",
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const variantStyles = inputVariants[variant];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Determine which right icon to show
    const FinalRightIcon = React.useMemo(() => {
      if (error) return AlertCircle;
      if (success) return CheckCircle2;
      if (isPassword) return showPassword ? EyeOff : Eye;
      return RightIcon;
    }, [error, success, isPassword, showPassword, RightIcon]);

    const handleRightIconClick = () => {
      if (isPassword) {
        togglePasswordVisibility();
      } else if (onRightIconClick) {
        onRightIconClick();
      }
    };

    const shouldShowRightIcon =
      FinalRightIcon && (error || success || isPassword || RightIcon);

    return (
      <div className="space-y-2">
        <div className={variantStyles.container}>
          {/* Left Icon */}
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <LeftIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
          )}

          {/* Input */}
          <input
            type={inputType}
            className={cn(
              variantStyles.input,
              LeftIcon && "pl-10",
              shouldShowRightIcon && "pr-10",
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/20",
              success &&
                "border-green-500 focus:border-green-500 focus:ring-green-500/20",
              className
            )}
            ref={ref}
            disabled={disabled}
            placeholder=" " // Required for the floating label effect
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleInputChange}
            {...props}
          />

          {/* Floating Label */}
          <motion.label
            className={cn(
              variantStyles.label,
              LeftIcon && "left-10",
              error && "peer-focus:text-destructive",
              success && "peer-focus:text-green-500",
              disabled && "opacity-50"
            )}
            animate={{
              scale: isFocused || hasValue || props.value ? 0.85 : 1,
              y: isFocused || hasValue || props.value ? -8 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </motion.label>

          {/* Right Icon */}
          {shouldShowRightIcon && (
            <button
              type="button"
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors",
                (isPassword || onRightIconClick) &&
                  "cursor-pointer hover:text-foreground",
                error && "text-destructive",
                success && "text-green-500",
                !error && !success && "text-muted-foreground"
              )}
              onClick={handleRightIconClick}
              disabled={disabled}
              tabIndex={-1}
              aria-label={isPassword ? (showPassword ? "Hide password" : "Show password") : error ? "Error" : success ? "Valid" : "Toggle"}
            >
              <FinalRightIcon className="size-4" aria-hidden="true" />
            </button>
          )}

          {/* Focus Ring Animation */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-md pointer-events-none",
                  error ? "ring-2 ring-destructive/20" : "ring-2 ring-ring/20",
                  variant === "filled" && "rounded-t-md rounded-b-none"
                )}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 text-sm text-destructive"
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        {helperText && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-sm",
              success ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

// Textarea variant
export interface FloatingLabelTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "placeholder"
  > {
  label: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  variant?: "default" | "filled" | "outlined";
}

export const FloatingLabelTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FloatingLabelTextareaProps
>(
  (
    {
      className,
      label,
      error,
      helperText,
      success,
      variant = "default",
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const variantStyles = inputVariants[variant];

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className="space-y-2">
        <div className={variantStyles.container}>
          {/* Textarea */}
          <textarea
            className={cn(
              variantStyles.input.replace(
                "pt-6 pb-2",
                "pt-6 pb-2 min-h-[80px] resize-y"
              ),
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/20",
              success &&
                "border-green-500 focus:border-green-500 focus:ring-green-500/20",
              className
            )}
            ref={ref}
            disabled={disabled}
            placeholder=" " // Required for the floating label effect
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleInputChange}
            {...props}
          />

          {/* Floating Label */}
          <motion.label
            className={cn(
              variantStyles.label,
              error && "peer-focus:text-destructive",
              success && "peer-focus:text-green-500",
              disabled && "opacity-50"
            )}
            animate={{
              scale: isFocused || hasValue || props.value ? 0.85 : 1,
              y: isFocused || hasValue || props.value ? -8 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </motion.label>

          {/* Focus Ring Animation */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-md pointer-events-none",
                  error ? "ring-2 ring-destructive/20" : "ring-2 ring-ring/20",
                  variant === "filled" && "rounded-t-md rounded-b-none"
                )}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 text-sm text-destructive"
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        {helperText && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-sm",
              success ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

FloatingLabelTextarea.displayName = "FloatingLabelTextarea";
