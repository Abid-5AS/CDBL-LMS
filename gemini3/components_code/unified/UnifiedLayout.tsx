"use client";

// UnifiedLayout is now deprecated - layout is handled globally in LayoutWrapper
// This component is kept for backward compatibility with existing page imports
export function UnifiedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

