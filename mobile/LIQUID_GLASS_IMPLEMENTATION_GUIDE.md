# iOS 26 Liquid Glass: Implementation Guide

## Automatic Adoption
Standard UI elements from **SwiftUI**, **UIKit**, and **AppKit** automatically adopt the Liquid Glass appearance and behavior when you recompile your app with **Xcode 26**.

## Implementation APIs

### Edge-to-Edge & Sidebar Layouts
The "Landmarks" sample app demonstrates how to maximize the Liquid Glass aesthetic in complex layouts:

- **Background Extension Effect:** Stretch content behind sidebars and inspectors to create a seamless, immersive experience.
- **Horizontal Scroll Views:** Extend scrollable areas under sidebars or inspectors to maintain visual continuity.

**Example Strategy:**
When using `NavigationSplitView`, ensure your detail view's background extends to the window edges to allow the glass sidebar to refract the scrolling content beneath it.

### SwiftUI Modifiers & Styles
SwiftUI provides high-level modifiers to apply Liquid Glass effects:

- **`.glassEffect(_:in:)`**: Applies the Liquid Glass material to a view within a specified shape.
- **`.buttonStyle(.glass)`**: Quickly applies the glass aesthetic to buttons.

**Button Style Examples:**
```swift
Button("Standard Glass", action: {}) .buttonStyle(.glass)
Button("Prominent", action: {}) .buttonStyle(.glassProminent)
Button("Clear Glass", action: {}) .buttonStyle(.clearGlass)
```

**Custom View Example:**
```swift
struct MyGlassView: View {
    var body: some View {
        Text("Liquid Glass Content")
            .padding()
            .background(.glassEffect(in: RoundedRectangle(cornerRadius: 16)))
    }
}
```

### Advanced: Morphing & Containers
- **`GlassEffectContainer`**: A container view that combines multiple glass shapes into a single shape that can morph individual shapes into one another when they are in close proximity.
- **`.glassEffectID(_:in:)`**: Used within a container to identify views that should participate in morphing transitions.

**Morphing Example:**
```swift
@State private var isExpanded: Bool = false
@Namespace private var namespace

var body: some View {
    GlassEffectContainer(spacing: 40.0) {
        HStack(spacing: 40.0) {
            Image(systemName: "pencil")
                .glassEffect()
                .glassEffectID("tool1", in: namespace)

            if isExpanded {
                Image(systemName: "eraser")
                    .glassEffect()
                    .glassEffectID("tool2", in: namespace)
            }
        }
    }
    
    Button("Animate") {
        withAnimation { isExpanded.toggle() }
    }
    .buttonStyle(.glass)
}
```

### UIKit & AppKit
- **`UIGlassEffect` (UIKit)**: Used with `UIVisualEffectView` for iOS.
- **`NSGlassEffectView` (AppKit)**: A dedicated view for macOS.
- **`NSGlassEffectContainerView` (AppKit)**: Efficiently merges descendant glass effect views.

## Asset Creation: Icon Composer
Liquid Glass app icons are created using **Icon Composer** in Xcode 26.
- **Multilayer Compositions:** Icons are multilayer files where each layer can have independent Liquid Glass properties (Blur, Translucency, Specular, Shadow).
- **Specular Highlights:** Responds to device motion automatically when configured in Icon Composer.

## Best Practices
- **Layer Economy:** Limit the number of stacked translucent panes to one primary glass sheet per view.
- **Backgrounds:** Avoid hard-coding solid colors behind glass elements; prefer system materials to allow proper refraction.
- **Standard Components:** Favor `NavigationStack`, `NavigationSplitView`, and standard toolbars to ensure consistent system behavior.
