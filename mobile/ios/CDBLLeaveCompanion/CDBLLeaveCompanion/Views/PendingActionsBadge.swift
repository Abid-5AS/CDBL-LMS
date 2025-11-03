//
//  PendingActionsBadge.swift
//  CDBLLeaveCompanion
//
//  Dashboard badge showing pending queue actions
//

import SwiftUI

struct PendingActionsBadge: View {
    let count: Int
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: StyleGuide.Spacing.sm) {
                Image(systemName: "exclamationmark.circle.fill")
                    .foregroundColor(.orange)
                
                Text("Pending actions (\(count))")
                    .font(StyleGuide.Typography.bodyBold)
                    .foregroundColor(StyleGuide.Colors.foreground)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                    .font(.caption)
            }
            .padding(StyleGuide.Spacing.md)
            .background(Glass.thinMaterial)
            .background(
                RoundedRectangle(cornerRadius: Glass.CornerRadius.standard, style: .continuous)
                    .fill(Color.orange.opacity(0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: Glass.CornerRadius.standard, style: .continuous)
                    .stroke(Color.orange.opacity(0.3), lineWidth: 1)
            )
            .cornerRadius(Glass.CornerRadius.standard)
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
@available(iOS 17.0, *)
struct PendingActionsBadge_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            PendingActionsBadge(count: 0) {}
            PendingActionsBadge(count: 2) {}
            PendingActionsBadge(count: 99) {}
        }
        .padding()
        .background(StyleGuide.Colors.background)
    }
}
#endif

