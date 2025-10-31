//
//  StyleGuide.swift
//  CDBLLeaveCompanion
//
//  iOS 26 Liquid Glass Design System (Stable Release)
//  Following Apple's system-provided Liquid Glass effects
//

import SwiftUI
import CoreGraphics
#if canImport(UIKit)
import UIKit
typealias PlatformColor = UIColor
#elseif canImport(AppKit)
import AppKit
typealias PlatformColor = NSColor
#endif

// MARK: - Design Tokens

/// Design system tokens for iOS 26 Liquid Glass UI
/// Leverages system-provided glass effects rather than custom implementations
enum StyleGuide {
    
    // MARK: - Colors
    
    /// Minimal color palette - content-focused, letting system glass effects shine through
    enum Colors {
        private static func dynamicColor(light: PlatformColor, dark: PlatformColor) -> Color {
            #if canImport(UIKit)
            return Color(
                UIColor { traitCollection in
                    traitCollection.userInterfaceStyle == .dark ? dark : light
                }
            )
            #elseif canImport(AppKit)
            return Color(
                NSColor(
                    name: nil,
                    dynamicProvider: { appearance in
                        appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? dark : light
                    }
                )
            )
            #else
            return Color(light)
            #endif
        }
        
        private static func platformColor(_ red: Double, _ green: Double, _ blue: Double, _ alpha: Double = 1.0) -> PlatformColor {
            PlatformColor(
                red: CGFloat(red),
                green: CGFloat(green),
                blue: CGFloat(blue),
                alpha: CGFloat(alpha)
            )
        }
        
        static let primary = Color.accentColor
        static let secondary = dynamicColor(
            light: platformColor(0.37, 0.42, 0.56),
            dark: platformColor(0.72, 0.77, 0.88)
        )
        
        // System adaptive colors
        static let background = dynamicColor(
            light: platformColor(0.96, 0.97, 0.99),
            dark: platformColor(0.10, 0.12, 0.17)
        )
        static let elevatedSurface = dynamicColor(
            light: platformColor(1.0, 1.0, 1.0, 0.95),
            dark: platformColor(0.15, 0.18, 0.26, 0.95)
        )
        static let fieldBackground = dynamicColor(
            light: platformColor(0.99, 1.0, 1.0, 0.95),
            dark: platformColor(0.18, 0.21, 0.29, 0.95)
        )
        static let accentGradientStart = dynamicColor(
            light: platformColor(0.44, 0.55, 0.96),
            dark: platformColor(0.28, 0.33, 0.65)
        )
        static let accentGradientEnd = dynamicColor(
            light: platformColor(0.34, 0.80, 0.93),
            dark: platformColor(0.22, 0.48, 0.71)
        )
        static let primaryForeground = dynamicColor(
            light: platformColor(1.0, 1.0, 1.0, 0.95),
            dark: platformColor(0.94, 0.96, 0.99, 0.95)
        )
        
        static let foreground = dynamicColor(
            light: platformColor(0.13, 0.16, 0.24),
            dark: platformColor(0.93, 0.95, 0.98)
        )
        static let foregroundSecondary = dynamicColor(
            light: platformColor(0.37, 0.42, 0.55),
            dark: platformColor(0.76, 0.80, 0.90)
        )
        static let foregroundTertiary = dynamicColor(
            light: platformColor(0.55, 0.60, 0.70),
            dark: platformColor(0.64, 0.68, 0.78)
        )
        
        // Semantic colors for status
        static let success = Color.green
        static let warning = Color.orange
        static let error = Color.red
    }
    
    // MARK: - Typography
    
    enum Typography {
        static let largeTitle = Font.largeTitle.weight(.bold)
        static let title = Font.title.weight(.semibold)
        static let title2 = Font.title2.weight(.semibold)
        static let title3 = Font.title3.weight(.medium)
        static let body = Font.body
        static let bodyBold = Font.body.weight(.semibold)
        static let callout = Font.callout
        static let caption = Font.caption
        static let caption2 = Font.caption2
    }
    
    // MARK: - Spacing
    
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    
    enum CornerRadius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 12
        static let large: CGFloat = 16
        static let xlarge: CGFloat = 24
    }
    
    // MARK: - Shadows
    
    /// Minimal shadows - iOS 26 Liquid Glass uses system depth effects
    enum Shadows {
        static let subtle = Color.black.opacity(0.1)
        static let medium = Color.black.opacity(0.15)
    }
}

// MARK: - View Modifiers

extension View {
    
    /// Apply iOS 26 Liquid Glass background extension effect
    /// Use with NavigationSplitView sidebars and panels
    /// Requires iOS 26.0+ (stable release)
    @available(iOS 26.0, *)
    func liquidGlassBackgroundExtension() -> some View {
        self.backgroundExtensionEffect()
    }
    
    /// Apply the navigation bar glass toolbar background on iOS 26+
    @ViewBuilder
    func navigationBarGlassBackground() -> some View {
        if #available(iOS 26.0, *) {
            self.toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        } else {
            self
        }
    }
    
    /// Glass card style - minimal styling, letting system handle glass effects
    func glassCard() -> some View {
        self
            .padding(StyleGuide.Spacing.md)
            .background(.ultraThinMaterial)
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
                .clipShape(RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium, style: .continuous))
            )
            .cornerRadius(StyleGuide.CornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium, style: .continuous)
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
            .shadow(color: StyleGuide.Shadows.subtle, radius: 8, x: 0, y: 2)
    }
    
    /// Glass button style
    func glassButton(style: GlassButtonStyle = .primary) -> some View {
        self
            .padding(.horizontal, StyleGuide.Spacing.lg)
            .padding(.vertical, StyleGuide.Spacing.md)
            .frame(minHeight: 44)
            .background(
                Group {
                    if style == .primary {
                        LinearGradient(
                            colors: [
                                StyleGuide.Colors.accentGradientStart.opacity(0.45),
                                StyleGuide.Colors.accentGradientEnd.opacity(0.35)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    } else if style == .destructive {
                        StyleGuide.Colors.error.opacity(0.18)
                    } else {
                        StyleGuide.Colors.elevatedSurface.opacity(0.55)
                    }
                }
            )
            .background(.ultraThinMaterial)
            .cornerRadius(StyleGuide.CornerRadius.medium)
            .overlay {
                Group {
                    if style == .primary {
                        RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        StyleGuide.Colors.accentGradientStart.opacity(0.55),
                                        StyleGuide.Colors.accentGradientEnd.opacity(0.32)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    } else if style == .destructive {
                        RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium)
                            .strokeBorder(StyleGuide.Colors.error.opacity(0.5), lineWidth: 1)
                    } else {
                        RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.medium)
                            .strokeBorder(StyleGuide.Colors.secondary.opacity(0.35), lineWidth: 1)
                    }
                }
            }
    }
}

// MARK: - Glass Button Style

enum GlassButtonStyle {
    case primary
    case secondary
    case destructive
}

// MARK: - Preview Helpers

#if DEBUG
struct StyleGuide_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            // Glass Card Example
            VStack(alignment: .leading, spacing: 8) {
                Text("Leave Summary")
                    .font(StyleGuide.Typography.title2)
                Text("This is a glass card example")
                    .font(StyleGuide.Typography.body)
                    .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            }
            .glassCard()
            .padding()
            
            // Glass Button Examples
            HStack(spacing: 16) {
                Button("Primary") {}
                    .glassButton(style: .primary)
                
                Button("Secondary") {}
                    .glassButton(style: .secondary)
            }
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
