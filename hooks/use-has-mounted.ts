"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns `true` after the component has mounted in the browser.
 * Uses `useSyncExternalStore` so server snapshots stay `false`
 * and hydration stays consistent between light/dark shells.
 */
export function useHasMounted() {
  return useSyncExternalStore(
    (callback) => {
      callback();
      return () => {};
    },
    () => true,
    () => false
  );
}
