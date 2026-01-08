//
//  DashboardService.swift
//  CDBLLeaveManager
//
//  Dashboard statistics API service for all user roles.
//

import Foundation

actor DashboardService {
    static let shared = DashboardService()
    
    private let client = APIClient.shared
    
    private init() {}
    
    // MARK: - Employee Dashboard
    
    func getEmployeeDashboard() async throws -> EmployeeDashboardData {
        return try await client.request("dashboard/employee")
    }
    
    func getLeaveBalance() async throws -> DashboardLeaveBalance {
        return try await client.request("leave/balance")
    }
    
    func getWhosOutToday() async throws -> [WhosOutMember] {
        let response: APIResponse<[WhosOutMember]> = try await client.request("dashboard/whos-out")
        return response.data ?? []
    }
    
    // MARK: - Manager Dashboard
    
    func getManagerStats() async throws -> ManagerStatsResponse {
        return try await client.request("dashboard/manager")
    }
    
    func getPendingApprovals() async throws -> ApprovalListResponse {
        return try await client.request("approvals/pending")
    }
    
    // MARK: - HR Admin Dashboard
    
    func getHRAdminStats() async throws -> HRAdminStats {
        return try await client.request("dashboard/hr-admin")
    }
    
    // MARK: - HR Head Dashboard
    
    func getHRHeadStats() async throws -> HRHeadStats {
        return try await client.request("dashboard/hr-head")
    }
    
    // MARK: - CEO Dashboard
    
    func getCEOStats() async throws -> CEOStats {
        return try await client.request("dashboard/ceo")
    }
    
    // MARK: - System Admin Dashboard
    
    func getSystemStats() async throws -> SystemStatsResponse {
        return try await client.request("dashboard/admin")
    }
    
    func getRecentAuditLogs(limit: Int = 10) async throws -> AuditLogsResponse {
        return try await client.request("admin/audit-logs?limit=\(limit)")
    }
    
    // MARK: - Holidays
    
    func getHolidays(year: Int? = nil) async throws -> HolidayResponse {
        var endpoint = "holidays"
        if let year = year {
            endpoint += "?year=\(year)"
        }
        return try await client.request(endpoint)
    }
    
    // MARK: - Team Calendar
    
    func getTeamCalendar(month: Int, year: Int) async throws -> TeamCalendarResponse {
        return try await client.request(
            "dashboard/team-calendar?month=\(month)&year=\(year)"
        )
    }
}
