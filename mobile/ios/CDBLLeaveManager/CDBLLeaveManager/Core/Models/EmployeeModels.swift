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
    
    enum CodingKeys: String, CodingKey {
        case id, email, name, employeeId, empCode, designation, department
        case phone, joiningDate, role, isActive, managerId, managerName
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
        
        email = (try? container.decode(String.self, forKey: .email)) ?? ""
        name = try? container.decode(String.self, forKey: .name)
        
        // Handle employeeId or empCode
        if let empId = try? container.decode(String.self, forKey: .employeeId) {
            employeeId = empId
        } else {
            employeeId = try? container.decode(String.self, forKey: .empCode)
        }
        
        designation = try? container.decode(String.self, forKey: .designation)
        department = try? container.decode(String.self, forKey: .department)
        phone = try? container.decode(String.self, forKey: .phone)
        joiningDate = try? container.decode(String.self, forKey: .joiningDate)
        role = try? container.decode(String.self, forKey: .role)
        isActive = try? container.decode(Bool.self, forKey: .isActive)
        managerId = try? container.decode(Int.self, forKey: .managerId)
        managerName = try? container.decode(String.self, forKey: .managerName)
    }
    
    // Memberwise initializer (since custom init(from:) removes the automatic one)
    init(
        id: Int,
        email: String,
        name: String?,
        employeeId: String?,
        designation: String?,
        department: String?,
        phone: String?,
        joiningDate: String?,
        role: String?,
        isActive: Bool?,
        managerId: Int?,
        managerName: String?
    ) {
        self.id = id
        self.email = email
        self.name = name
        self.employeeId = employeeId
        self.designation = designation
        self.department = department
        self.phone = phone
        self.joiningDate = joiningDate
        self.role = role
        self.isActive = isActive
        self.managerId = managerId
        self.managerName = managerName
    }
    
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
    let users: [Employee]?
    let total: Int?
    
    enum CodingKeys: String, CodingKey {
        case employees, items, users, total
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        employees = try? container.decode([Employee].self, forKey: .employees)
        items = try? container.decode([Employee].self, forKey: .items)
        users = try? container.decode([Employee].self, forKey: .users)
        total = try? container.decode(Int.self, forKey: .total)
    }
    
    var allEmployees: [Employee] {
        employees ?? items ?? users ?? []
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
