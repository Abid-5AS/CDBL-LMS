//
//  AdminDashboardView.swift
//  CDBLLeaveManager
//
//  Dashboard for System Admin users.
//

import SwiftUI
import Combine

struct AdminDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                if viewModel.isLoading {
                    LoadingView()
                        .frame(height: 400)
                } else if let error = viewModel.error {
                    ErrorView(error) {
                        Task { await viewModel.loadDashboard(for: .systemAdmin) }
                    }
                } else {
                    dashboardContent
                }
            }
            .task {
                await viewModel.loadDashboard(for: .systemAdmin)
            }
        }
    }
    
    private var dashboardContent: some View {
        VStack(spacing: 24) {
            // Header
            AdminDashboardHeader()
            
            // System Overview
            systemOverview
            
            // Quick Admin Actions
            adminActionsGrid
            
            // Recent Audit Logs
            auditLogsSection
            
            Spacer().frame(height: 100)
        }
        .padding(.top, 20)
    }
    
    // MARK: - System Overview
    
    private var systemOverview: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                KPICard(
                    title: "Total Employees",
                    value: "\(viewModel.systemStats?.totalEmployees ?? 0)",
                    subtitle: "Registered",
                    icon: "person.3.fill",
                    color: .blue
                )
                
                KPICard(
                    title: "On Leave Today",
                    value: "\(viewModel.systemStats?.onLeaveToday ?? 0)",
                    subtitle: "Employees",
                    icon: "person.fill.xmark",
                    color: .purple
                )
            }
            
            HStack(spacing: 12) {
                KPICard(
                    title: "Pending Requests",
                    value: "\(viewModel.systemStats?.pendingRequests ?? 0)",
                    subtitle: "System-wide",
                    icon: "clock.fill",
                    color: .orange
                )
                
                KPICard(
                    title: "Departments",
                    value: "\(viewModel.systemStats?.departmentStats.count ?? 0)",
                    subtitle: "Active",
                    icon: "building.2.fill",
                    color: .cyan
                )
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Admin Actions Grid
    
    private var adminActionsGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Admin Functions")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                adminActionLink(
                    icon: "person.badge.plus",
                    title: "Users",
                    subtitle: "Manage accounts",
                    destination: UserListView()
                )
                
                adminActionLink(
                    icon: "doc.text.magnifyingglass",
                    title: "Audit Logs",
                    subtitle: "View activity",
                    destination: AuditLogsView()
                )
                
                adminActionLink(
                    icon: "gearshape.2",
                    title: "Workflows",
                    subtitle: "Configure policies",
                    destination: WorkflowPoliciesView()
                )
                
                adminActionLink(
                    icon: "arrow.triangle.2.circlepath",
                    title: "HRIS Sync",
                    subtitle: "Integration",
                    destination: HrisSyncView()
                )
                
                adminActionLink(
                    icon: "link",
                    title: "Webhooks",
                    subtitle: "API integrations",
                    destination: WebhooksView()
                )
            }
            .padding(.horizontal)
        }
    }

    @ViewBuilder
    private func adminActionLink<Destination: View>(
        icon: String,
        title: String,
        subtitle: String,
        destination: Destination
    ) -> some View {
        NavigationLink(destination: destination) {
            AdminActionCard(icon: icon, title: title, subtitle: subtitle)
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - Audit Logs Section
    
    private var auditLogsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Activity")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                NavigationLink(destination: AuditLogsView()) {
                    Text("View All")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)
            
            if viewModel.recentAuditLogs.isEmpty {
                HStack {
                    Image(systemName: "doc.text")
                        .foregroundStyle(.secondary)
                    Text("No recent activity")
                        .foregroundStyle(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.recentAuditLogs.prefix(5)) { log in
                        AuditLogRow(log: log)
                    }
                }
                .padding()
                .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Admin Dashboard Header

struct AdminDashboardHeader: View {
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(formattedDate)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("Admin Dashboard")
                    .font(.title2.bold())
                    .foregroundStyle(.primary)
            }
            
            Spacer()
            
            HStack(spacing: 12) {
                Button(action: {}) {
                    Image(systemName: "bell.fill")
                        .foregroundStyle(.primary)
                        .padding(10)
                        .surfaceBackground(in: Circle())
                }
                
                Button(action: {}) {
                    Image(systemName: "terminal")
                        .foregroundStyle(.primary)
                        .padding(10)
                        .surfaceBackground(in: Circle())
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

// MARK: - Admin Action Card

struct AdminActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.primary)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
                
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Audit Log Row

struct AuditLogRow: View {
    let log: AuditLog
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(actionColor.opacity(0.2))
                .frame(width: 36, height: 36)
                .overlay(
                    Image(systemName: actionIcon)
                        .font(.caption)
                        .foregroundStyle(actionColor)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(log.action)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
                
                Text(log.actorEmail)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Text(formatTime(log.createdAt))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }
    
    private var actionIcon: String {
        let action = log.action.uppercased()
        if action.contains("CREATE") || action.contains("ADD") {
            return "plus.circle.fill"
        } else if action.contains("UPDATE") || action.contains("EDIT") {
            return "pencil.circle.fill"
        } else if action.contains("DELETE") || action.contains("REMOVE") {
            return "trash.fill"
        } else if action.contains("LOGIN") {
            return "person.fill.checkmark"
        } else {
            return "doc.fill"
        }
    }
    
    private var actionColor: Color {
        let action = log.action.uppercased()
        if action.contains("CREATE") || action.contains("ADD") {
            return .green
        } else if action.contains("UPDATE") || action.contains("EDIT") {
            return .orange
        } else if action.contains("DELETE") || action.contains("REMOVE") {
            return .red
        } else if action.contains("LOGIN") {
            return .blue
        } else {
            return .purple
        }
    }
    
    private func formatTime(_ dateString: String) -> String {
        // Simple time extraction
        if dateString.count > 10 {
            let timeStart = dateString.index(dateString.startIndex, offsetBy: 11)
            let timeEnd = dateString.index(timeStart, offsetBy: 5, limitedBy: dateString.endIndex) ?? dateString.endIndex
            return String(dateString[timeStart..<timeEnd])
        }
        return dateString
    }
}

#Preview {
    ZStack {
        Color(.systemBackground).ignoresSafeArea()
        AdminDashboardView()
            .environmentObject(AppState.shared)
    }
}
