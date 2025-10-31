//
//  PolicyChip.swift
//  CDBLLeaveCompanion
//
//  Pill chip component for displaying policy tips with icons
//

import SwiftUI

struct PolicyChip: View {
    let text: String
    let icon: String
    
    init(_ text: String, icon: String = "info.circle.fill") {
        self.text = text
        self.icon = icon
    }
    
    var body: some View {
        HStack(spacing: StyleGuide.Spacing.xs) {
            Image(systemName: icon)
                .font(.caption2)
            Text(text)
                .font(StyleGuide.Typography.caption2)
        }
        .padding(.horizontal, StyleGuide.Spacing.sm)
        .padding(.vertical, StyleGuide.Spacing.xs)
        .background(.ultraThinMaterial)
        .background(
            RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            StyleGuide.Colors.accentGradientStart.opacity(0.15),
                            StyleGuide.Colors.accentGradientEnd.opacity(0.1)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
        )
        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
        .cornerRadius(StyleGuide.CornerRadius.small)
        .overlay(
            RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small, style: .continuous)
                .strokeBorder(
                    LinearGradient(
                        colors: [
                            StyleGuide.Colors.accentGradientStart.opacity(0.3),
                            StyleGuide.Colors.accentGradientEnd.opacity(0.2)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    lineWidth: 0.5
                )
        )
    }
}

// MARK: - Preview

#if DEBUG
struct PolicyChip_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 12) {
            PolicyChip("Max 7 consecutive days", icon: "clock.fill")
            PolicyChip("Must retain 5 days balance", icon: "checkmark.shield.fill")
            PolicyChip("> 3 days requires certificate", icon: "doc.text.fill")
        }
        .padding()
        .background(StyleGuide.Colors.background)
    }
}
#endif

