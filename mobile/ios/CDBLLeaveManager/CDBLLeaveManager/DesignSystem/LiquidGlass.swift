import SwiftUI

// MARK: - Liquid Glass Style (iOS 15+ Implementation)
// Provides a performant, native implementation of the "Liquid Glass" aesthetic
// that works on current iOS versions (15/16/17+) using standard Materials.

public enum Glass {
    case regular
    case clear
    case identity
    
    // Support for tinted glass chaining (mocking the API structure)
    public func tint(_ color: Color) -> Glass {
        return self // Simplified for now, can be expanded
    }
    
    public func interactive() -> Glass {
        return self // Simplified
    }
}

public extension View {
    /// Applies a "Liquid Glass" effect to the view.
    /// This implementation uses native standard Materials for high performance.
    func glassEffect<S: Shape>(
        _ glass: Glass = .regular,
        in shape: S
    ) -> some View {
        self.modifier(GlassEffectModifier(style: glass, shape: shape))
    }
    
    /// Legacy/Future compatibility wrapper
    @available(iOS 15.0, *)
    func liquidGlassEffect<S: Shape>(
        _ glass: Glass = .regular,
        in shape: S,
        isEnabled: Bool = true
    ) -> some View {
        if isEnabled {
            return self.glassEffect(glass, in: shape)
        } else {
            return self
        }
    }
}

private struct GlassEffectModifier<S: Shape>: ViewModifier {
    let style: Glass
    let shape: S
    
    func body(content: Content) -> some View {
        content
            .background {
                switch style {
                case .regular:
                    ZStack {
                        // Main Glass Material
                        Rectangle()
                            .fill(.ultraThinMaterial)
                            .opacity(0.9) // Slight transparency adjustment
                        
                        // Subtle white tint for "glass" feel
                        Rectangle()
                            .fill(Color.white.opacity(0.1))
                    }
                    .clipShape(shape)
                    .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
                    
                case .clear:
                    ZStack {
                        Rectangle()
                            .fill(.thinMaterial)
                            .opacity(0.5)
                        
                        Rectangle()
                            .fill(Color.white.opacity(0.05))
                    }
                    .clipShape(shape)
                    
                case .identity:
                    Color.clear
                }
            }
            .overlay {
                // Glass border/specular highlight
                if case .identity = style {
                    EmptyView()
                } else {
                    shape
                        .strokeBorder(
                            LinearGradient(
                                colors: [
                                    .white.opacity(0.4),
                                    .white.opacity(0.1),
                                    .white.opacity(0.05)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                }
            }
    }
}

// MARK: - Compatibility Types

public struct GlassEffectContainer<Content: View>: View {
    let spacing: CGFloat
    let content: Content
    
    public init(spacing: CGFloat = 10, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }
    
    public var body: some View {
        VStack(spacing: spacing) {
            content
        }
    }
}
