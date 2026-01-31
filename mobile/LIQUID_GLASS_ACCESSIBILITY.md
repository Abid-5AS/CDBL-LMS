# iOS 26 Liquid Glass: Accessibility & Usability

## Accessibility Essentials
While Liquid Glass adds visual richness, it must not compromise usability.

### 1. Contrast & Legibility
- **Minimum Contrast:** Ensure text and essential icons maintain a contrast ratio of at least **4.5:1** against the background after the glass effect is applied.
- **Dynamic Testing:** Since Liquid Glass is refractive, test your UI against various background types (busy, colorful, high-contrast).
- **Focus Effects:** Use `.focusable()` in SwiftUI to ensure Liquid Glass highlights correctly indicate interactive states for keyboard and assistive technology users.

### 2. System Settings Support
Your app must adapt when users toggle accessibility features.

#### Reduce Transparency
- **Requirement:** When "Reduce Transparency" is enabled, glass effects must be replaced with **solid, opaque colors**.
- **SwiftUI Support:** Standard materials and `.glassEffect` modifiers handle this automatically. For custom drawing, check the environment for transparency settings.

#### Reduce Motion
- **Requirement:** When "Reduce Motion" is enabled, disable the specular highlights and parallax effects that respond to device movement.
- **Behavior:** This prevents motion-induced discomfort (vestibular issues).

### 3. Layer Economy
- **Clarity:** Stacking too many layers of glass makes the interface "muddy" and difficult to parse.
- **Performance:** Excessive use of live-refracting layers can impact system performance and battery life on older devices. Stick to one primary glass sheet per functional area.

## Tools for Verification
- **Xcode Accessibility Inspector:** Use this to verify contrast and focus rings on glass elements.
- **Environment Overrides:** In Xcode, use the "Environment Overrides" pane to quickly toggle "Reduce Transparency" and "Reduce Motion" during testing.
