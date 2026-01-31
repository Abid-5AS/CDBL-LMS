//
//  CEODashboardView.swift
//  CDBLLeaveManager
//
//  Dashboard for CEO users with organization overview.
//

import SwiftUI
import Combine

struct CEODashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @State private var showReports = false
    @State private var showApprovals = false
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                LoadingView()
                    .frame(height: 400)
            } else if let error = viewModel.error {
                ErrorView(error) {
                    Task { await viewModel.loadDashboard(for: .ceo) }
                }
            } else {
                dashboardContent
            }
        }
        .task {
            await viewModel.loadDashboard(for: .ceo)
        }
        .sheet(isPresented: $showReports) {
            ReportsView()
        }
        .sheet(isPresented: $showApprovals) {
            ApprovalsListView()
        }
    }
    
    private var dashboardContent: some View {
        VStack(spacing: 24) {
            // Header
            CEODashboardHeader()
            
            // Organization Overview
            organizationOverview
            
            // Performance Metrics
            performanceMetrics
            
            // Department Stats
            departmentStatsSection
            
            // Quick Actions
            quickActionsSection
            
            Spacer().frame(height: 100)
        }
        .padding(.top, 20)
    }
    
    // MARK: - Organization Overview
    
    private var organizationOverview: some View {
        VStack(spacing: 12) {
            // Main Stats
            HStack(spacing: 12) {
                OverviewCard(
                    title: "Total Employees",
                    value: "\(viewModel.ceoStats?.totalEmployees ?? 0)",
                    icon: "person.3.fill",
                    color: .blue
                )
                
                OverviewCard(
                    title: "Active Today",
                    value: "\(viewModel.ceoStats?.activeEmployees ?? 0)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )
            }
            
            HStack(spacing: 12) {
                OverviewCard(
                    title: "On Leave",
                    value: "\(viewModel.ceoStats?.onLeaveToday ?? 0)",
                    icon: "person.fill.xmark",
                    color: .purple
                )
                
                OverviewCard(
                    title: "Pending Approvals",
                    value: "\(viewModel.ceoStats?.pendingApprovals ?? 0)",
                    icon: "clock.fill",
                    color: .orange
                )
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Performance Metrics
    
    private var performanceMetrics: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Performance Metrics")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 16) {
                HStack(spacing: 20) {
                    // Utilization Rate
                    VStack(spacing: 8) {
                        CircularProgressView(
                            progress: (viewModel.ceoStats?.utilizationRate ?? 0) / 100,
                            color: .cyan,
                            lineWidth: 10
                        )
                        .frame(width: 70, height: 70)
                        
                        Text("Utilization")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    
                    // Compliance Score
                    VStack(spacing: 8) {
                        CircularProgressView(
                            progress: (viewModel.ceoStats?.complianceScore ?? 0) / 100,
                            color: .green,
                            lineWidth: 10
                        )
                        .frame(width: 70, height: 70)
                        
                        Text("Compliance")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    // Stats Column
                    VStack(alignment: .leading, spacing: 12) {
                        MetricRow(
                            label: "YoY Growth",
                            value: String(format: "%+.1f%%", viewModel.ceoStats?.yoyGrowth ?? 0),
                            color: (viewModel.ceoStats?.yoyGrowth ?? 0) >= 0 ? .green : .red
                        )
                        
                        MetricRow(
                            label: "Avg Approval",
                            value: String(format: "%.1fh", viewModel.ceoStats?.avgApprovalTime ?? 0),
                            color: .cyan
                        )
                        
                        MetricRow(
                            label: "Total Days",
                            value: "\(viewModel.ceoStats?.totalLeaveDays ?? 0)",
                            color: .purple
                        )
                    }
                }
                
                // Estimated Cost
                HStack {
                    Image(systemName: "banknote.fill")
                        .foregroundStyle(.green)
                    
                    Text("Estimated Leave Cost")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    
                    Spacer()
                    
                    Text(formatCurrency(viewModel.ceoStats?.estimatedCost ?? 0))
                        .font(.headline)
                        .foregroundStyle(.green)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Department Stats
    
    private var departmentStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Department Overview")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            if let departments = viewModel.ceoStats?.departmentStats {
                VStack(spacing: 8) {
                    ForEach(departments.prefix(5)) { dept in
                        DepartmentStatRow(stat: dept)
                    }
                }
                .padding()
                .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Quick Actions
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            HStack(spacing: 12) {
                ActionButton(icon: "chart.bar.fill", title: "Reports", color: .purple) {
                    showReports = true
                }
                ActionButton(icon: "checkmark.circle.fill", title: "Approvals", color: .green) {
                    showApprovals = true
                }
            }
            .padding(.horizontal)
        }
    }
    
    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencySymbol = "৳"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "৳0"
    }
}

// MARK: - CEO Dashboard Header

struct CEODashboardHeader: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(formattedDate)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("CEO Dashboard")
                    .font(.title2.bold())
                    .foregroundStyle(.primary)
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "bell.fill")
                    .foregroundStyle(.primary)
                    .padding(10)
                    .surfaceBackground(in: Circle())
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

// MARK: - Overview Card

struct OverviewCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
    }
}

// MARK: - Metric Row

struct MetricRow: View {
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(color)
        }
    }
}

// MARK: - Department Stat Row

struct DepartmentStatRow: View {
    let stat: DepartmentStat
    
    var body: some View {
        HStack {
            Text(stat.department)
                .font(.subheadline)
                .foregroundStyle(.primary)
            
            Spacer()
            
            HStack(spacing: 16) {
                VStack(alignment: .trailing) {
                    Text("\(stat.totalEmployees)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.blue)
                    Text("total")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                
                VStack(alignment: .trailing) {
                    Text("\(stat.onLeave)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.purple)
                    Text("on leave")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    ZStack {
        Color(.systemBackground).ignoresSafeArea()
        CEODashboardView()
            .environmentObject(AppState.shared)
    }
}
