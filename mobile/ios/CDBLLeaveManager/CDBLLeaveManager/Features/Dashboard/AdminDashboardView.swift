//
//  AdminDashboardView.swift
//  CDBLLeaveManager
//
//  Dashboard for System Admin users.
//

import SwiftUI

struct AdminDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
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
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                AdminActionCard(
                    icon: "person.badge.plus",
                    title: "Users",
                    subtitle: "Manage accounts",
                    color: .blue
                )
                
                AdminActionCard(
                    icon: "doc.text.magnifyingglass",
                    title: "Audit Logs",
                    subtitle: "View activity",
                    color: .purple
                )
                
                AdminActionCard(
                    icon: "gearshape.2",
                    title: "Workflows",
                    subtitle: "Configure policies",
                    color: .orange
                )
                
                AdminActionCard(
                    icon: "arrow.triangle.2.circlepath",
                    title: "HRIS Sync",
                    subtitle: "Integration",
                    color: .green
                )
                
                AdminActionCard(
                    icon: "link",
                    title: "Webhooks",
                    subtitle: "API integrations",
                    color: .cyan
                )
                
                AdminActionCard(
                    icon: "shield.checkered",
                    title: "Security",
                    subtitle: "Access control",
                    color: .red
                )
            }
            .padding(.horizontal)
        }
    }
    
    // MARK: - Audit Logs Section
    
    private var auditLogsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Activity")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.9))
                
                Spacer()
                
                Button("View All") {}
                    .font(.caption)
                    .foregroundStyle(.cyan)
            }
            .padding(.horizontal)
            
            if viewModel.recentAuditLogs.isEmpty {
                HStack {
                    Image(systemName: "doc.text")
                        .foregroundStyle(.white.opacity(0.4))
                    Text("No recent activity")
                        .foregroundStyle(.white.opacity(0.6))
                }
                .padding()
                .frame(maxWidth: .infinity)
                .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)
            } else {
                VStack(spacing: 8) {
                    ForEach(viewModel.recentAuditLogs.prefix(5)) { log in
                        AuditLogRow(log: log)
                    }
                }
                .padding()
                .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 20))
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
                    .foregroundStyle(.white.opacity(0.8))
                Text("Admin Dashboard")
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
                    Image(systemName: "terminal")
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

// MARK: - Admin Action Card

struct AdminActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        Button(action: {}) {
            VStack(alignment: .leading, spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(.white)
                    
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 16))
        }
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
                    .foregroundStyle(.white)
                
                Text(log.actorEmail)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.6))
            }
            
            Spacer()
            
            Text(formatTime(log.createdAt))
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.5))
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
        FluidBackground()
        AdminDashboardView()
            .environmentObject(AppState.shared)
    }
}
