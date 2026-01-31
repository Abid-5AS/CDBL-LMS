//
//  ApprovalModels.swift
//  CDBLLeaveManager
//
//  Approval workflow related models.
//

import Foundation
import SwiftUI

// MARK: - Pending Approval

struct PendingApproval: Decodable, Identifiable {
    let id: Int
    let employeeName: String
    let employeeId: String?
    let department: String
    let leaveType: String
    let startDate: String
    let endDate: String
    let reason: String?
    let totalDays: Double?
    let status: String
    let createdAt: String?
    let requestedAt: String?
    
    // Additional coding keys to handle different API response formats
    enum CodingKeys: String, CodingKey {
        case id, employeeName, employeeId, department, leaveType
        case startDate, endDate, reason, totalDays, status, createdAt, requestedAt
        // Alternative keys from /api/approvals endpoint
        case requestedByName, type, workingDays, requestedDays
        case requester
    }
    
    // Nested requester object
    private struct Requester: Decodable {
        let id: Int?
        let name: String?
        let email: String?
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle id - can be Int or String from API
        if let intId = try? container.decode(Int.self, forKey: .id) {
            id = intId
        } else if let strId = try? container.decode(String.self, forKey: .id), let parsedId = Int(strId) {
            id = parsedId
        } else {
            id = 0
        }
        
        // Handle employeeName - try multiple fields
        if let name = try? container.decode(String.self, forKey: .employeeName), !name.isEmpty {
            employeeName = name
        } else if let name = try? container.decode(String.self, forKey: .requestedByName), !name.isEmpty {
            employeeName = name
        } else if let requester = try? container.decode(Requester.self, forKey: .requester), let name = requester.name {
            employeeName = name
        } else {
            employeeName = "Unknown"
        }
        
        employeeId = try? container.decode(String.self, forKey: .employeeId)
        department = (try? container.decode(String.self, forKey: .department)) ?? ""
        
        // Handle leaveType - API uses "type" field
        if let type = try? container.decode(String.self, forKey: .leaveType), !type.isEmpty {
            leaveType = type
        } else if let type = try? container.decode(String.self, forKey: .type), !type.isEmpty {
            leaveType = type
        } else {
            leaveType = "CASUAL"
        }
        
        startDate = (try? container.decode(String.self, forKey: .startDate)) ?? ""
        endDate = (try? container.decode(String.self, forKey: .endDate)) ?? ""
        reason = try? container.decode(String.self, forKey: .reason)
        
        // Handle totalDays - API uses workingDays or requestedDays
        if let days = try? container.decode(Double.self, forKey: .totalDays) {
            totalDays = days
        } else if let days = try? container.decode(Double.self, forKey: .workingDays) {
            totalDays = days
        } else if let days = try? container.decode(Double.self, forKey: .requestedDays) {
            totalDays = days
        } else if let days = try? container.decode(Int.self, forKey: .workingDays) {
            totalDays = Double(days)
        } else if let days = try? container.decode(Int.self, forKey: .requestedDays) {
            totalDays = Double(days)
        } else {
            totalDays = nil
        }
        
        status = (try? container.decode(String.self, forKey: .status)) ?? "PENDING"
        createdAt = try? container.decode(String.self, forKey: .createdAt)
        requestedAt = try? container.decode(String.self, forKey: .requestedAt)
    }
    
    var typeColor: Color {
        LeaveType(rawValue: leaveType)?.color ?? .gray
    }
    
    var formattedDateRange: String {
        let start = formatDate(startDate)
        let end = formatDate(endDate)
        if start == end {
            return start
        }
        return "\(start) - \(end)"
    }
    
    var daysText: String {
        if let days = totalDays {
            return days == 1 ? "1 day" : "\(Int(days)) days"
        }
        return ""
    }
    
    private func formatDate(_ dateString: String) -> String {
        if dateString.count >= 10 {
            let dateOnly = String(dateString.prefix(10))
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: dateOnly) {
                formatter.dateFormat = "MMM dd"
                return formatter.string(from: date)
            }
        }
        return dateString
    }
}

// MARK: - Approval List Response

struct ApprovalListResponse: Decodable {
    let approvals: [PendingApproval]?
    let items: [PendingApproval]?
    let total: Int?
    
    enum CodingKeys: String, CodingKey {
        case approvals, items, total
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        approvals = try? container.decode([PendingApproval].self, forKey: .approvals)
        items = try? container.decode([PendingApproval].self, forKey: .items)
        total = try? container.decode(Int.self, forKey: .total)
    }
    
    var allApprovals: [PendingApproval] {
        approvals ?? items ?? []
    }
}

// MARK: - Approval Action Request

struct ApprovalActionRequest: Encodable {
    let action: String // "approve", "reject", "return", "forward"
    let comment: String?
    
    // Convenience init to maintain compatibility
    init(action: String, comments: String?) {
        self.action = action
        self.comment = comments
    }
}

// MARK: - Approval Timeline Item

struct ApprovalTimelineItem: Decodable, Identifiable {
    let id: Int
    let action: String
    let actorName: String
    let actorRole: String?
    let comments: String?
    let timestamp: String
    
    var actionIcon: String {
        switch action.uppercased() {
        case "SUBMIT", "SUBMITTED":
            return "paperplane.fill"
        case "APPROVE", "APPROVED":
            return "checkmark.circle.fill"
        case "REJECT", "REJECTED":
            return "xmark.circle.fill"
        case "RETURN", "RETURNED":
            return "arrow.uturn.backward.circle.fill"
        case "CANCEL", "CANCELLED":
            return "minus.circle.fill"
        default:
            return "circle.fill"
        }
    }
    
    var actionColor: Color {
        switch action.uppercased() {
        case "SUBMIT", "SUBMITTED":
            return .blue
        case "APPROVE", "APPROVED":
            return .green
        case "REJECT", "REJECTED":
            return .red
        case "RETURN", "RETURNED":
            return .yellow
        case "CANCEL", "CANCELLED":
            return .gray
        default:
            return .secondary
        }
    }
}

// MARK: - Approval Detail

struct ApprovalDetail: Decodable {
    let leave: LeaveRequest
    let employee: Employee?
    let timeline: [ApprovalTimelineItem]?
}
