import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] [&>svg]:flex-shrink-0 [&>span]:flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary touch-target focus-ring hover-lift active-press",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary/95 to-primary/85 text-primary-foreground shadow-md hover:shadow-lg hover:from-primary hover:to-primary/90 dark:hover:from-primary/90 dark:hover:to-primary/85 border border-primary/20",
        destructive:
          "bg-gradient-to-r from-destructive/95 to-destructive/85 text-destructive-foreground shadow-md hover:shadow-lg hover:from-destructive hover:to-destructive/90 focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40 border border-destructive/20",
        outline:
          "border-2 border-border bg-background/80 backdrop-blur-sm text-foreground shadow-sm hover:bg-muted/60 hover:text-foreground hover:border-primary/40 hover:shadow-md dark:hover:border-primary/30",
        secondary:
          "bg-gradient-to-r from-secondary/95 to-secondary/85 text-secondary-foreground shadow-sm hover:shadow-md hover:from-secondary hover:to-secondary/90 border border-secondary/20",
        ghost:
          "hover:bg-muted/60 hover:text-foreground dark:hover:bg-muted/40 backdrop-blur-sm shadow-none hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 shadow-none hover:shadow-none",
        glass:
          "glass-base text-foreground shadow-md hover:shadow-lg border border-white/20 dark:border-white/10",
      },
      size: {
        xs: "h-8 px-3 py-1.5 text-xs gap-1.5 rounded-lg has-[>svg]:px-2",
        sm: "h-9 px-4 py-2 text-sm gap-1.5 rounded-xl has-[>svg]:px-3",
        default: "h-10 px-5 py-2.5 text-sm gap-2 rounded-xl has-[>svg]:px-4",
        lg: "h-11 px-6 py-3 text-base gap-2 rounded-2xl has-[>svg]:px-5",
        xl: "h-12 px-8 py-3.5 text-lg gap-2.5 rounded-2xl has-[>svg]:px-6",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-11 rounded-2xl",
        "icon-xl": "size-12 rounded-2xl",
      },
      loading: {
        true: "cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || loading;
  const buttonContent = (
    <>
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && (
        <span className="inline-flex" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span className={cn(loading && "opacity-70", "inline-flex items-center")}>
        {loading && loadingText ? loadingText : children}
      </span>
      {!loading && rightIcon && (
        <span className="inline-flex" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </>
  );

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, loading }), className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {asChild ? children : buttonContent}
    </Comp>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
