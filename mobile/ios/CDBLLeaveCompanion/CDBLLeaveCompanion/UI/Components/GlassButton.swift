//
//  GlassButton.swift
//  CDBLLeaveCompanion
//
//  Reusable glass button component following iOS 26 Liquid Glass design
//

import SwiftUI

/// A button component with iOS 26 Liquid Glass styling
struct GlassButton: View {
    let title: String
    let action: () -> Void
    let style: GlassButtonStyle
    
    init(_ title: String, style: GlassButtonStyle = .primary, action: @escaping () -> Void) {
        self.title = title
        self.style = style
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(StyleGuide.Typography.bodyBold)
                .foregroundColor(
                    style == .primary
                        ? StyleGuide.Colors.primaryForeground
                        : (style == .destructive ? StyleGuide.Colors.error : StyleGuide.Colors.foregroundSecondary)
                )
        }
        .glassButton(style: style)
    }
}

// MARK: - Preview

#if DEBUG
struct GlassButton_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            GlassButton("Submit", style: .primary) {
                print("Primary tapped")
            }
            
            GlassButton("Cancel", style: .secondary) {
                print("Secondary tapped")
            }
            
            GlassButton("Delete", style: .destructive) {
                print("Destructive tapped")
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.2), Color.purple.opacity(0.2)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }
}
#endif
