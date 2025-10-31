//
//  ActivityBadge.swift
//  CDBLLeaveCompanion
//
//  Custom activity badge with iOS 26 Liquid Glass styling
//  Following Apple's Liquid Glass design guidelines
//

import SwiftUI

/// Custom activity badge component with Liquid Glass styling
struct ActivityBadge: View {
    let text: String
    let style: BadgeStyle
    
    enum BadgeStyle {
        case info
        case success
        case warning
        case error
        
        var color: Color {
            switch self {
            case .info: return .blue
            case .success: return .green
            case .warning: return .orange
            case .error: return .red
            }
        }
    }
    
    var body: some View {
        if #available(iOS 26.0, *) {
            Text(text)
                .font(StyleGuide.Typography.caption)
                .fontWeight(.medium)
                .padding(.horizontal, StyleGuide.Spacing.sm)
                .padding(.vertical, StyleGuide.Spacing.xs)
                .background(style.color.opacity(0.2))
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small)) // iOS 26 Liquid Glass
                .foregroundColor(style.color)
                .overlay(
                    RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small)
                        .strokeBorder(style.color.opacity(0.4), lineWidth: 1)
                )
        } else {
            Text(text)
                .font(StyleGuide.Typography.caption)
                .fontWeight(.medium)
                .padding(.horizontal, StyleGuide.Spacing.sm)
                .padding(.vertical, StyleGuide.Spacing.xs)
                .background(style.color.opacity(0.2))
                .background(.ultraThinMaterial)
                .foregroundColor(style.color)
                .cornerRadius(StyleGuide.CornerRadius.small)
                .overlay(
                    RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small)
                        .strokeBorder(style.color.opacity(0.4), lineWidth: 1)
                )
        }
    }
}

// MARK: - Preview

#if DEBUG
struct ActivityBadge_Previews: PreviewProvider {
    static var previews: some View {
        HStack(spacing: 12) {
            ActivityBadge(text: "New", style: .info)
            ActivityBadge(text: "Complete", style: .success)
            ActivityBadge(text: "Pending", style: .warning)
            ActivityBadge(text: "Error", style: .error)
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

