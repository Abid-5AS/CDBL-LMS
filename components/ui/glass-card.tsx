"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "light" | "medium" | "strong";
  shine?: boolean;
  interactive?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "medium", shine, interactive, className, children, ...props }, ref) => {
    // Map variant to glass utility class
    const glassClass =
      variant === "light" ? "glass-light" : variant === "strong" ? "glass-strong" : "glass-base";

    const baseStyles = cn(
      "rounded-lg transition-all duration-300",
      glassClass,
      interactive && "hover:scale-[1.02] cursor-pointer",
      shine && "relative overflow-hidden",
      className
    );

    const content = (
      <>
        {shine && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -z-0"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "linear",
            }}
          />
        )}
        <div className={cn("relative z-10", shine && "relative")}>{children}</div>
      </>
    );

    return (
      <motion.div
        ref={ref}
        className={baseStyles}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
        {...props}
      >
        {content}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };

