import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { neoBadge } from "@/lib/neo-design";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden focus-ring",
  {
    variants: {
      variant: {
        default: neoBadge.info,
        secondary: neoBadge.glass,
        destructive: neoBadge.rejected,
        success: neoBadge.approved,
        warning: neoBadge.pending,
        info: neoBadge.info,
        outline:
          "border border-border bg-background text-foreground shadow-sm hover:bg-muted/60 hover:border-primary/40",
        ghost:
          "border-transparent bg-muted/40 text-foreground hover:bg-muted/60",
        glass: neoBadge.glass,
      },
      size: {
        xs: "px-2 py-0.5 text-xs rounded-md",
        sm: "px-2.5 py-1 text-xs rounded-lg",
        default: "px-3 py-1.5 text-sm rounded-xl",
        lg: "px-4 py-2 text-sm rounded-xl",
      },
      dot: {
        true: "pl-1.5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      dot: false,
    },
  }
);

interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  dotColor?: string;
}

function Badge({
  className,
  variant,
  size,
  dot,
  asChild = false,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, dot }), className)}
      {...props}
    >
      {dot && (
        <span
          className="size-2 rounded-full bg-current"
          style={dotColor ? { backgroundColor: dotColor } : undefined}
          aria-hidden="true"
        />
      )}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
