//
//  GlassCard.swift
//  CDBLLeaveCompanion
//
//  Reusable glass card component following iOS 26 Liquid Glass design
//

import SwiftUI

/// A card component with iOS 26 Liquid Glass styling
/// Uses system-provided glass effects
struct GlassCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        if #available(iOS 26.0, *) {
            content
                .padding(StyleGuide.Spacing.md)
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium))
                .overlay(
                    RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    StyleGuide.Colors.accentGradientStart.opacity(0.35),
                                    StyleGuide.Colors.accentGradientEnd.opacity(0.2)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                        .opacity(0.8)
                )
                .shadow(color: StyleGuide.Shadows.subtle, radius: 8, x: 0, y: 2)
        } else {
            content
                .glassCard()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct GlassCard_Previews: PreviewProvider {
    static var previews: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Leave Request")
                    .font(StyleGuide.Typography.title2)
                Text("This is a glass card with system styling")
                    .font(StyleGuide.Typography.body)
                    .foregroundColor(StyleGuide.Colors.foregroundSecondary)
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
