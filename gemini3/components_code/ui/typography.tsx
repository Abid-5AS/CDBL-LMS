"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva(
  "text-foreground tracking-tight",
  {
    variants: {
      size: {
        xl: "scroll-m-20 text-4xl font-semibold lg:text-5xl",
        lg: "scroll-m-20 text-3xl font-semibold md:text-4xl",
        md: "scroll-m-20 text-2xl font-semibold",
        sm: "text-xl font-semibold",
      },
      weight: {
        default: "",
        medium: "font-medium",
        normal: "font-normal",
      },
    },
    defaultVariants: {
      size: "md",
      weight: "default",
    },
  }
);

const textVariants = cva("text-foreground leading-relaxed", {
  variants: {
    size: {
      lg: "text-base",
      md: "text-sm",
      sm: "text-xs",
    },
    variant: {
      default: "",
      muted: "text-muted-foreground",
      subtle: "text-foreground/70",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: keyof HTMLElementTagNameMap;
  };

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, weight, as: Tag = "h2", ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(headingVariants({ size, weight }), className)}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants> & {
    as?: keyof HTMLElementTagNameMap;
  };

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, variant, as: Tag = "p", ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(textVariants({ size, variant }), className)}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";
