import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-100 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] [&>svg]:flex-shrink-0 [&>span]:flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md",
        outline:
          "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground rounded-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-input rounded-md",
        ghost:
          "hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        xs: "h-8 px-3 py-1.5 text-xs gap-1.5 has-[>svg]:px-2",
        sm: "h-9 px-4 py-2 text-sm gap-1.5 has-[>svg]:px-3",
        default: "h-10 px-5 py-2.5 text-sm gap-2 has-[>svg]:px-4",
        lg: "h-11 px-6 py-3 text-base gap-2 has-[>svg]:px-5",
        xl: "h-12 px-8 py-3.5 text-lg gap-2.5 has-[>svg]:px-6",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
        "icon-xl": "size-12",
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
