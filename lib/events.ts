import { EventEmitter } from "events";

// Use a global singleton for the event emitter to ensure it persists across hot reloads in dev
// and is shared across the application instance.

declare global {
  var notificationEmitter: EventEmitter | undefined;
}

export const notificationEvents = global.notificationEmitter || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  global.notificationEmitter = notificationEvents;
}

// Event types
export const NOTIFICATION_EVENT = "notification";
