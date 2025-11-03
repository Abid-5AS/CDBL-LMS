//
//  ReconciliationModal.swift
//  CDBLLeaveCompanion
//
//  Modal for reconciling pending actions and scanning receipts
//

import SwiftUI

struct ReconciliationModal: View {
    @Environment(\.dismiss) private var dismiss
    @State private var pendingActions: [QueuedActionViewModel] = []
    @State private var showScanner = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: StyleGuide.Spacing.md) {
                // Pending actions list
                if pendingActions.isEmpty {
                    EmptyState()
                } else {
                    ScrollView {
                        VStack(spacing: StyleGuide.Spacing.md) {
                            ForEach(pendingActions) { action in
                                QueuedActionCard(action: action)
                            }
                        }
                        .padding(StyleGuide.Spacing.md)
                    }
                }
                
                // Action buttons
                VStack(spacing: StyleGuide.Spacing.sm) {
                    Button(action: { showScanner = true }) {
                        HStack {
                            Image(systemName: "qrcode.viewfinder")
                            Text("Scan Receipt QR")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                    }
                    .glassButton(style: .primary)
                    
                    Button(action: exportAll) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("Export All")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                    }
                    .glassButton(style: .secondary)
                }
                .padding(StyleGuide.Spacing.md)
            }
            .navigationTitle("Pending Actions")
            .navigationBarGlassBackground()
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .sheet(isPresented: $showScanner) {
            QRScannerView()
        }
    }
    
    private func exportAll() {
        // TODO: Export all pending actions
    }
}

// MARK: - Queued Action View Model

struct QueuedActionViewModel: Identifiable {
    let id: UUID
    let type: String
    let status: QueueStatus
    let createdAt: Date
    let missingBlobs: [String]
    
    var displayName: String {
        switch type {
        case "CREATE_LEAVE": return "Leave Request"
        case "CANCEL_LEAVE": return "Leave Cancellation"
        default: return type
        }
    }
    
    var statusIcon: String {
        switch status {
        case .queued: return "clock.fill"
        case .sent: return "envelope.fill"
        case .confirmed: return "checkmark.circle.fill"
        case .partial: return "exclamationmark.triangle.fill"
        case .failed: return "xmark.circle.fill"
        }
    }
    
    var statusColor: Color {
        switch status {
        case .queued: return .orange
        case .sent: return .blue
        case .confirmed: return .green
        case .partial: return .yellow
        case .failed: return .red
        }
    }
}

// MARK: - Queued Action Card

struct QueuedActionCard: View {
    let action: QueuedActionViewModel
    
    var body: some View {
        HStack(spacing: StyleGuide.Spacing.md) {
            Image(systemName: action.statusIcon)
                .foregroundColor(action.statusColor)
                .font(.title3)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(action.displayName)
                    .font(StyleGuide.Typography.bodyBold)
                
                if action.status == .partial && !action.missingBlobs.isEmpty {
                    Text("Missing: \(action.missingBlobs.joined(separator: ", "))")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
            
            Spacer()
            
            Text(action.createdAt, style: .relative)
                .font(.caption)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
        }
        .padding(StyleGuide.Spacing.md)
        .background(Glass.thinMaterial)
        .cornerRadius(Glass.CornerRadius.standard)
    }
}

// MARK: - Empty State

struct EmptyState: View {
    var body: some View {
        VStack(spacing: StyleGuide.Spacing.md) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            Text("All Clear")
                .font(StyleGuide.Typography.title2)
            
            Text("No pending actions")
                .font(StyleGuide.Typography.body)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#if DEBUG
@available(iOS 17.0, *)
struct ReconciliationModal_Previews: PreviewProvider {
    static var previews: some View {
        ReconciliationModal()
    }
}
#endif

