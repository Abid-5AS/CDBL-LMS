//
//  ManagerDashboardView.swift
//  CDBLLeaveManager
//
//  Dashboard for Department Heads/Managers.
//

import SwiftUI

struct ManagerDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                LoadingView()
                    .frame(height: 400)
            } else if let error = viewModel.error {
                ErrorView(error) {
                    Task { await viewModel.loadDashboard(for: .deptHead) }
                }
            } else {
                dashboardContent
            }
        }
        .task {
            await viewModel.loadDashboard(for: .deptHead)
        }
    }
    
    private var dashboardContent: some View {
        VStack(spacing: 24) {
            // Header
            DashboardHeader()
            
            // Pending Approvals Alert
            if viewModel.pendingApprovalsCount > 0 {
                pendingApprovalsCard
            }
            
            // KPI Grid
            kpiGrid
            
            // Pending Approvals List
            pendingApprovalsSection
            
            // Quick Actions
            quickActionsSection
            
            Spacer().frame(height: 100)
        }
        .padding(.top, 20)
    }
    
    // MARK: - Pending Approvals Card
    
    private var pendingApprovalsCard: some View {
        Button(action: {}) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(Color.orange.opacity(0.2))
                        .frame(width: 50, height: 50)
                    
                    Image(systemName: "bell.badge.fill")
                        .font(.title2)
                        .foregroundStyle(.orange)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Pending Approvals")
                        .font(.headline)
                        .foregroundStyle(.white)
                    
                    Text("\(viewModel.pendingApprovalsCount) request(s) awaiting your review")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundStyle(.white.opacity(0.5))
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [Color.orange.opacity(0.2), Color.orange.opacity(0.1)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(Color.orange.opacity(0.3), lineWidth: 1)
            )
        }
        .padding(.horizontal)
    }
    
    // MARK: - KPI Grid
    
    private var kpiGrid: some View {
        HStack(spacing: 12) {
            KPICard(
                title: "Pending",
                value: "\(viewModel.pendingApprovalsCount)",
                subtitle: "Awaiting review",
                color: .orange
            )
            
            KPICard(
                title: "Team Available",
                value: "\(Int(viewModel.teamAvailability))%",
                subtitle: "Working today",
                color: .green
            )
        }
        .padding(.horizontal)
    }
    
    // MARK: - Pending Approvals Section
    
    private var pendingApprovalsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Requests")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.9))
                
                Spacer()
                
                Button("View All") {}
                    .font(.caption)
                    .foregroundStyle(.cyan)
            }
            .padding(.horizontal)
            
            if viewModel.pendingApprovals.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("All caught up! No pending approvals.")
                        .foregroundStyle(.white.opacity(0.7))
                }
                .padding()
                .frame(maxWidth: .infinity)
                .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)
            } else {
                VStack(spacing: 12) {
                    ForEach(viewModel.pendingApprovals.prefix(5)) { approval in
                        ApprovalCard(approval: approval)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Quick Actions
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            HStack(spacing: 12) {
                ActionButton(icon: "checkmark.circle.fill", title: "Approvals", color: .green)
                ActionButton(icon: "person.3.fill", title: "Team", color: .blue)
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Approval Card

struct ApprovalCard: View {
    let approval: PendingApproval
    
    var body: some View {
        HStack(spacing: 16) {
            // Avatar
            Circle()
                .fill(
                    LinearGradient(
                        colors: [.cyan.opacity(0.5), .purple.opacity(0.5)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 44, height: 44)
                .overlay(
                    Text(initials)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                )
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(approval.employeeName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                
                HStack(spacing: 8) {
                    Text(approval.leaveType.capitalized)
                        .font(.caption)
                        .foregroundStyle(approval.typeColor)
                    
                    Text("•")
                        .foregroundStyle(.white.opacity(0.4))
                    
                    Text(approval.formattedDateRange)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
            
            Spacer()
            
            // Days
            VStack(alignment: .trailing) {
                Text(approval.daysText)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
            }
        }
        .padding()
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 16))
    }
    
    private var initials: String {
        let parts = approval.employeeName.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return approval.employeeName.prefix(2).uppercased()
    }
}

#Preview {
    ZStack {
        FluidBackground()
        ManagerDashboardView()
            .environmentObject(AppState.shared)
    }
}
