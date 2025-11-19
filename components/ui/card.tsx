import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "flex flex-col text-card-foreground transition-all duration-100 ease-out",
  {
    variants: {
      variant: {
        default: "bg-card border border-border shadow-sm hover:border-border",
        elevated: "bg-card border border-border shadow-md",
        outline:
          "bg-transparent border border-border hover:border-border",
        ghost: "bg-transparent border-none shadow-none hover:bg-muted/50",
      },
      size: {
        sm: "gap-3 p-4 rounded-md",
        default: "gap-4 p-6 rounded-md",
        lg: "gap-6 p-8 rounded-md",
      },
      interactive: {
        true: "cursor-pointer hover:-translate-y-[1px] active:translate-y-0",
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
