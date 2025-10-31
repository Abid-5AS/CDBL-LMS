//
//  SyncStatusView.swift
//  CDBLLeaveCompanion
//
//  View showing sync status and results
//

import SwiftUI

struct SyncStatusView: View {
    let result: SyncResult
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: StyleGuide.Spacing.xl) {
                // Status icon
                Image(systemName: result.success ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(result.success ? StyleGuide.Colors.success : StyleGuide.Colors.error)
                
                // Status message
                Text(result.success ? "Sync Successful" : "Sync Failed")
                    .font(StyleGuide.Typography.largeTitle)
                
                Text(result.message)
                    .font(StyleGuide.Typography.body)
                    .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                if let items = result.syncedItems {
                    Text("\(items) items synced")
                        .font(StyleGuide.Typography.caption)
                        .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                }
                
                Spacer()
                
                Button("Done") {
                    dismiss()
                }
                .glassButton(style: .primary)
                .padding(.horizontal)
                .padding(.bottom)
            }
            .padding()
            .background(StyleGuide.Colors.background)
            .navigationTitle("Sync Status")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarGlassBackground()
        }
    }
}

