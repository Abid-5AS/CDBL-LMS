//
//  HRHeadDashboardView.swift
//  CDBLLeaveManager
//
//  Dashboard for HR Head users.
//

import SwiftUI

struct HRHeadDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                LoadingView()
                    .frame(height: 400)
            } else if let error = viewModel.error {
                ErrorView(error) {
                    Task { await viewModel.loadDashboard(for: .hrHead) }
                }
            } else {
                dashboardContent
            }
        }
        .task {
            await viewModel.loadDashboard(for: .hrHead)
        }
    }
    
    private var dashboardContent: some View {
        VStack(spacing: 24) {
            // Header
            HRDashboardHeader()
            
            // Overview Cards
            overviewCards
            
            // Department Performance
            departmentPerformanceSection
            
            // Escalated Cases
            escalatedCasesSection
            
            // Quick Actions
            quickActionsSection
            
            Spacer().frame(height: 100)
        }
        .padding(.top, 20)
    }
    
    // MARK: - Overview Cards
    
    private var overviewCards: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                KPICard(
                    title: "Pending",
                    value: "\(viewModel.hrHeadStats?.pending ?? 0)",
                    subtitle: "Requests",
                    color: .orange
                )
                
                KPICard(
                    title: "On Leave",
                    value: "\(viewModel.hrHeadStats?.onLeave ?? 0)",
                    subtitle: "Today",
                    color: .purple
                )
            }
            
            HStack(spacing: 12) {
                KPICard(
                    title: "Returned",
                    value: "\(viewModel.hrHeadStats?.returned ?? 0)",
                    subtitle: "For revision",
                    color: .yellow
                )
                
                KPICard(
                    title: "Upcoming",
                    value: "\(viewModel.hrHeadStats?.upcoming ?? 0)",
                    subtitle: "This week",
                    color: .cyan
                )
            }
            
            // Compliance Score
            HStack(spacing: 20) {
                CircularProgressView(
                    progress: (viewModel.hrHeadStats?.complianceScore ?? 0) / 100,
                    color: .green,
                    lineWidth: 10
                )
                .frame(width: 80, height: 80)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Compliance Score")
                        .font(.headline)
                        .foregroundStyle(.white)
                    
                    Text("Organization compliance with leave policies")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.6))
                }
                
                Spacer()
            }
            .padding()
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
        }
        .padding(.horizontal)
    }
    
    // MARK: - Department Performance
    
    private var departmentPerformanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Department Performance")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal)
            
            if let departments = viewModel.hrHeadStats?.departmentPerformance {
                VStack(spacing: 8) {
                    ForEach(departments.prefix(5)) { dept in
                        DepartmentRow(department: dept)
                    }
                }
                .padding()
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
                .padding(.horizontal)
            }
        }
    }
    
    // MARK: - Escalated Cases
    
    private var escalatedCasesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Escalated Cases")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.9))
                
                if let count = viewModel.hrHeadStats?.escalatedCases.count, count > 0 {
                    Text("\(count)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.red.opacity(0.3))
                        .clipShape(Capsule())
                        .foregroundStyle(.red)
                }
                
                Spacer()
            }
            .padding(.horizontal)
            
            if let cases = viewModel.hrHeadStats?.escalatedCases, !cases.isEmpty {
                VStack(spacing: 12) {
                    ForEach(cases.prefix(3)) { escalated in
                        EscalatedCaseCard(caseItem: escalated)
                    }
                }
                .padding(.horizontal)
            } else {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("No escalated cases")
                        .foregroundStyle(.white.opacity(0.7))
                }
                .padding()
                .frame(maxWidth: .infinity)
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16))
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
                ActionButton(icon: "chart.bar.fill", title: "Reports", color: .purple)
                ActionButton(icon: "person.3.fill", title: "Employees", color: .blue)
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Department Row

struct DepartmentRow: View {
    let department: DepartmentPerformance
    
    var body: some View {
        HStack {
            Text(department.name)
                .font(.subheadline)
                .foregroundStyle(.white)
            
            Spacer()
            
            HStack(spacing: 16) {
                VStack(alignment: .trailing) {
                    Text("\(department.pending)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.orange)
                    Text("pending")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                VStack(alignment: .trailing) {
                    Text(String(format: "%.1fh", department.avgApprovalTime))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.cyan)
                    Text("avg time")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Escalated Case Card

struct EscalatedCaseCard: View {
    let caseItem: EscalatedCase
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(caseItem.employeeName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                
                Text("\(caseItem.leaveType) • \(caseItem.days) days")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
                
                Text(caseItem.reason)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.5))
                    .lineLimit(1)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.4))
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(Color.red.opacity(0.3), lineWidth: 1)
        )
    }
}

#Preview {
    ZStack {
        FluidBackground()
        HRHeadDashboardView()
            .environmentObject(AppState.shared)
    }
}
