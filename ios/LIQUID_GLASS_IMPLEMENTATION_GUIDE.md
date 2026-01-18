# iOS 26 Liquid Glass: Implementation Guide

## Automatic Adoption

For most apps, adopting Liquid Glass is straightforward.

- **Standard Components:** Standard UI elements from **SwiftUI**, **UIKit**, and **AppKit** automatically adopt the Liquid Glass appearance and behavior when you recompile your app with **Xcode 26**.
- **Navigation & Toolbars:** Standard navigation bars, tab bars, and toolbars will automatically render with the new material properties.

## Custom Elements Implementation

Custom views require manual updates to match the system aesthetic. Failure to update custom elements may result in a jarring, mixed user experience.

## Implementation APIs

### SwiftUI - Native iOS 26 APIs

SwiftUI provides native modifiers to apply Liquid Glass effects:

#### Core Modifiers

- **`.glassEffect(_ glass: Glass, in shape: some Shape)`**: Applies the Liquid Glass material to a view within a specified shape.
- **`.glassEffect()`**: Applies the default regular glass effect with capsule shape.
- **`.glassEffectID(_ id: some Hashable, in namespace: Namespace.ID)`**: Assigns an identifier for matched geometry animations.
- **`.glassEffectUnion(id: some Hashable?, namespace: Namespace.ID)`**: Associates glass effects into a unified shape.
- **`.glassEffectTransition(_ transition: GlassEffectTransition)`**: Controls animation transitions (.identity, .matchedGeometry, .materialize).

#### Glass Type Variants

```swift
Glass.regular      // Default translucent glass
Glass.clear        // Higher transparency variant
Glass.identity     // No glass effect
```

#### Glass Modifiers

```swift
.tint(_ color: Color)          // Adds tint color to glass
.interactive(_ isEnabled: Bool) // Enables touch/pointer response
```

#### GlassEffectContainer

```swift
GlassEffectContainer(spacing: CGFloat?) {
    // Child views with glass effects
}
```

Combines multiple glass shapes, allowing them to morph together when in close proximity.

#### Button Styles

- **`.glass(_ glass: Glass)`**: Button style with Liquid Glass variant.
- **`.glassProminent`**: Pre-defined prominent button style with glass border artwork.

**Examples:**

Basic glass effect:

```swift
Text("Hello, World!")
    .font(.title)
    .padding()
    .glassEffect()
```

With custom shape and variant:

```swift
Text("Liquid Glass")
    .padding()
    .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 12))
```

With tint and interactivity:

```swift
Text("Interactive")
    .padding()
    .glassEffect(.regular.tint(.orange).interactive())
```

Clear variant with dimming:

```swift
Label("Flag", systemImage: "flag.fill")
    .padding()
    .glassEffect(.clear)
    .background(.black.opacity(0.3))
```

Button with glass style:

```swift
Button("Click Me") {
    // action
}
.buttonStyle(.glass(.regular))
```

Prominent button:

```swift
Button("Primary Action") {
    // action
}
.buttonStyle(.glassProminent)
.tint(.blue)
```

Container with morphing effects:

```swift
GlassEffectContainer(spacing: 20.0) {
    HStack(spacing: 20.0) {
        Image(systemName: "sun.max.fill")
            .frame(width: 80, height: 80)
            .glassEffect()

        Image(systemName: "moon.stars.fill")
            .frame(width: 80, height: 80)
            .glassEffect()
    }
}
```

### UIKit & AppKit

- **`NSGlassEffectView` (AppKit)**: A view that embeds content in a dynamic glass effect.
- **`NSGlassEffectContainerView` (AppKit)**: Efficiently merges descendant glass effect views.
- **`UIGlassEffect` (UIKit)**: Used with `UIVisualEffectView` to apply the material in iOS apps.

## Asset Creation: Icon Composer

Liquid Glass app icons are created using the new **Icon Composer** tool in Xcode 26.

- **Multilayer Compositions:** Icons are no longer flat images. They are multilayer files where each layer can have independent Liquid Glass properties.
- **Specular Highlights:** Can be toggled per layer/group to control how light reflects off specific parts of the icon.
- **Backward Compatibility:** Xcode automatically generates legacy flat icons for older iOS versions from your Icon Composer file.

### Strategic Approach

1.  **Audit Existing Design:** Identify all custom UI components that mimic older system styles (e.g., solid blurs, opaque backgrounds).
2.  **Prioritize High-Visibility:** Start with always-visible elements like:
    - Custom Tab Bars
    - Primary Navigation headers
    - App Icons (using _Icon Composer_)
3.  **Refactor to Standard:** Where possible, replace custom implementations with standard SwiftUI/UIKit components to get the effect for free.

### Best Practices

- **Avoid Overuse:** Liquid Glass is impactful. Use it sparingly.
  - **Do:** Use for transient views, overlays, navigation, and floating controls.
  - **Don't:** Apply it to every button or content background. It can become distracting and hurt readability.
- **Backgrounds:** Prefer system-determined background appearances. Avoid hard-coding solid colors behind glass elements, as this breaks the refraction effects.
- **Layer Economy:** Limit the number of stacked translucent panes.
  - **Ideal:** One primary glass sheet per view (e.g., a modal over content).
  - **Avoid:** Stacking glass on glass on glass, which causes performance degradation and visual noise.

## Sample Resources

- **Landmarks App:** Apple has updated the "Landmarks" sample code to showcase best-in-class Liquid Glass implementation.
- **WWDC 2025 Sessions:** Refer to sessions on "Material Design in iOS 26" for deep dives.
- **Apple Developer Documentation:** https://developer.apple.com/documentation/SwiftUI/applying-liquid-glass-to-custom-views

## Migration from Custom Implementation

If you were using a custom polyfill or shader-based implementation:

1. Remove all custom glass effect code (shader libraries, custom view modifiers)
2. Replace with native `.glassEffect()` modifiers
3. Update button styles from custom implementations to `.glass()` and `.glassProminent`
4. Test with Xcode 26 to ensure proper rendering
5. Use GlassEffectContainer for complex layouts with multiple glass elements
