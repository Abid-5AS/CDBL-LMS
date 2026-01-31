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
    
    enum CodingKeys: String, CodingKey {
        case balance, needsAttentionCount, underReviewCount, nextApprovedLeave, whosOutToday
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        balance = try? container.decode(DashboardLeaveBalance.self, forKey: .balance)
        needsAttentionCount = (try? container.decode(Int.self, forKey: .needsAttentionCount)) ?? 0
        underReviewCount = (try? container.decode(Int.self, forKey: .underReviewCount)) ?? 0
        nextApprovedLeave = try? container.decode(LeaveRequest.self, forKey: .nextApprovedLeave)
        whosOutToday = (try? container.decode([WhosOutMember].self, forKey: .whosOutToday)) ?? []
    }
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
    let STUDY: Double?
    let SPECIAL_DISABILITY: Double?
    let QUARANTINE: Double?
    let EXTRAWITHPAY: Double?
    let EXTRAWITHOUTPAY: Double?
    
    enum CodingKeys: String, CodingKey {
        case EARNED, CASUAL, MEDICAL, COMPENSATORY, MATERNITY, PATERNITY, SPECIAL, STUDY, SPECIAL_DISABILITY, QUARANTINE, EXTRAWITHPAY, EXTRAWITHOUTPAY
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
        STUDY = try? container.decode(Double.self, forKey: .STUDY)
        SPECIAL_DISABILITY = try? container.decode(Double.self, forKey: .SPECIAL_DISABILITY)
        QUARANTINE = try? container.decode(Double.self, forKey: .QUARANTINE)
        EXTRAWITHPAY = try? container.decode(Double.self, forKey: .EXTRAWITHPAY)
        EXTRAWITHOUTPAY = try? container.decode(Double.self, forKey: .EXTRAWITHOUTPAY)
    }
}

struct WhosOutMember: Decodable, Identifiable {
    let id: Int
    let employeeName: String
    let department: String?
    let leaveType: String?
    let startDate: String?
    let endDate: String?
    
    enum CodingKeys: String, CodingKey {
        case id, employeeName, name, department, leaveType, startDate, endDate
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id
        if let intId = try? container.decode(Int.self, forKey: .id) {
            id = intId
        } else if let strId = try? container.decode(String.self, forKey: .id), let parsedId = Int(strId) {
            id = parsedId
        } else {
            id = 0
        }
        
        // Handle employeeName (can be employeeName or name in API)
        if let name = try? container.decode(String.self, forKey: .employeeName), !name.isEmpty {
            employeeName = name
        } else if let name = try? container.decode(String.self, forKey: .name), !name.isEmpty {
            employeeName = name
        } else {
            employeeName = "Unknown"
        }
        
        department = try? container.decode(String.self, forKey: .department)
        leaveType = try? container.decode(String.self, forKey: .leaveType)
        startDate = try? container.decode(String.self, forKey: .startDate)
        endDate = try? container.decode(String.self, forKey: .endDate)
    }
}

// MARK: - Manager Dashboard

struct ManagerStatsResponse: Decodable {
    let pendingApprovals: Int
    let teamAvailability: Double
    
    enum CodingKeys: String, CodingKey {
        case pendingApprovals, teamAvailability
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        pendingApprovals = (try? container.decode(Int.self, forKey: .pendingApprovals)) ?? 0
        teamAvailability = (try? container.decode(Double.self, forKey: .teamAvailability)) ?? 100.0
    }
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
    
    enum CodingKeys: String, CodingKey {
        case employeesOnLeave, pendingRequests, avgApprovalTime, encashmentPending
        case totalLeavesThisYear, processedToday, teamUtilization, complianceScore
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        employeesOnLeave = (try? container.decode(Int.self, forKey: .employeesOnLeave)) ?? 0
        pendingRequests = (try? container.decode(Int.self, forKey: .pendingRequests)) ?? 0
        avgApprovalTime = (try? container.decode(Double.self, forKey: .avgApprovalTime)) ?? 0
        encashmentPending = (try? container.decode(Int.self, forKey: .encashmentPending)) ?? 0
        totalLeavesThisYear = (try? container.decode(Int.self, forKey: .totalLeavesThisYear)) ?? 0
        processedToday = (try? container.decode(Int.self, forKey: .processedToday)) ?? 0
        teamUtilization = (try? container.decode(Double.self, forKey: .teamUtilization)) ?? 0
        complianceScore = (try? container.decode(Double.self, forKey: .complianceScore)) ?? 0
    }
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
    
