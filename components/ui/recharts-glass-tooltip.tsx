"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Recharts Glass Tooltip - Material 3 + Glass aesthetic
 * Matches the design tokens from the unified tooltip component
 */
export function RechartsGlassTooltip({ active, payload, label }: any) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      // Cleanup function - no specific cleanup needed
    };
  }, []);

  if (!active || !payload || !payload.length) {
    return null;
  }

  // Determine if dark mode (default to light if not mounted)
  const isDark = mounted && theme === "dark";

  return (
    <div
      style={{
        // High contrast background
        backgroundColor: isDark
          ? "hsl(var(--card) / 0.85)"
          : "hsl(var(--card) / 0.95)",
        // White text for maximum readability
        color: "hsl(var(--foreground))",
        // Subtle border with glass effect
        border: `1px solid hsl(var(--border) / 0.5)`,
        // Backdrop blur for glassmorphism
        backdropFilter: "blur(12px)",
        // Material 3 elevation shadow
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        // Padding and border radius
        padding: "12px",
        borderRadius: "12px",
        // Font styling
        fontSize: "0.85rem",
        fontWeight: 500,
        // Prevent text selection
        userSelect: "none",
        // Smooth transition
        transition: "opacity 0.2s ease",
      }}
    >
      {label && (
        <div style={{ marginBottom: "4px", fontWeight: 600, fontSize: "0.9rem" }}>
          {label}
        </div>
      )}
      {payload.map((entry: any, index: number) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: index > 0 ? "4px" : "0",
            fontSize: "0.85rem",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "2px",
              backgroundColor: entry.color || "#2563eb",
            }}
          />
          <span style={{ opacity: 0.9 }}>
            {entry.name || "Value"}:{" "}
            <span style={{ fontWeight: 600 }}>
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}