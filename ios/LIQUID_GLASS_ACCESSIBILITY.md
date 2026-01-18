# iOS 26 Liquid Glass: Accessibility & Usability

## Accessibility Essentials
While Liquid Glass adds visual richness, it must not compromise usability or accessibility.

### 1. Contrast & Legibility
- **Minimum Contrast:** Ensure text and essential icons maintain a contrast ratio of at least **4.5:1** against the background *after* the blur/glass effect is applied.
- **Dynamic Backgrounds:** Since the background changes, test against both light and dark, busy and simple backgrounds.
- **Tools:** Use the **Xcode Accessibility Inspector** or design tools like the **Figma Stark plugin** to verify contrast in real-time.

### 2. System Settings Support
Your app must respect user preferences regarding display and motion.

#### Reduce Transparency
- **Behavior:** When a user enables "Reduce Transparency" in System Settings, Liquid Glass effects should revert to **solid, opaque colors**.
- **Implementation:** Standard components handle this automatically. For custom views, observe `UIAccessibility.isReduceTransparencyEnabled` (UIKit) or the relevant SwiftUI environment value and swap the glass material for a solid color.

#### Reduce Motion
- **Behavior:** Liquid Glass features "parallax highlights" that move with the device. This can trigger motion sickness in some users.
- **Implementation:** When "Reduce Motion" is enabled, disable the specular highlights and parallax effects on the glass material.

### 3. Visual Clarity
- **Content First:** Prioritize legibility over the "cool factor" of the effect.
- **Complex Backgrounds:** Be careful when placing glass over highly detailed images or text. Ensure the blur radius is sufficient to obscure the background details so the foreground content remains readable.
