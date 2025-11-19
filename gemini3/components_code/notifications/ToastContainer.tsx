/**
 * ToastContainer Component
 *
 * Container that displays all active notifications/toasts
 * Should be placed near root of app (e.g., in layout)
 */

"use client";

import { useNotification } from "@/context/NotificationContext";
import { ErrorToast } from "./ErrorToast";

interface ToastContainerProps {
  /** Position on screen */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";

  /** Max width of container */
  maxWidth?: string;
}

const positionClasses = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

/**
 * ToastContainer - Displays all active notifications
 *
 * Manages layout and positioning of multiple toasts.
 * Should be added once to app layout, typically in root layout.tsx.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <NotificationProvider>
 *           {children}
 *           <ToastContainer position="top-right" />
 *         </NotificationProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ToastContainer({
  position = "top-right",
  maxWidth = "md:max-w-sm",
}: ToastContainerProps) {
  const { notifications, dismiss } = useNotification();

  return (
    <div
      role="region"
      aria-label="Notifications"
      className={`fixed ${positionClasses[position]} flex flex-col gap-2 z-50 ${maxWidth}`}
    >
      {notifications.map(notification => (
        <ErrorToast
          key={notification.id}
          notification={notification}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}
