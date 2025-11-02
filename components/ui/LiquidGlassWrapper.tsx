"use client";

import { useRef } from "react";
import { useTheme } from "next-themes";
import LiquidGlass from "liquid-glass-react";
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
 * LiquidGlassWrapper Component
 *
 * Wraps content with Apple VisionOS-style liquid glass effects using WebGL shaders.
 * Automatically syncs with the current theme from next-themes for optimal contrast.
 *
 * @param intensity - Controls displacement effect intensity (default: 64)
 * @param elasticity - Controls liquid elastic feel, 0 = rigid, higher = more elastic (default: 0.25)
 * @param cornerRadius - Border radius in pixels (default: 20)
 * @param mode - Refraction mode: 'standard', 'polar', 'prominent', or 'shader' (default: 'standard')
 * @param className - Additional CSS classes
 * @param padding - CSS padding value (default: '1.5rem')
 */
export default function LiquidGlassWrapper({
  children,
  intensity = 64,
  elasticity = 0.25,
  cornerRadius = 20,
  mode = "standard",
  className = "",
  padding = "1.5rem",
}: LiquidGlassWrapperProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={`relative isolate ${className}`}>
      <LiquidGlass
        mouseContainer={containerRef}
        displacementScale={intensity}
        blurAmount={0.1}
        saturation={130}
        aberrationIntensity={2}
        elasticity={elasticity}
        cornerRadius={cornerRadius}
        mode={mode}
        overLight={theme === "light"}
        padding={padding}
      >
        {children}
      </LiquidGlass>
    </div>
  );
}

