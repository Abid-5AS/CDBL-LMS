"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  variant?: "default" | "outline" | "elevated";
  shine?: boolean; // Kept for API compatibility but disabled visually
  interactive?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", shine, interactive, className, children, ...props }, ref) => {
    
    const variantStyles = {
      default: "bg-card border border-border shadow-sm",
      outline: "bg-transparent border border-border shadow-none",
      elevated: "bg-card border border-border shadow-md",
    };

    const baseStyles = cn(
      "rounded-xl transition-all duration-200",
      variantStyles[variant],
      interactive && "hover:shadow-md hover:border-primary/50 cursor-pointer active:scale-[0.99]",
      className
    );

    return (
      <motion.div
        ref={ref}
        className={baseStyles}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
