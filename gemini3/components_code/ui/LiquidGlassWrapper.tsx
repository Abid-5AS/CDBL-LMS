"use client";

import { useRef } from "react";
import type { ReactNode } from "react";

type LiquidGlassWrapperProps = {
  children: ReactNode;
  intensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  mode?: "standard" | "polar" | "prominent" | "shader";
  className?: string;
  padding?: string;
};

/**
 * LiquidGlassWrapper Component (Refactored)
 *
 * Previously provided liquid glass effects. Now serves as a simple layout wrapper
 * to maintain API compatibility while removing the visual effect for a professional look.
 */
export default function LiquidGlassWrapper({
  children,
  className = "",
  padding = "1.5rem",
}: LiquidGlassWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{ padding }}
    >
      {children}
    </div>
  );
}
