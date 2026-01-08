import SwiftUI

// MARK: - Native Glass Button Styles (iOS 15+ Implementation)
// Implements the "iOS 26" style buttons using standard SwiftUI components.

public struct GlassButtonStyle: ButtonStyle {

    let glass: Glass

    let isProminent: Bool

    

    public init(glass: Glass = .frosted, isProminent: Bool = false) {

        self.glass = glass

        self.isProminent = isProminent

    }

    

    public func makeBody(configuration: Configuration) -> some View {

        configuration.label

            .padding(.horizontal, 20)

            .padding(.vertical, 12)

            .background {

                if isProminent {

                    // Prominent buttons often have a color backing

                    // We can't easily read .tint() here without iOS 16+ or custom environment, 

                    // so we'll use a default accent or rely on the user adding .background() if needed.

                    // For now, let's use a subtle color shift or just the glass effect with stronger opacity.

                    Color.accentColor.opacity(0.3)

                }

            }

            .glassEffect(glass, in: RoundedRectangle(cornerRadius: 12))

            // Scale effect for tactile feedback

            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)

            .opacity(configuration.isPressed ? 0.8 : 1.0)

            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)

    }

}



// MARK: - Button Style Extensions



public extension ButtonStyle where Self == GlassButtonStyle {

    

    /// Applies the standard Liquid Glass button style.

    /// - Parameter style: The glass variant to use (regular, clear, etc.)

    static func glass(_ style: Glass) -> GlassButtonStyle {

        GlassButtonStyle(glass: style)

    }

    

    /// Applies a prominent Liquid Glass button style (usually with accent color backing).

    static var glassProminent: GlassButtonStyle {

        GlassButtonStyle(glass: .frosted, isProminent: true)

    }

}