    enum CodingKeys: String, CodingKey {
        case pending, onLeave, returned, upcoming, monthlyRequests, newHires
        case complianceScore, escalatedCases, departmentPerformance
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        pending = (try? container.decode(Int.self, forKey: .pending)) ?? 0
        onLeave = (try? container.decode(Int.self, forKey: .onLeave)) ?? 0
        returned = (try? container.decode(Int.self, forKey: .returned)) ?? 0
        upcoming = (try? container.decode(Int.self, forKey: .upcoming)) ?? 0
        monthlyRequests = (try? container.decode(Int.self, forKey: .monthlyRequests)) ?? 0
        newHires = (try? container.decode(Int.self, forKey: .newHires)) ?? 0
        complianceScore = (try? container.decode(Double.self, forKey: .complianceScore)) ?? 0
        escalatedCases = (try? container.decode([EscalatedCase].self, forKey: .escalatedCases)) ?? []
        departmentPerformance = (try? container.decode([DepartmentPerformance].self, forKey: .departmentPerformance)) ?? []
    }
}

struct EscalatedCase: Decodable, Identifiable {
    let id: Int
    let employeeName: String
    let department: String
    let leaveType: String
    let days: Int
    let reason: String
    
    enum CodingKeys: String, CodingKey {
        case id, employeeName, department, leaveType, days, workingDays, reason
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = (try? container.decode(Int.self, forKey: .id)) ?? 0
        employeeName = (try? container.decode(String.self, forKey: .employeeName)) ?? "Unknown"
        department = (try? container.decode(String.self, forKey: .department)) ?? ""
        leaveType = (try? container.decode(String.self, forKey: .leaveType)) ?? ""
        // API uses workingDays, fallback to days
        if let wd = try? container.decode(Int.self, forKey: .workingDays) {
            days = wd
        } else {
            days = (try? container.decode(Int.self, forKey: .days)) ?? 0
        }
        reason = (try? container.decode(String.self, forKey: .reason)) ?? ""
    }
}

struct DepartmentPerformance: Decodable, Identifiable {
    var id: String { name }
    let name: String
    let pending: Int
    let avgApprovalTime: Double
    
    enum CodingKeys: String, CodingKey {
        case name, pending, avgApprovalTime
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = (try? container.decode(String.self, forKey: .name)) ?? "Unknown"
        pending = (try? container.decode(Int.self, forKey: .pending)) ?? 0
        avgApprovalTime = (try? container.decode(Double.self, forKey: .avgApprovalTime)) ?? 0
    }
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
    
    enum CodingKeys: String, CodingKey {
        case totalEmployees, activeEmployees, onLeaveToday, utilizationRate
        case pendingApprovals, avgApprovalTime, complianceScore, estimatedCost
        case totalLeaveDays, yoyGrowth, departmentStats
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        totalEmployees = (try? container.decode(Int.self, forKey: .totalEmployees)) ?? 0
        activeEmployees = (try? container.decode(Int.self, forKey: .activeEmployees)) ?? 0
        onLeaveToday = (try? container.decode(Int.self, forKey: .onLeaveToday)) ?? 0
        utilizationRate = (try? container.decode(Double.self, forKey: .utilizationRate)) ?? 0
        pendingApprovals = (try? container.decode(Int.self, forKey: .pendingApprovals)) ?? 0
        avgApprovalTime = (try? container.decode(Double.self, forKey: .avgApprovalTime)) ?? 0
        complianceScore = (try? container.decode(Double.self, forKey: .complianceScore)) ?? 0
        estimatedCost = (try? container.decode(Double.self, forKey: .estimatedCost)) ?? 0
        totalLeaveDays = (try? container.decode(Int.self, forKey: .totalLeaveDays)) ?? 0
        yoyGrowth = (try? container.decode(Double.self, forKey: .yoyGrowth)) ?? 0
        departmentStats = (try? container.decode([DepartmentStat].self, forKey: .departmentStats)) ?? []
    }
}

