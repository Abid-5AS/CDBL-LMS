import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { neoInput } from "@/lib/neo-design";

const inputVariants = cva(
  "flex w-full text-foreground transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 touch-target",
  {
    variants: {
      variant: {
        default: neoInput.base,
        filled:
          "border-transparent bg-muted/60 shadow-sm focus-visible:bg-background focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/20 hover:bg-muted/80",
        ghost:
          "border-transparent shadow-none focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/20 hover:bg-muted/40",
        glass: neoInput.base,
      },
      size: {
        sm: "h-9 px-3 py-2 text-sm rounded-lg",
        default: "h-10 px-4 py-2.5 text-sm rounded-xl",
        lg: "h-11 px-5 py-3 text-base rounded-xl",
      },
      state: {
        default: "",
        error: neoInput.error.replace(neoInput.base, ""),
        success: neoInput.success.replace(neoInput.base, ""),
        warning:
          "border-warning/60 focus-visible:border-warning focus-visible:ring-warning/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

interface InputProps
  extends React.ComponentProps<"input">,
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
      state,
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

    const actualState = errorMessage ? "error" : state;
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
                inputVariants({ variant, size, state: actualState }),
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
              aria-invalid={actualState === "error"}
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
                actualState === "error"
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
              inputVariants({ variant, size, state: actualState }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            placeholder={placeholder}
            aria-describedby={
              helperText || errorMessage ? `${inputId}-description` : undefined
            }
            aria-invalid={actualState === "error"}
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
              actualState === "error"
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
