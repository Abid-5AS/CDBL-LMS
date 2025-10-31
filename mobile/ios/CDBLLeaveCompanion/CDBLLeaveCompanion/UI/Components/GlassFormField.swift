//
//  GlassFormField.swift
//  CDBLLeaveCompanion
//
//  Reusable form field component with iOS 26 Liquid Glass styling
//

import SwiftUI

/// A form field wrapper with glass styling
struct GlassFormField<Content: View>: View {
    let label: String
    let isRequired: Bool
    let content: Content
    let errorMessage: String?
    
    init(
        label: String,
        isRequired: Bool = false,
        errorMessage: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.label = label
        self.isRequired = isRequired
        self.content = content()
        self.errorMessage = errorMessage
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
            // Label
            HStack(spacing: 4) {
                Text(label)
                    .font(StyleGuide.Typography.callout)
                    .foregroundColor(StyleGuide.Colors.foreground)
                if isRequired {
                    Text("*")
                        .foregroundColor(StyleGuide.Colors.error)
                }
            }
            
            // Content with glass background
            content
                .padding(StyleGuide.Spacing.md)
                .background(.ultraThinMaterial)
                .background(
                    RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small, style: .continuous)
                        .fill(StyleGuide.Colors.fieldBackground)
                        .overlay(
                            LinearGradient(
                                colors: [
                                    StyleGuide.Colors.accentGradientStart.opacity(0.12),
                                    StyleGuide.Colors.accentGradientEnd.opacity(0.08)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                            .clipShape(RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small, style: .continuous))
                        )
                )
                .cornerRadius(StyleGuide.CornerRadius.small)
                .overlay {
                    RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small, style: .continuous)
                        .strokeBorder(StyleGuide.Colors.error.opacity(0.55), lineWidth: 1)
                        .opacity(errorMessage != nil ? 1 : 0)
                }
                .overlay {
                    RoundedRectangle(cornerRadius: StyleGuide.CornerRadius.small, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    StyleGuide.Colors.accentGradientStart.opacity(0.35),
                                    StyleGuide.Colors.accentGradientEnd.opacity(0.25)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                        .opacity(errorMessage == nil ? 0.65 : 0.25)
                }
            
            // Error message
            if let errorMessage = errorMessage {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(StyleGuide.Colors.error)
                    Text(errorMessage)
                        .font(StyleGuide.Typography.caption)
                        .foregroundColor(StyleGuide.Colors.error)
                }
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
struct GlassFormField_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            GlassFormField(label: "Leave Type", isRequired: true) {
                TextField("Select type", text: .constant(""))
            }
            
            GlassFormField(
                label: "Reason",
                isRequired: true,
                errorMessage: "Reason must be at least 10 characters"
            ) {
                TextEditor(text: .constant(""))
                    .frame(height: 100)
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
