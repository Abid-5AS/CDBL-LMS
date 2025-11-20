import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full text-foreground transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 touch-target",
  {
    variants: {
      variant: {
        default:
          "rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        filled:
          "border-transparent bg-muted/60 dark:bg-muted/40 shadow-sm focus-visible:bg-background focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/20 hover:bg-muted/80 dark:hover:bg-muted/60",
        ghost:
          "border-transparent shadow-none focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/20 hover:bg-muted/40",
        glass:
          "rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 backdrop-blur-sm",
        error:
          "rounded-md border border-destructive bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 text-destructive placeholder:text-destructive/50",
        success:
          "rounded-md border border-emerald-500 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 text-emerald-600 placeholder:text-emerald-600/50",
      },
      size: {
        sm: "h-9 px-3 py-2 text-sm rounded-lg",
        default: "h-10 px-4 py-2.5 text-sm rounded-xl",
        lg: "h-11 px-5 py-3 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  floating?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      size,
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      floating = false,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputId = React.useId();

    // Auto-detect variant based on errorMessage
    const actualVariant = errorMessage ? "error" : variant;
    const showFloatingLabel = floating && (focused || hasValue || placeholder);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    if (floating && label) {
      return (
        <div className="relative">
          <div className="relative">
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {leftIcon}
              </div>
            )}
            <input
              type={type}
              id={inputId}
              ref={ref}
              className={cn(
                inputVariants({ variant: actualVariant, size }),
                leftIcon && "pl-10",
                rightIcon && "pr-10",
                floating && "placeholder-transparent",
                className
              )}
              placeholder={placeholder}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              aria-describedby={
                helperText || errorMessage
                  ? `${inputId}-description`
                  : undefined
              }
              aria-invalid={actualVariant === "error"}
              {...props}
            />
            {rightIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {rightIcon}
              </div>
            )}
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-4 transition-all duration-200 pointer-events-none text-muted-foreground",
                leftIcon && "left-10",
                showFloatingLabel
                  ? "-top-2 text-xs bg-background px-1 text-primary"
                  : "top-1/2 -translate-y-1/2 text-sm"
              )}
            >
              {label}
            </label>
          </div>
          {(helperText || errorMessage) && (
            <p
              id={`${inputId}-description`}
              className={cn(
                "mt-1.5 text-xs",
                actualVariant === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {errorMessage || helperText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            ref={ref}
            className={cn(
              inputVariants({ variant: actualVariant, size }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            placeholder={placeholder}
            aria-describedby={
              helperText || errorMessage ? `${inputId}-description` : undefined
            }
            aria-invalid={actualVariant === "error"}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || errorMessage) && (
          <p
            id={`${inputId}-description`}
            className={cn(
              "text-xs",
              actualVariant === "error"
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
