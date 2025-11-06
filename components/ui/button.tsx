import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-transform duration-200 ease-out disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-0 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary/90 to-primary/80 text-primary-foreground rounded-2xl shadow-sm hover:shadow-md hover:from-primary hover:to-primary/95 dark:hover:from-primary/95 dark:hover:to-primary/90",
        destructive:
          "bg-gradient-to-r from-destructive/90 to-destructive/80 text-destructive-foreground rounded-2xl shadow-sm hover:shadow-md hover:from-destructive hover:to-destructive/95 focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-background/50 backdrop-blur-sm text-foreground rounded-2xl shadow-xs hover:bg-muted/50 hover:text-foreground hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm",
        secondary:
          "bg-gradient-to-r from-secondary/90 to-secondary/80 text-secondary-foreground rounded-2xl shadow-sm hover:shadow-md hover:from-secondary hover:to-secondary/95",
        ghost:
          "hover:bg-muted/50 hover:text-foreground dark:hover:bg-muted/50 backdrop-blur-sm rounded-2xl shadow-none hover:shadow-none",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/90 rounded-2xl",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs font-medium",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4 text-base",
        icon: "size-9 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
) as const;

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants };
