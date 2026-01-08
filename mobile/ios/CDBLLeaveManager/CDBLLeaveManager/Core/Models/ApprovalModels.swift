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
    
    var allApprovals: [PendingApproval] {
        approvals ?? items ?? []
    }
}

// MARK: - Approval Action Request

struct ApprovalActionRequest: Encodable {
    let action: String // "APPROVE", "REJECT", "RETURN"
    let comments: String?
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
