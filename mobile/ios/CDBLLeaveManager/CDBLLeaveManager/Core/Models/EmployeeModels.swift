//
//  EmployeeModels.swift
//  CDBLLeaveManager
//
//  Employee and team related models.
//

import Foundation
import SwiftUI

// MARK: - Employee

struct Employee: Decodable, Identifiable {
    let id: Int
    let email: String
    let name: String?
    let employeeId: String?
    let designation: String?
    let department: String?
    let phone: String?
    let joiningDate: String?
    let role: String?
    let isActive: Bool?
    let managerId: Int?
    let managerName: String?
    
    var displayName: String {
        name ?? email
    }
    
    var initials: String {
        let parts = displayName.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return displayName.prefix(2).uppercased()
    }
    
    var avatarColor: Color {
        let colors: [Color] = [.blue, .purple, .pink, .orange, .green, .cyan, .indigo, .teal]
        let hash = displayName.hashValue
        return colors[abs(hash) % colors.count]
    }
}

// MARK: - Employee List Response

struct EmployeeListResponse: Decodable {
    let employees: [Employee]?
    let items: [Employee]?
    let total: Int?
    
    var allEmployees: [Employee] {
        employees ?? items ?? []
    }
}

// MARK: - Employee Detail

struct EmployeeDetail: Decodable {
    let id: Int
    let email: String
    let name: String?
    let employeeId: String?
    let designation: String?
    let department: String?
    let phone: String?
    let joiningDate: String?
    let role: String?
    let isActive: Bool?
    let manager: ManagerInfo?
    let leaveBalance: DashboardLeaveBalance?
    let recentLeaves: [LeaveRequest]?
}

struct ManagerInfo: Decodable {
    let id: Int
    let name: String?
    let email: String
    let designation: String?
}

// MARK: - Team Member (for team list)

struct TeamMember: Decodable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let designation: String?
    let department: String?
    let isOnLeave: Bool?
    let leaveEndDate: String?
    
    var initials: String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return name.prefix(2).uppercased()
    }
    
    var avatarColor: Color {
        let colors: [Color] = [.blue, .purple, .pink, .orange, .green, .cyan, .indigo, .teal]
        let hash = name.hashValue
        return colors[abs(hash) % colors.count]
    }
}
