/**
 * NotificationContext
 *
 * Context for managing global notifications (toasts)
 * Provides a centralized way to show notifications from anywhere in the app
 */

"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
} from "react";
import {
  Notification,
  NotificationManager,
  createNotification,
  createErrorNotification,
  createSuccessNotification,
  createWarningNotification,
  createInfoNotification,
} from "@/lib/notifications";

interface NotificationContextType {
  /** Array of visible notifications */
  notifications: Notification[];

  /** Add error notification */
  error: (message: string, options?: {
    description?: string;
    duration?: number;
    action?: Notification["action"];
  }) => string;

  /** Add success notification */
  success: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => string;

  /** Add warning notification */
  warning: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => string;

  /** Add info notification */
  info: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => string;

  /** Add custom notification */
  notify: (notification: Notification) => string;

  /** Dismiss a notification */
  dismiss: (id: string) => void;

  /** Clear all notifications */
  clear: () => void;

  /** Set maximum visible notifications */
  setMaxNotifications: (max: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

type NotificationAction =
  | { type: "ADD"; payload: Notification }
  | { type: "REMOVE"; payload: string }
  | { type: "CLEAR" }
  | { type: "SET_MAX"; payload: number };

interface NotificationState {
  notifications: Notification[];
  maxNotifications: number;
}

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case "ADD": {
      const notifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: notifications.slice(0, state.maxNotifications),
      };
    }

    case "REMOVE": {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    }

    case "CLEAR": {
      return {
        ...state,
        notifications: [],
      };
    }

    case "SET_MAX": {
      return {
        ...state,
        maxNotifications: Math.max(1, action.payload),
        notifications: state.notifications.slice(0, action.payload),
      };
    }

    default:
      return state;
  }
}

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

/**
 * NotificationProvider
 *
 * Provides notification context to the app.
 * Should wrap the app at a high level (e.g., in the root layout).
 *
 * @example
 * ```typescript
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <NotificationProvider>
 *           {children}
 *         </NotificationProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function NotificationProvider({
  children,
  maxNotifications = 3,
}: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    maxNotifications,
  });

  const error = useCallback(
    (message: string, options?: Parameters<typeof createErrorNotification>[1]) => {
      const notification = createErrorNotification(message, options);
      dispatch({ type: "ADD", payload: notification });

      // Auto-dismiss
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE", payload: notification.id });
        }, notification.duration);
      }

      return notification.id;
    },
    []
  );

  const success = useCallback(
    (message: string, options?: Parameters<typeof createSuccessNotification>[1]) => {
      const notification = createSuccessNotification(message, options);
      dispatch({ type: "ADD", payload: notification });

      // Auto-dismiss
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE", payload: notification.id });
        }, notification.duration);
      }

      return notification.id;
    },
    []
  );

  const warning = useCallback(
    (message: string, options?: Parameters<typeof createWarningNotification>[1]) => {
      const notification = createWarningNotification(message, options);
      dispatch({ type: "ADD", payload: notification });

      // Auto-dismiss
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE", payload: notification.id });
        }, notification.duration);
      }

      return notification.id;
    },
    []
  );

  const info = useCallback(
    (message: string, options?: Parameters<typeof createInfoNotification>[1]) => {
      const notification = createInfoNotification(message, options);
      dispatch({ type: "ADD", payload: notification });

      // Auto-dismiss
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          dispatch({ type: "REMOVE", payload: notification.id });
        }, notification.duration);
      }

      return notification.id;
    },
    []
  );

  const notify = useCallback((notification: Notification) => {
    dispatch({ type: "ADD", payload: notification });

    // Auto-dismiss
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dispatch({ type: "REMOVE", payload: notification.id });
      }, notification.duration);
    }

    return notification.id;
  }, []);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "REMOVE", payload: id });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const setMaxNotifications = useCallback((max: number) => {
    dispatch({ type: "SET_MAX", payload: max });
  }, []);

  const value: NotificationContextType = {
    notifications: state.notifications,
    error,
    success,
    warning,
    info,
    notify,
    dismiss,
    clear,
    setMaxNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * useNotification Hook
 *
 * Access notification context from any component.
 * Must be used within a NotificationProvider.
 *
 * @returns Notification context value
 * @throws Error if used outside NotificationProvider
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { error, success } = useNotification();
 *
 *   async function handleAction() {
 *     try {
 *       await doSomething();
 *       success("Action completed!");
 *     } catch (err) {
 *       error("Something went wrong");
 *     }
 *   }
 *
 *   return <button onClick={handleAction}>Do Something</button>;
 * }
 * ```
 */
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }

  return context;
}
