/**
 * FocusTrap Component
 *
 * Component that traps focus within its bounds
 */

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { FocusTrap as FocusTrapManager } from "@/lib/accessibility/keyboard";

/**
 * FocusTrap props
 */
export interface FocusTrapProps {
  /** Child elements */
  children: React.ReactNode;

  /** Initial element to focus */
  initialFocus?: HTMLElement | null;

  /** Element to restore focus to on deactivate */
  restoreFocus?: HTMLElement | null;

  /** Callback when escape key is pressed */
  onEscape?: () => void;

  /** Whether to deactivate on click outside */
  clickOutsideDeactivates?: boolean;

  /** CSS class name */
  className?: string;

  /** Enable focus trap */
  active?: boolean;
}

/**
 * FocusTrap Component
 *
 * Traps keyboard focus within the component's bounds.
 * Useful for modals, popovers, and other overlay components.
 *
 * @example
 * ```tsx
 * <FocusTrap active={isModalOpen} onEscape={handleClose}>
 *   <div>
 *     <input type="text" autoFocus />
 *     <button onClick={handleClose}>Close</button>
 *   </div>
 * </FocusTrap>
 * ```
 */
export const FocusTrap = React.forwardRef<HTMLDivElement, FocusTrapProps>(
  (
    {
      children,
      initialFocus,
      restoreFocus,
      onEscape,
      clickOutsideDeactivates = false,
      className = "",
      active = true,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const focusTrapRef = useRef<FocusTrapManager | null>(null);

    // Combine refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(containerRef.current);
        } else {
          ref.current = containerRef.current;
        }
      }
    }, [ref]);

    // Initialize focus trap
    useEffect(() => {
      if (!active || !containerRef.current) {
        return;
      }

      focusTrapRef.current = new FocusTrapManager(containerRef.current, {
        initialFocus: initialFocus || undefined,
        fallbackFocus: restoreFocus || undefined,
        onEscape,
        clickOutsideDeactivates,
      });

      return () => {
        focusTrapRef.current?.deactivate();
        focusTrapRef.current = null;
      };
    }, [active, initialFocus, restoreFocus, onEscape, clickOutsideDeactivates]);

    return (
      <div ref={containerRef} className={className}>
        {children}
      </div>
    );
  }
);

FocusTrap.displayName = "FocusTrap";

/**
 * SkipToContent Component
 *
 * A skip link component that allows users to jump directly to main content
 */
export interface SkipToContentProps {
  /** Target element ID or ref */
  targetId?: string;

  /** Link text */
  text?: string;

  /** CSS class for styling */
  className?: string;
}

export const SkipToContent = React.forwardRef<
  HTMLAnchorElement,
  SkipToContentProps
>(({ targetId = "main", text = "Skip to main content", className = "" }, ref) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: "smooth" });
      }
    },
    [targetId]
  );

  return (
    <a
      ref={ref}
      href={`#${targetId}`}
      onClick={handleClick}
      className={`skip-to-content ${className}`}
      style={{
        position: "absolute",
        top: "-40px",
        left: 0,
        background: "#000",
        color: "#fff",
        padding: "8px",
        zIndex: 100,
        borderRadius: "0 0 4px 0",
      }}
      onFocus={(e) => {
        // Show skip link on focus
        e.currentTarget.style.top = "0";
      }}
      onBlur={(e) => {
        // Hide skip link on blur
        e.currentTarget.style.top = "-40px";
      }}
    >
      {text}
    </a>
  );
});

SkipToContent.displayName = "SkipToContent";
