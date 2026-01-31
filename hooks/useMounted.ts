import { useState, useEffect } from "react";

/**
 * Custom hook to check if the component is mounted.
 * @returns {boolean} - True if the component is mounted, false otherwise.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
