//
//  LeaveModels.swift
//  CDBLLeaveManager
//
//  Leave request and balance related models.
//

import Foundation
import SwiftUI

// MARK: - Leave Request

struct LeaveRequest: Decodable, Identifiable {
    let id: Int
    let type: String
    let startDate: String
    let endDate: String
    let reason: String?
    var status: String
    let createdAt: String?
    let updatedAt: String?
    let userId: Int?
    let employeeName: String?
    let department: String?
    let approverComments: String?
    let attachmentUrl: String?
    let isHalfDay: Bool?
    let halfDayType: String?
    let totalDays: Double?
    
    var statusColor: Color {
        switch status.uppercased() {
        case "APPROVED":
            return .green
        case "REJECTED":
            return .red
        case "PENDING":
            return .orange
        case "RETURNED":
            return .yellow
        case "CANCELLED":
            return .gray
        default:
            return .blue
        }
    }
    
    var statusIcon: String {
        switch status.uppercased() {
        case "APPROVED":
            return "checkmark.circle.fill"
        case "REJECTED":
            return "xmark.circle.fill"
        case "PENDING":
            return "clock.fill"
        case "RETURNED":
            return "arrow.uturn.backward.circle.fill"
        case "CANCELLED":
            return "minus.circle.fill"
        default:
            return "questionmark.circle.fill"
        }
    }
    
    var formattedDateRange: String {
        let start = formatDate(startDate)
        let end = formatDate(endDate)
        if start == end {
            return start
        }
        return "\(start) - \(end)"
    }
    
    private func formatDate(_ dateString: String) -> String {
        // Parse ISO date and format to display
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = isoFormatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MMM dd"
            return displayFormatter.string(from: date)
        }
        
        // Fallback: try simple date format
        if dateString.count >= 10 {
            return String(dateString.prefix(10))
        }
        return dateString
    }
}

// MARK: - Leave Request List Response

struct LeaveListResponse: Decodable {
    let leaves: [LeaveRequest]?
    let items: [LeaveRequest]?
    let total: Int?
    let page: Int?
    let pageSize: Int?
    
    var allLeaves: [LeaveRequest] {
        leaves ?? items ?? []
    }
}

// MARK: - Apply Leave Request

struct ApplyLeaveRequest: Encodable {
    let type: String
    let startDate: String
    let endDate: String
    let reason: String
    let isHalfDay: Bool?
    let halfDayType: String?
}

// MARK: - Leave Type

enum LeaveType: String, CaseIterable {
    case earned = "EARNED"
    case casual = "CASUAL"
    case medical = "MEDICAL"
    case compensatory = "COMPENSATORY"
    case maternity = "MATERNITY"
    case paternity = "PATERNITY"
    case special = "SPECIAL"
    
    var displayName: String {
        switch self {
        case .earned: return "Earned Leave"
        case .casual: return "Casual Leave"
        case .medical: return "Medical Leave"
        case .compensatory: return "Compensatory Leave"
        case .maternity: return "Maternity Leave"
        case .paternity: return "Paternity Leave"
        case .special: return "Special Leave"
        }
    }
    
    var icon: String {
        switch self {
        case .earned: return "airplane"
        case .casual: return "sun.max.fill"
        case .medical: return "cross.case.fill"
        case .compensatory: return "clock.arrow.circlepath"
        case .maternity: return "figure.and.child.holdinghands"
        case .paternity: return "figure.and.child.holdinghands"
        case .special: return "star.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .earned: return .indigo
        case .casual: return .cyan
        case .medical: return .red
        case .compensatory: return .green
        case .maternity: return .pink
        case .paternity: return .blue
        case .special: return .purple
        }
    }
}

// MARK: - Leave Status

enum LeaveStatus: String, CaseIterable {
    case pending = "PENDING"
    case approved = "APPROVED"
    case rejected = "REJECTED"
    case returned = "RETURNED"
    case cancelled = "CANCELLED"
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var color: Color {
        switch self {
        case .pending: return .orange
        case .approved: return .green
        case .rejected: return .red
        case .returned: return .yellow
        case .cancelled: return .gray
        }
    }
}

// MARK: - Balance Detail

struct BalanceDetail: Decodable, Identifiable {
    var id: String { type }
    let type: String
    let total: Double
    let used: Double
    let remaining: Double
    let pending: Double?
    
    var color: Color {
        LeaveType(rawValue: type)?.color ?? .gray
    }
    
    var icon: String {
        LeaveType(rawValue: type)?.icon ?? "calendar"
    }
    
    var displayName: String {
        LeaveType(rawValue: type)?.displayName ?? type
    }
}

struct BalanceResponse: Decodable {
    let balances: [BalanceDetail]?
    let EARNED: Double?
    let CASUAL: Double?
    let MEDICAL: Double?
}
