//
//  DashboardModels.swift
//  CDBLLeaveManager
//
//  Dashboard statistics models for all user roles.
//

import Foundation
import SwiftUI

// MARK: - Employee Dashboard

struct EmployeeDashboardData: Decodable {
    let balance: DashboardLeaveBalance?
    let needsAttentionCount: Int
    let underReviewCount: Int
    let nextApprovedLeave: LeaveRequest?
    let whosOutToday: [WhosOutMember]
}

/// Leave balance for dashboard display
struct DashboardLeaveBalance: Decodable {
    let EARNED: Double
    let CASUAL: Double
    let MEDICAL: Double
    let COMPENSATORY: Double?
    let MATERNITY: Double?
    let PATERNITY: Double?
    let SPECIAL: Double?
    
    enum CodingKeys: String, CodingKey {
        case EARNED, CASUAL, MEDICAL, COMPENSATORY, MATERNITY, PATERNITY, SPECIAL
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        EARNED = (try? container.decode(Double.self, forKey: .EARNED)) ?? 0
        CASUAL = (try? container.decode(Double.self, forKey: .CASUAL)) ?? 0
        MEDICAL = (try? container.decode(Double.self, forKey: .MEDICAL)) ?? 0
        COMPENSATORY = try? container.decode(Double.self, forKey: .COMPENSATORY)
        MATERNITY = try? container.decode(Double.self, forKey: .MATERNITY)
        PATERNITY = try? container.decode(Double.self, forKey: .PATERNITY)
        SPECIAL = try? container.decode(Double.self, forKey: .SPECIAL)
    }
}

struct WhosOutMember: Decodable, Identifiable {
    let id: Int
    let employeeName: String
    let department: String?
    let leaveType: String?
    let startDate: String?
    let endDate: String?
}

// MARK: - Manager Dashboard

struct ManagerStatsResponse: Decodable {
    let pendingApprovals: Int
    let teamAvailability: Double
}

// MARK: - HR Admin Dashboard

struct HRAdminStats: Decodable {
    let employeesOnLeave: Int
    let pendingRequests: Int
    let avgApprovalTime: Double
    let encashmentPending: Int
    let totalLeavesThisYear: Int
    let processedToday: Int
    let teamUtilization: Double
    let complianceScore: Double
}

// MARK: - HR Head Dashboard

struct HRHeadStats: Decodable {
    let pending: Int
    let onLeave: Int
    let returned: Int
    let upcoming: Int
    let monthlyRequests: Int
    let newHires: Int
    let complianceScore: Double
    let escalatedCases: [EscalatedCase]
    let departmentPerformance: [DepartmentPerformance]
}

struct EscalatedCase: Decodable, Identifiable {
    let id: Int
    let employeeName: String
    let department: String
    let leaveType: String
    let days: Int
    let reason: String
}

struct DepartmentPerformance: Decodable, Identifiable {
    var id: String { name }
    let name: String
    let pending: Int
    let avgApprovalTime: Double
}

// MARK: - CEO Dashboard

struct CEOStats: Decodable {
    let totalEmployees: Int
    let activeEmployees: Int
    let onLeaveToday: Int
    let utilizationRate: Double
    let pendingApprovals: Int
    let avgApprovalTime: Double
    let complianceScore: Double
    let estimatedCost: Double
    let totalLeaveDays: Int
    let yoyGrowth: Double
    let departmentStats: [DepartmentStat]
}

// MARK: - System Admin Dashboard

struct SystemStatsResponse: Decodable {
    let totalEmployees: Int
    let onLeaveToday: Int
    let pendingRequests: Int
    let departmentStats: [DepartmentStat]
}

struct DepartmentStat: Decodable, Identifiable {
    var id: String { department }
    let department: String
    let totalEmployees: Int
    let onLeave: Int
}

struct AdminDashboardData: Decodable {
    let systemStats: SystemStatsResponse
    let auditLogs: [AuditLog]
}

// MARK: - Audit Log

struct AuditLog: Decodable, Identifiable {
    let id: String
    let actorEmail: String
    let action: String
    let targetEmail: String?
    let details: String?
    let createdAt: String
}

struct AuditLogsResponse: Decodable {
    let items: [AuditLog]
}

// MARK: - Holiday

struct Holiday: Decodable, Identifiable {
    let id: Int
    let date: String
    let name: String
    let isOptional: Bool
    let description: String?
}

struct HolidayResponse: Decodable {
    let holidays: [Holiday]
}
struct TeamCalendarEntry: Decodable {
    let employeeName: String
    let leaveType: String
    let date: String
    let isHalfDay: Bool
}

struct TeamCalendarResponse: Decodable {
    let entries: [TeamCalendarEntry]
}

// MARK: - Dashboard UI Model

struct BalanceCardItem: Identifiable {
    let id = UUID()
    let title: String
    let remaining: Int
    let total: Int
    let color: Color
    let icon: String
    
    var percentage: Double {
        guard total > 0 else { return 0 }
        return Double(remaining) / Double(total)
    }
    
    var used: Int {
        total - remaining
    }
}
