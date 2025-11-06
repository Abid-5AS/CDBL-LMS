"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Custom tooltip for Recharts with Material 3 + Glass aesthetic
 * Matches the design tokens from the unified tooltip component
 */
export function ChartTooltip({ active, payload, label }: any) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(30, 30, 30, 0.95)",
        // White text for maximum readability
        color: isDark ? "#fefefe" : "#ffffff",
        // Subtle border with glass effect
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.2)"}`,
        // Backdrop blur for glassmorphism
        backdropFilter: "blur(12px)",
        // Material 3 elevation shadow
        boxShadow: isDark
          ? "0 2px 8px rgba(0, 0, 0, 0.4)"
          : "0 2px 8px rgba(0, 0, 0, 0.25)",
        // Padding and border radius
        padding: "8px 12px",
        borderRadius: "8px",
        // Font styling
        fontSize: "0.85rem",
        fontWeight: 500,
        // Prevent text selection
        userSelect: "none",
        // Smooth transition
        transition: "opacity 0.2s ease",
      }}
    >
      <div style={{ marginBottom: "4px", fontWeight: 600 }}>
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
            fontSize: "0.8rem",
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

