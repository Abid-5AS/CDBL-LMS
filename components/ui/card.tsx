import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "flex flex-col text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-card/90 backdrop-blur-sm border border-border/60 shadow-md hover:shadow-lg",
        elevated: "bg-card shadow-lg hover:shadow-xl border border-border/40",
        glass:
          "glass-card border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl",
        outline:
          "bg-transparent border-2 border-border hover:border-primary/40 shadow-sm hover:shadow-md",
        ghost: "bg-transparent border-none shadow-none hover:bg-muted/40",
        gradient:
          "bg-gradient-to-br from-card/95 to-muted/30 border border-border/40 shadow-md hover:shadow-lg",
      },
      size: {
        sm: "gap-3 p-4 rounded-lg",
        default: "gap-4 p-6 rounded-xl",
        lg: "gap-6 p-8 rounded-2xl",
      },
      interactive: {
        true: "cursor-pointer hover-lift active-press",
        false: "",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
      padding: "default",
    },
  }
);

interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

function Card({
  className,
  variant,
  size,
  interactive,
  padding,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        cardVariants({ variant, size, interactive, padding }),
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col space-y-2 p-0 has-[+*]:pb-4 has-[+*]:border-b has-[+*]:border-border/50",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "text-heading-md font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-body-sm text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex-1 p-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between p-0 has-[+*]:pt-4 has-[+*]:border-t has-[+*]:border-border/50",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