// MARK: - System Admin Dashboard

struct SystemStatsResponse: Decodable {
    let totalEmployees: Int
    let onLeaveToday: Int
    let pendingRequests: Int
    let departmentStats: [DepartmentStat]
    
    enum CodingKeys: String, CodingKey {
        case totalEmployees, onLeaveToday, pendingRequests, departmentStats
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        totalEmployees = (try? container.decode(Int.self, forKey: .totalEmployees)) ?? 0
        onLeaveToday = (try? container.decode(Int.self, forKey: .onLeaveToday)) ?? 0
        pendingRequests = (try? container.decode(Int.self, forKey: .pendingRequests)) ?? 0
        departmentStats = (try? container.decode([DepartmentStat].self, forKey: .departmentStats)) ?? []
    }
}

struct DepartmentStat: Decodable, Identifiable {
    var id: String { department }
    let department: String
    let totalEmployees: Int
    let onLeave: Int
    
    enum CodingKeys: String, CodingKey {
        case department, totalEmployees, onLeave
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        department = (try? container.decode(String.self, forKey: .department)) ?? "Unknown"
        totalEmployees = (try? container.decode(Int.self, forKey: .totalEmployees)) ?? 0
        onLeave = (try? container.decode(Int.self, forKey: .onLeave)) ?? 0
    }
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
    
    enum CodingKeys: String, CodingKey {
        case id, actorEmail, action, targetEmail, details, createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id - can be Int or String
        if let strId = try? container.decode(String.self, forKey: .id) {
            id = strId
        } else if let intId = try? container.decode(Int.self, forKey: .id) {
            id = String(intId)
        } else {
            id = UUID().uuidString
        }
        
        actorEmail = (try? container.decode(String.self, forKey: .actorEmail)) ?? ""
        action = (try? container.decode(String.self, forKey: .action)) ?? ""
        targetEmail = try? container.decode(String.self, forKey: .targetEmail)
        details = try? container.decode(String.self, forKey: .details)
        createdAt = (try? container.decode(String.self, forKey: .createdAt)) ?? ""
    }
}

struct AuditLogsResponse: Decodable {
    let items: [AuditLog]
    
    enum CodingKeys: String, CodingKey {
        case items
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        items = (try? container.decode([AuditLog].self, forKey: .items)) ?? []
    }
}

// MARK: - Holiday

struct Holiday: Decodable, Identifiable {
    let id: Int
    let date: String
    let name: String
    let isOptional: Bool
    let description: String?
    
    enum CodingKeys: String, CodingKey {
        case id, date, name, isOptional, description
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = (try? container.decode(Int.self, forKey: .id)) ?? 0
        date = (try? container.decode(String.self, forKey: .date)) ?? ""
        name = (try? container.decode(String.self, forKey: .name)) ?? "Holiday"
        isOptional = (try? container.decode(Bool.self, forKey: .isOptional)) ?? false
        description = try? container.decode(String.self, forKey: .description)
    }
}

struct HolidayResponse: Decodable {
    let holidays: [Holiday]
    
    enum CodingKeys: String, CodingKey {
        case holidays
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        holidays = (try? container.decode([Holiday].self, forKey: .holidays)) ?? []
    }
}
struct TeamCalendarEntry: Decodable {
    let employeeName: String
    let leaveType: String
    let date: String
    let isHalfDay: Bool
    
    enum CodingKeys: String, CodingKey {
        case employeeName, leaveType, date, isHalfDay
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        employeeName = (try? container.decode(String.self, forKey: .employeeName)) ?? "Unknown"
        leaveType = (try? container.decode(String.self, forKey: .leaveType)) ?? "CASUAL"
        date = (try? container.decode(String.self, forKey: .date)) ?? ""
        isHalfDay = (try? container.decode(Bool.self, forKey: .isHalfDay)) ?? false
    }
}

struct TeamCalendarResponse: Decodable {
    let entries: [TeamCalendarEntry]
    
    enum CodingKeys: String, CodingKey {
        case entries
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        entries = (try? container.decode([TeamCalendarEntry].self, forKey: .entries)) ?? []
    }
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
