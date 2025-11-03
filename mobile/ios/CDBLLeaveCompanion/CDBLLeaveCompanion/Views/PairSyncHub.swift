//
//  PairSyncHub.swift
//  CDBLLeaveCompanion
//
//  Central hub for pairing, snapshot import, delta export, and receipt scanning
//

import SwiftUI

struct PairSyncHub: View {
    @State private var showSnapshotScanner = false
    @State private var showReceiptScanner = false
    @State private var showDeltaExport = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: StyleGuide.Spacing.lg) {
                    // Device Status
                    DeviceStatusCard()
                    
                    // Quick Actions
                    VStack(spacing: StyleGuide.Spacing.md) {
                        QuickActionButton(
                            title: "Scan Snapshot QR",
                            icon: "qrcode.viewfinder",
                            description: "Import balances, holidays, and requests"
                        ) {
                            showSnapshotScanner = true
                        }
                        
                        QuickActionButton(
                            title: "Export Delta",
                            icon: "square.and.arrow.up",
                            description: "Send pending requests to desktop"
                        ) {
                            showDeltaExport = true
                        }
                        
                        QuickActionButton(
                            title: "Scan Receipt QR",
                            icon: "checkmark.circle.fill",
                            description: "Reconcile sent requests"
                        ) {
                            showReceiptScanner = true
                        }
                    }
                    .padding(.horizontal, StyleGuide.Spacing.md)
                    
                    // Sync History
                    SyncHistorySection()
                        .padding(.horizontal, StyleGuide.Spacing.md)
                }
                .padding(.vertical, StyleGuide.Spacing.md)
            }
            .background(StyleGuide.Colors.background.ignoresSafeArea())
            .navigationTitle("Pair & Sync")
            .navigationBarGlassBackground()
            .sheet(isPresented: $showSnapshotScanner) {
                QRScannerView()
            }
            .sheet(isPresented: $showReceiptScanner) {
                QRScannerView()
            }
            .sheet(isPresented: $showDeltaExport) {
                DeltaExportView()
            }
        }
    }
}

// MARK: - Device Status Card

struct DeviceStatusCard: View {
    var body: some View {
        VStack(spacing: StyleGuide.Spacing.md) {
            HStack {
                Circle()
                    .fill(Color.green)
                    .frame(width: 12, height: 12)
                
                Text("Device Status: Paired")
                    .font(StyleGuide.Typography.bodyBold)
                
                Spacer()
            }
            
            HStack {
                Text("Last sync: 2h ago")
                    .font(StyleGuide.Typography.caption)
                    .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                
                Spacer()
                
                Text("Jan 30, 10:00")
                    .font(StyleGuide.Typography.caption)
                    .foregroundColor(StyleGuide.Colors.foregroundTertiary)
            }
        }
        .padding(StyleGuide.Spacing.md)
        .background(Glass.thinMaterial)
        .cornerRadius(Glass.CornerRadius.standard)
        .padding(.horizontal, StyleGuide.Spacing.md)
    }
}

// MARK: - Quick Action Button

struct QuickActionButton: View {
    let title: String
    let icon: String
    let description: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: StyleGuide.Spacing.md) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(StyleGuide.Colors.primary)
                    .frame(width: 40)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(StyleGuide.Typography.bodyBold)
                        .foregroundColor(StyleGuide.Colors.foreground)
                    
                    Text(description)
                        .font(.caption)
                        .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(StyleGuide.Colors.foregroundTertiary)
                    .font(.caption)
            }
            .padding(StyleGuide.Spacing.md)
            .background(Glass.regularMaterial)
            .cornerRadius(Glass.CornerRadius.standard)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Sync History Section

struct SyncHistorySection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: StyleGuide.Spacing.md) {
            Text("Sync History")
                .font(StyleGuide.Typography.title3)
                .foregroundColor(StyleGuide.Colors.foreground)
            
            VStack(spacing: StyleGuide.Spacing.sm) {
                SyncHistoryRow(
                    action: "Snapshot import",
                    timestamp: "2h ago"
                )
                SyncHistoryRow(
                    action: "Delta export",
                    timestamp: "5h ago"
                )
                SyncHistoryRow(
                    action: "Receipt confirmed",
                    timestamp: "Yesterday"
                )
            }
        }
    }
}

struct SyncHistoryRow: View {
    let action: String
    let timestamp: String
    
    var body: some View {
        HStack {
            Circle()
                .fill(Color.green)
                .frame(width: 6, height: 6)
            
            Text(action)
                .font(StyleGuide.Typography.caption)
            
            Spacer()
            
            Text(timestamp)
                .font(.caption2)
                .foregroundColor(StyleGuide.Colors.foregroundTertiary)
        }
    }
}

// MARK: - Delta Export View

struct DeltaExportView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Text("Export pending deltas")
                    .font(StyleGuide.Typography.body)
                    .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            }
            .navigationTitle("Export Delta")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {}
                }
            }
        }
    }
}

#if DEBUG
@available(iOS 17.0, *)
struct PairSyncHub_Previews: PreviewProvider {
    static var previews: some View {
        PairSyncHub()
    }
}
#endif

