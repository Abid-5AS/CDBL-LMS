"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * An animated segmented control for filtering the requests table.
 * Uses a glider animation that slides between options.
 */
export function SegmentedControlGlider({
  options,
  selected,
  onChange,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  const [gliderStyle, setGliderStyle] = useState({});

  const updateGlider = (index: number) => {
    // Check for document to avoid SSR errors
    if (typeof document === "undefined") return;

    const el = document.getElementById(`segment-btn-${index}`);
    if (el) {
      setGliderStyle({
        transform: `translateX(${el.offsetLeft - 4}px)`, // 4px is the container padding
        width: `${el.offsetWidth}px`,
      });
    }
  };

  useEffect(() => {
    const selectedIndex = options.findIndex((opt) => opt.value === selected);
    if (selectedIndex !== -1) {
      // Use timeout to ensure elements are rendered
      setTimeout(() => updateGlider(selectedIndex), 50);
    }
  }, [selected, options]);

  return (
    <div className="segmented-control-container w-full max-w-md overflow-x-auto scrollbar-none">
      <div className="segmented-control-glider" style={gliderStyle} />
      {options.map((option, index) => (
        <button
          key={option.value}
          id={`segment-btn-${index}`}
          className={cn(
            "segmented-control-button",
            selected === option.value && "active"
          )}
          onClick={() => {
            onChange(option.value);
            updateGlider(index);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

