/**
 * WebGL Support Detection
 * 
 * Checks if the current browser/environment supports WebGL rendering
 * Used to conditionally enable hardware-accelerated liquid glass effects
 */
export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

