//
//  DashboardViewModel.swift
//  CDBLLeaveManager
//
//  ViewModel for dashboard screens with role-based data loading.
//

import SwiftUI
import Combine

@MainActor
final class DashboardViewModel: ObservableObject {
    // MARK: - Published State
    
    @Published var isLoading = false
    @Published var error: String?
    
    // Employee Dashboard
    @Published var balance: DashboardLeaveBalance?
    @Published var needsAttentionCount = 0
    @Published var underReviewCount = 0
    @Published var nextApprovedLeave: LeaveRequest?
    @Published var whosOutToday: [WhosOutMember] = []
    
    // Manager Dashboard
    @Published var pendingApprovals: [PendingApproval] = []
    @Published var pendingApprovalsCount = 0
    @Published var teamAvailability: Double = 100
    
    // HR Dashboard
    @Published var hrStats: HRAdminStats?
    
    // HR Head Dashboard
    @Published var hrHeadStats: HRHeadStats?
    
    // CEO Dashboard
    @Published var ceoStats: CEOStats?
    
    // Admin Dashboard
    @Published var systemStats: SystemStatsResponse?
    @Published var recentAuditLogs: [AuditLog] = []
    
    // Holidays
    @Published var holidays: [Holiday] = []
    
    // MARK: - Services
    
    private let dashboardService = DashboardService.shared
    private let leaveService = LeaveService.shared
    private let approvalService = ApprovalService.shared
    
    // MARK: - Load Data
    
    func loadDashboard(for role: UserRole) async {
        isLoading = true
        error = nil
        
        do {
            switch role {
            case .employee:
                try await loadEmployeeDashboard()
            case .deptHead:
                try await loadManagerDashboard()
            case .hrAdmin:
                try await loadHRDashboard()
            case .hrHead:
                try await loadHRHeadDashboard()
            case .ceo:
                try await loadCEODashboard()
            case .systemAdmin:
                try await loadAdminDashboard()
            }
            isLoading = false
        } catch {
            isLoading = false
            self.error = error.localizedDescription
        }
    }
    
    // MARK: - Employee Dashboard
    
    private func loadEmployeeDashboard() async throws {
        async let balanceTask = leaveService.getBalance()
        async let leavesTask = leaveService.getLeaveHistory()
        async let whosOutTask = dashboardService.getWhosOutToday()
        
        let (balance, leaves, whosOut) = try await (balanceTask, leavesTask, whosOutTask)
        
        self.balance = balance
        self.whosOutToday = whosOut
        
        // Calculate counts from leaves
        let allLeaves = leaves.allLeaves
        self.needsAttentionCount = allLeaves.filter { 
            $0.status.uppercased() == "RETURNED" || $0.status.uppercased() == "REJECTED" 
        }.count
        self.underReviewCount = allLeaves.filter { 
            $0.status.uppercased() == "PENDING" 
        }.count
        self.nextApprovedLeave = allLeaves.first { 
            $0.status.uppercased() == "APPROVED" 
        }
    }
    
    // MARK: - Manager Dashboard
    
    private func loadManagerDashboard() async throws {
        async let statsTask = dashboardService.getManagerStats()
        async let approvalsTask = approvalService.getPendingApprovals()
        
        let (stats, approvals) = try await (statsTask, approvalsTask)
        
        self.pendingApprovalsCount = stats.pendingApprovals
        self.teamAvailability = stats.teamAvailability
        self.pendingApprovals = approvals.allApprovals
    }
    
    // MARK: - HR Dashboard
    
    private func loadHRDashboard() async throws {
        self.hrStats = try await dashboardService.getHRAdminStats()
        self.pendingApprovals = try await approvalService.getPendingApprovals().allApprovals
    }
    
    // MARK: - HR Head Dashboard
    
    private func loadHRHeadDashboard() async throws {
        self.hrHeadStats = try await dashboardService.getHRHeadStats()
        self.pendingApprovals = try await approvalService.getPendingApprovals().allApprovals
    }
    
    // MARK: - CEO Dashboard
    
    private func loadCEODashboard() async throws {
        self.ceoStats = try await dashboardService.getCEOStats()
    }
    
    // MARK: - Admin Dashboard
    
    private func loadAdminDashboard() async throws {
        async let statsTask = dashboardService.getSystemStats()
        async let logsTask = dashboardService.getRecentAuditLogs(limit: 10)
        
        let (stats, logs) = try await (statsTask, logsTask)
        
        self.systemStats = stats
        self.recentAuditLogs = logs.items
    }
    
    // MARK: - Holidays
    
    func loadHolidays(year: Int? = nil) async {
        do {
            let response = try await dashboardService.getHolidays(year: year)
            self.holidays = response.holidays
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    // MARK: - Helpers
    
    var balanceCards: [BalanceCardItem] {
        guard let balance = balance else { return [] }
        return [
            BalanceCardItem(
                title: "Earned Leave",
                remaining: Int(balance.EARNED),
                total: 33,
                color: .indigo,
                icon: "airplane"
            ),
            BalanceCardItem(
                title: "Casual Leave",
                remaining: Int(balance.CASUAL),
                total: 10,
                color: .cyan,
                icon: "sun.max.fill"
            ),
            BalanceCardItem(
                title: "Medical Leave",
                remaining: Int(balance.MEDICAL),
                total: 14,
                color: .red,
                icon: "cross.case.fill"
            )
        ]
    }
}
