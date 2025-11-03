//
//  Glass.swift
//  CDBLLeaveCompanion
//
//  iOS 26 Liquid Glass unified components
//

import SwiftUI

// MARK: - Glass Surfaces

/// Unified glass surface styles for iOS 26
/// Uses SwiftUI Materials for system-provided glass effects
@available(iOS 17.0, *)
enum Glass {
    
    /// Thin material for list backgrounds
    static let thinMaterial = Material.thin
    
    /// Regular material for main cards
    static let regularMaterial = Material.regular
    
    /// Thick material for elevated surfaces (iOS 18+)
    @available(iOS 18.0, *)
    static let thickMaterial = Material.thick
    
    /// Corner radius scale for liquid glass
    enum CornerRadius {
        static let standard: CGFloat = 12  // Main cards
        static let compact: CGFloat = 8    // Chips and badges
        static let elevated: CGFloat = 16  // Modal cards
    }
    
    /// Shadow configuration for depth
    enum Shadow {
        static let subtle = Color.black.opacity(0.1)
        static let elevated = Color.black.opacity(0.15)
        static let blurRadius: CGFloat = 8
    }
}

// MARK: - Glass Card View

/// iOS 26 liquid glass card with unified styling
@available(iOS 17.0, *)
struct GlassCard<Content: View>: View {
    let content: Content
    let style: GlassCardStyle
    
    enum GlassCardStyle {
        case standard      // Default card
        case compact       // Smaller radius
        case elevated      // Larger radius, thicker shadow
    }
    
    init(style: GlassCardStyle = .standard, @ViewBuilder content: () -> Content) {
        self.style = style
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(StyleGuide.Spacing.md)
            .background(Glass.regularMaterial)
            .background(
                ZStack {
                    StyleGuide.Colors.elevatedSurface
                    LinearGradient(
                        colors: [
                            StyleGuide.Colors.accentGradientStart.opacity(0.18),
                            StyleGuide.Colors.accentGradientEnd.opacity(0.12)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            )
            .cornerRadius(cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        LinearGradient(
                            colors: [
                                StyleGuide.Colors.accentGradientStart.opacity(0.38),
                                StyleGuide.Colors.accentGradientEnd.opacity(0.22)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
                    .opacity(0.7)
            )
            .shadow(
                color: shadowColor,
                radius: shadowBlur,
                x: 0,
                y: shadowOffset
            )
    }
    
    private var cornerRadius: CGFloat {
        switch style {
        case .standard: return Glass.CornerRadius.standard
        case .compact: return Glass.CornerRadius.compact
        case .elevated: return Glass.CornerRadius.elevated
        }
    }
    
    private var shadowColor: Color {
        switch style {
        case .standard, .compact: return Glass.Shadow.subtle
        case .elevated: return Glass.Shadow.elevated
        }
    }
    
    private var shadowBlur: CGFloat {
        switch style {
        case .standard, .compact: return Glass.Shadow.blurRadius
        case .elevated: return Glass.Shadow.blurRadius * 1.5
        }
    }
    
    private var shadowOffset: CGFloat {
        switch style {
        case .standard, .compact: return 2
        case .elevated: return 4
        }
    }
}

// MARK: - Status Chip

/// Compact status chip with monochrome icon and status color ring
@available(iOS 17.0, *)
struct StatusChip: View {
    let label: String
    let icon: String
    let statusColor: Color
    let size: ChipSize
    
    enum ChipSize {
        case small   // 28pt height
        case medium  // 36pt height
    }
    
    init(_ label: String, icon: String, statusColor: Color, size: ChipSize = .medium) {
        self.label = label
        self.icon = icon
        self.statusColor = statusColor
        self.size = size
    }
    
    var body: some View {
        HStack(spacing: size == .small ? 4 : 6) {
            Circle()
                .fill(statusColor)
                .frame(width: size == .small ? 8 : 10, height: size == .small ? 8 : 10)
            
            Image(systemName: icon)
                .font(size == .small ? .caption2 : .caption)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            
            Text(label)
                .font(size == .small ? .caption2 : .caption)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
        }
        .padding(.horizontal, size == .small ? 8 : 10)
        .padding(.vertical, size == .small ? 4 : 6)
        .background(Glass.thinMaterial)
        .background(
            RoundedRectangle(cornerRadius: Glass.CornerRadius.compact, style: .continuous)
                .fill(StyleGuide.Colors.elevatedSurface.opacity(0.5))
        )
        .overlay(
            RoundedRectangle(cornerRadius: Glass.CornerRadius.compact, style: .continuous)
                .stroke(statusColor.opacity(0.3), lineWidth: 1)
        )
        .cornerRadius(Glass.CornerRadius.compact)
    }
}

// MARK: - Progress Ring

/// iOS 26 liquid glass progress ring
@available(iOS 17.0, *)
struct ProgressRing: View {
    let progress: Double
    let color: Color
    let lineWidth: CGFloat
    
    init(progress: Double, color: Color = StyleGuide.Colors.primary, lineWidth: CGFloat = 8) {
        self.progress = max(0, min(1, progress))
        self.color = color
        self.lineWidth = lineWidth
    }
    
    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(StyleGuide.Colors.foregroundTertiary.opacity(0.2), lineWidth: lineWidth)
            
            // Progress ring with gradient
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    AngularGradient(
                        colors: [
                            color.opacity(0.8),
                            color.opacity(1.0)
                        ],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.5, dampingFraction: 0.7), value: progress)
        }
    }
}

// MARK: - High Contrast Variant

/// High contrast variant for accessibility
@available(iOS 17.0, *)
extension GlassCard {
    @ViewBuilder
    func highContrast() -> some View {
        content
            .padding(StyleGuide.Spacing.md)
            .background(StyleGuide.Colors.elevatedSurface)
            .cornerRadius(cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(StyleGuide.Colors.foregroundTertiary, lineWidth: 2)
            )
            .shadow(
                color: shadowColor,
                radius: shadowBlur,
                x: 0,
                y: shadowOffset
            )
    }
}

// MARK: - Preview

#if DEBUG
@available(iOS 17.0, *)
struct Glass_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            GlassCard(style: .standard) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Leave Balance")
                        .font(StyleGuide.Typography.title2)
                    Text("7 / 10 days remaining")
                        .font(StyleGuide.Typography.body)
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                }
            }
            .padding()
            
            HStack(spacing: 12) {
                StatusChip("Pending", icon: "clock.fill", statusColor: .orange)
                StatusChip("Approved", icon: "checkmark.circle.fill", statusColor: .green)
                StatusChip("Rejected", icon: "xmark.circle.fill", statusColor: .red, size: .small)
            }
            .padding()
            
            ProgressRing(progress: 0.7, color: .blue)
                .frame(width: 60, height: 60)
                .padding()
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.2), Color.purple.opacity(0.2)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .previewLayout(.sizeThatFits)
    }
}
#endif

