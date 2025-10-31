//
//  LeaveRequestDetailView.swift
//  CDBLLeaveCompanion
//
//  Redesigned detail view matching new design system
//

import SwiftUI
import CoreData

struct LeaveRequestDetailView: View {
    let entity: LeaveEntity
    @Environment(\.dismiss) var dismiss
    @State private var showExport = false
    @State private var showDuplicate = false
    @State private var showCancel = false
    @State private var exportRequest: LeaveRequest?
    
    var leaveType: LeaveType? {
        LeaveType(rawValue: entity.type ?? "")
    }
    
    var status: LeaveStatus? {
        LeaveStatus(rawValue: entity.status ?? "")
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    VStack(spacing: StyleGuide.Spacing.lg) {
                        // Status Badge at top
                        if let status = status {
                            ActivityBadge(text: status.displayName, style: badgeStyleForStatus(status))
                                .padding(.top, StyleGuide.Spacing.md)
                        }
                        
                        // Key Facts Grid
                        VStack(spacing: StyleGuide.Spacing.md) {
                            if let type = leaveType {
                                keyFact(label: "Leave Type", value: type.displayName)
                            }
                            
                            Divider()
                            
                            if let startDate = entity.startDate,
                               let endDate = entity.endDate {
                                let days = LeaveRequest.calculateWorkingDays(from: startDate, to: endDate)
                                
                                keyFact(label: "Duration", value: "\(days) day(s)")
                                keyFact(label: "Start Date", value: formattedDate(startDate))
                                keyFact(label: "End Date", value: formattedDate(endDate))
                                
                                Divider()
                            }
                            
                            if let status = status {
                                keyFact(label: "Status", value: status.displayName)
                            }
                            
                            keyFact(
                                label: "Certificate",
                                value: entity.needsCertificate
                                    ? (entity.certificateData != nil ? "Attached" : "Not provided")
                                    : "Not required"
                            )
                        }
                        .padding(StyleGuide.Spacing.md)
                        .glassCard()
                        .padding(.horizontal, StyleGuide.Spacing.md)
                        
                        // Reason Section
                        if let reason = entity.reason, !reason.isEmpty {
                            VStack(alignment: .leading, spacing: StyleGuide.Spacing.sm) {
                                Text("Reason")
                                    .font(StyleGuide.Typography.title3)
                                    .foregroundColor(StyleGuide.Colors.foreground)
                                
                                Text(reason)
                                    .font(StyleGuide.Typography.body)
                                    .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(StyleGuide.Spacing.md)
                            .glassCard()
                            .padding(.horizontal, StyleGuide.Spacing.md)
                        }
                        
                        // Attachment Info
                        if entity.needsCertificate, entity.certificateData != nil {
                            HStack(spacing: StyleGuide.Spacing.sm) {
                                Image(systemName: "doc.text.fill")
                                    .foregroundColor(StyleGuide.Colors.accentGradientStart)
                                Text("Medical certificate attached")
                                    .font(StyleGuide.Typography.body)
                                    .foregroundColor(StyleGuide.Colors.foreground)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(StyleGuide.Spacing.md)
                            .glassCard()
                            .padding(.horizontal, StyleGuide.Spacing.md)
                        }
                        
                        // Action Buttons
                        VStack(spacing: StyleGuide.Spacing.sm) {
                            GlassButton("Re-export Request", style: .primary) {
                                performExport()
                            }
                            
                            if status == .DRAFT || status == .PENDING {
                                GlassButton("Duplicate Request", style: .secondary) {
                                    showDuplicate = true
                                    // TODO: Implement duplication logic
                                }
                            }
                            
                            if status == .DRAFT || status == .PENDING {
                                GlassButton("Cancel Request", style: .destructive) {
                                    showCancel = true
                                    // TODO: Implement cancellation logic
                                }
                            }
                        }
                        .padding(.horizontal, StyleGuide.Spacing.md)
                        .padding(.bottom, StyleGuide.Spacing.lg)
                    }
                    .padding(.vertical, StyleGuide.Spacing.sm)
                }
            }
            .background(StyleGuide.Colors.background.ignoresSafeArea())
            .navigationTitle("Leave Request")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarGlassBackground()
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showExport) {
                if let request = exportRequest {
                    ConfirmationView(request: request)
                }
            }
            .alert("Duplicate Request", isPresented: $showDuplicate) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Duplication feature coming soon.")
            }
            .alert("Cancel Request", isPresented: $showCancel) {
                Button("Cancel", role: .cancel) {}
                Button("Confirm", role: .destructive) {
                    // TODO: Implement cancellation
                }
            } message: {
                Text("Are you sure you want to cancel this request?")
            }
        }
    }
    
    // MARK: - Helpers
    
    @ViewBuilder
    private func keyFact(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(StyleGuide.Typography.body)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
            Spacer()
            Text(value)
                .font(StyleGuide.Typography.bodyBold)
                .foregroundColor(StyleGuide.Colors.foreground)
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        date.formatted(.dateTime.month(.abbreviated).day().year())
    }
    
    private func badgeStyleForStatus(_ status: LeaveStatus) -> ActivityBadge.BadgeStyle {
        switch status {
        case .APPROVED: return .success
        case .REJECTED: return .error
        case .PENDING, .SUBMITTED: return .warning
        case .DRAFT: return .info
        default: return .info
        }
    }
    
    private func performExport() {
        guard let type = leaveType,
              let status = status else {
            return
        }
        
        let request = LeaveRequest(
            id: entity.id,
            type: type,
            startDate: entity.startDate ?? Date(),
            endDate: entity.endDate ?? Date(),
            reason: entity.reason ?? "",
            needsCertificate: entity.needsCertificate,
            status: status
        )
        
        self.exportRequest = request
        showExport = true
    }
}

// MARK: - Preview

#if DEBUG
struct LeaveRequestDetailView_Previews: PreviewProvider {
    static var previews: some View {
        let context = PersistenceController.preview.container.viewContext
        let entity = LeaveEntity(context: context)
        entity.id = UUID()
        entity.type = LeaveType.MEDICAL.rawValue
        entity.startDate = Date()
        entity.endDate = Calendar.current.date(byAdding: .day, value: 5, to: Date()) ?? Date()
        entity.reason = "Medical treatment required for ongoing health condition."
        entity.needsCertificate = true
        entity.status = LeaveStatus.PENDING.rawValue
        entity.createdAt = Date()
        
        return Group {
            LeaveRequestDetailView(entity: entity)
                .environment(\.managedObjectContext, context)
                .previewDisplayName("iPhone 14")
            
            LeaveRequestDetailView(entity: entity)
                .environment(\.managedObjectContext, context)
                .preferredColorScheme(.dark)
                .previewDisplayName("iPhone 14 Dark")
        }
    }
}
#endif
