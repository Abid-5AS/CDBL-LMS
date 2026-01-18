//
//  ApprovalsListView.swift
//  CDBLLeaveManager
//
//  List of pending approvals for managers and HR.
//

import SwiftUI
import Combine

struct ApprovalsListView: View {
    @StateObject private var viewModel = ApprovalsViewModel()
    @State private var selectedSegment = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            header
            
            // Segmented Control
            segmentedControl
            
            // Content
            if viewModel.isLoading && viewModel.pendingApprovals.isEmpty {
                LoadingView()
            } else if let error = viewModel.error, viewModel.pendingApprovals.isEmpty {
                ErrorView(error) {
                    Task { await viewModel.loadApprovals() }
                }
            } else if viewModel.currentApprovals.isEmpty {
                EmptyStateView(
                    icon: "checkmark.circle",
                    title: "All Caught Up!",
                    message: selectedSegment == 0 ? 
                        "No pending approvals at the moment." :
                        "No approval history to show."
                )
            } else {
                approvalsList
            }
        }
        .task {
            await viewModel.loadApprovals()
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Approvals")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
            
            Spacer()
            
            if viewModel.pendingApprovals.count > 0 {
                Text("\(viewModel.pendingApprovals.count)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.3))
                    .clipShape(Capsule())
                    .foregroundStyle(.orange)
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Segmented Control
    
    private var segmentedControl: some View {
        HStack(spacing: 0) {
            ForEach(Array(["Pending", "History"].enumerated()), id: \.offset) { index, title in
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedSegment = index
                        if index == 1 && viewModel.approvalHistory.isEmpty {
                            Task { await viewModel.loadHistory() }
                        }
                    }
                }) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(selectedSegment == index ? .semibold : .regular)
                        .foregroundStyle(selectedSegment == index ? .white : .white.opacity(0.6))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            selectedSegment == index ?
                            AnyShapeStyle(Color.white.opacity(0.2)) :
                            AnyShapeStyle(Color.clear)
                        )
                }
            }
        }
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .padding(.bottom, 16)
    }
    
    // MARK: - Approvals List
    
    private var approvalsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.currentApprovals) { approval in
                    ApprovalDetailCard(
                        approval: approval,
                        showActions: selectedSegment == 0,
                        onApprove: {
                            Task { await viewModel.approve(approval) }
                        },
                        onReject: {
                            viewModel.selectedForAction = approval
                            viewModel.showRejectSheet = true
                        }
                    )
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
}

// MARK: - Approval Detail Card

struct ApprovalDetailCard: View {
    let approval: PendingApproval
    let showActions: Bool
    let onApprove: () -> Void
    let onReject: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack(spacing: 12) {
                // Avatar
                Circle()
                    .fill(Color(.tertiarySystemBackground))
                    .frame(width: 50, height: 50)
                    .overlay(
                        Text(initials)
                            .font(.headline)
                            .foregroundStyle(.primary)
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(approval.employeeName)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    
                    Text(approval.department)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Type Badge
                Text(approval.leaveType.capitalized)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(approval.typeColor.opacity(0.2))
                    .clipShape(Capsule())
                    .foregroundStyle(approval.typeColor)
            }
            
            // Details
            HStack(spacing: 24) {
                DetailItem(icon: "calendar", label: "Dates", value: approval.formattedDateRange)
                DetailItem(icon: "clock", label: "Duration", value: approval.daysText)
            }
            
            // Reason
            if let reason = approval.reason, !reason.isEmpty {
                Text(reason)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.white.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            
            // Actions
            if showActions {
                HStack(spacing: 12) {
                    Button(action: onReject) {
                        HStack {
                            Image(systemName: "xmark")
                            Text("Reject")
                        }
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                    }
                    .buttonStyle(.bordered)
                    .foregroundStyle(.red)
                    
                    Button(action: onApprove) {
                        HStack {
                            Image(systemName: "checkmark")
                            Text("Approve")
                        }
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                }
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
    }
    
    private var initials: String {
        let parts = approval.employeeName.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return approval.employeeName.prefix(2).uppercased()
    }
}

// MARK: - Detail Item

struct DetailItem: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
            }
        }
    }
}

// MARK: - ViewModel

@MainActor
final class ApprovalsViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var pendingApprovals: [PendingApproval] = []
    @Published var approvalHistory: [PendingApproval] = []
    @Published var selectedForAction: PendingApproval?
    @Published var showRejectSheet = false
    @Published var rejectComments = ""
    
    private let approvalService = ApprovalService.shared
    
    var currentApprovals: [PendingApproval] {
        pendingApprovals
    }
    
    func loadApprovals() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await approvalService.getPendingApprovals()
            pendingApprovals = response.allApprovals
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    func loadHistory() async {
        do {
            let response = try await approvalService.getApprovalHistory()
            approvalHistory = response.allApprovals
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    func approve(_ approval: PendingApproval) async {
        do {
            _ = try await approvalService.approveLeave(id: approval.id)
            pendingApprovals.removeAll { $0.id == approval.id }
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    func reject(_ approval: PendingApproval, comments: String) async {
        do {
            _ = try await approvalService.rejectLeave(id: approval.id, comments: comments)
            pendingApprovals.removeAll { $0.id == approval.id }
            showRejectSheet = false
            rejectComments = ""
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#Preview {
    ZStack {
        Color(.systemBackground).ignoresSafeArea()
        ApprovalsListView()
    }
}
