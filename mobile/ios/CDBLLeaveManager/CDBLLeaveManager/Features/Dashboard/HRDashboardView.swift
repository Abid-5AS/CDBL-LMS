//
//  HRDashboardView.swift
//  CDBLLeaveManager
//
//  Dashboard for HR Admin users.
//

import SwiftUI

struct HRDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                LoadingView()
                    .frame(height: 400)
            } else if let error = viewModel.error {
                ErrorView(error) {
                    Task { await viewModel.loadDashboard(for: .hrAdmin) }
                }
            } else {
                dashboardContent
            }
        }
        .task {
            await viewModel.loadDashboard(for: .hrAdmin)
        }
    }
    
    private var dashboardContent: some View {
        VStack(spacing: 24) {
            // Header
            HRDashboardHeader()
            
            // KPI Overview
            kpiOverview
            
            // Secondary Stats
            secondaryStats
            
            // Pending Requests
            if !viewModel.pendingApprovals.isEmpty {
                pendingRequestsSection
            }
            
            // Quick Actions
            quickActionsSection
            
            Spacer().frame(height: 100)
        }
        .padding(.top, 20)
    }
    
    // MARK: - KPI Overview
    
    private var kpiOverview: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                KPICard(
                    title: "On Leave Today",
                    value: "\(viewModel.hrStats?.employeesOnLeave ?? 0)",
                    subtitle: "Employees",
                    icon: "person.fill.xmark",
                    color: .purple
                )
                
                KPICard(
                    title: "Pending Requests",
                    value: "\(viewModel.hrStats?.pendingRequests ?? 0)",
                    subtitle: "Awaiting action",
                    icon: "clock.fill",
                    color: .orange
                )
            }
            
            HStack(spacing: 12) {
                KPICard(
                    title: "Avg. Approval Time",
                    value: String(format: "%.1fh", viewModel.hrStats?.avgApprovalTime ?? 0),
                    subtitle: "Response time",
                    icon: "timer",
                    color: .cyan
                )
                
                KPICard(
                    title: "Encashment Pending",
                    value: "\(viewModel.hrStats?.encashmentPending ?? 0)",
                    subtitle: "Requests",
                    icon: "banknote.fill",
                    color: .green
                )
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Secondary Stats
    
    private var secondaryStats: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Performance Metrics")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            HStack(spacing: 16) {
                // Compliance Score
                VStack(spacing: 8) {
                    CircularProgressView(
                        progress: (viewModel.hrStats?.complianceScore ?? 0) / 100,
                        color: .green,
                        lineWidth: 8
                    )
                    .frame(width: 80, height: 80)
                    
                    Text("Compliance")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                }
                
                // Team Utilization
                VStack(spacing: 8) {
                    CircularProgressView(
                        progress: (viewModel.hrStats?.teamUtilization ?? 0) / 100,
                        color: .cyan,
                        lineWidth: 8
                    )
                    .frame(width: 80, height: 80)
                    
                    Text("Utilization")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                }
                
                // Stats
                VStack(alignment: .leading, spacing: 12) {
                    StatRow(label: "Total Leaves", value: "\(viewModel.hrStats?.totalLeavesThisYear ?? 0)")
                    StatRow(label: "Processed Today", value: "\(viewModel.hrStats?.processedToday ?? 0)")
                }
                .frame(maxWidth: .infinity)
            }
            .padding()
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Pending Requests Section
    
    private var pendingRequestsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Pending Requests")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.9))
                
                Spacer()
                
                Button("View All") {}
                    .font(.caption)
                    .foregroundStyle(.cyan)
            }
            .padding(.horizontal)
            
            VStack(spacing: 12) {
                ForEach(viewModel.pendingApprovals.prefix(3)) { approval in
                    ApprovalCard(approval: approval)
                }
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Quick Actions
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ActionButton(icon: "checkmark.circle.fill", title: "Approvals", color: .green)
                ActionButton(icon: "person.3.fill", title: "Employees", color: .blue)
                ActionButton(icon: "chart.bar.fill", title: "Reports", color: .purple)
                ActionButton(icon: "banknote.fill", title: "Encashments", color: .orange)
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - HR Dashboard Header

struct HRDashboardHeader: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(formattedDate)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
                Text("HR Dashboard")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
            }
            
            Spacer()
            
            HStack(spacing: 12) {
                Button(action: {}) {
                    Image(systemName: "bell.fill")
                        .foregroundStyle(.white)
                        .padding(10)
                        .glassEffect(in: Circle())
                }
                
                Button(action: {}) {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.white)
                        .padding(10)
                        .glassEffect(in: Circle())
                }
            }
        }
        .padding(.horizontal)
    }
    
    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM dd"
        return formatter.string(from: Date())
    }
}

// MARK: - Stat Row

struct StatRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.6))
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.white)
        }
    }
}

#Preview {
    ZStack {
        FluidBackground()
        HRDashboardView()
            .environmentObject(AppState.shared)
    }
}
