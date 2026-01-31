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
    let needsCertificate: Bool?
    let certificateUrl: String?
    let fitnessCertificateUrl: String?
    let isHalfDay: Bool?
    let halfDayType: String?
    let halfDayPeriod: String?
    let totalDays: Double?
    
    enum CodingKeys: String, CodingKey {
        case id, type, startDate, endDate, reason, status
        case createdAt, updatedAt, userId, employeeName, department
        case approverComments, attachmentUrl, needsCertificate
        case certificateUrl, fitnessCertificateUrl
        case isHalfDay, halfDayType, halfDayPeriod, totalDays
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = (try? container.decode(Int.self, forKey: .id)) ?? 0
        type = (try? container.decode(String.self, forKey: .type)) ?? "CASUAL"
        startDate = (try? container.decode(String.self, forKey: .startDate)) ?? ""
        endDate = (try? container.decode(String.self, forKey: .endDate)) ?? ""
        reason = try? container.decode(String.self, forKey: .reason)
        status = (try? container.decode(String.self, forKey: .status)) ?? "PENDING"
        createdAt = try? container.decode(String.self, forKey: .createdAt)
        updatedAt = try? container.decode(String.self, forKey: .updatedAt)
        userId = try? container.decode(Int.self, forKey: .userId)
        employeeName = try? container.decode(String.self, forKey: .employeeName)
        department = try? container.decode(String.self, forKey: .department)
        approverComments = try? container.decode(String.self, forKey: .approverComments)
        attachmentUrl = try? container.decode(String.self, forKey: .attachmentUrl)
        needsCertificate = try? container.decode(Bool.self, forKey: .needsCertificate)
        certificateUrl = try? container.decode(String.self, forKey: .certificateUrl)
        fitnessCertificateUrl = try? container.decode(String.self, forKey: .fitnessCertificateUrl)
        isHalfDay = try? container.decode(Bool.self, forKey: .isHalfDay)
        halfDayType = try? container.decode(String.self, forKey: .halfDayType)
        halfDayPeriod = try? container.decode(String.self, forKey: .halfDayPeriod)
        totalDays = try? container.decode(Double.self, forKey: .totalDays)
    }
    
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
    let needsCertificate: Bool?
    let incidentDate: String?
    let isHalfDay: Bool?
    let halfDayPeriod: String?
}

// MARK: - Leave Type

enum LeaveType: String, CaseIterable {
    case earned = "EARNED"
    case casual = "CASUAL"
    case medical = "MEDICAL"
    case compensatory = "COMPENSATORY"
    case maternity = "MATERNITY"
    case paternity = "PATERNITY"
    case extraWithPay = "EXTRAWITHPAY"
    case extraWithoutPay = "EXTRAWITHOUTPAY"
    case study = "STUDY"
    case specialDisability = "SPECIAL_DISABILITY"
    case quarantine = "QUARANTINE"
    case special = "SPECIAL"
    
    var displayName: String {
        switch self {
        case .earned: return "Earned Leave"
        case .casual: return "Casual Leave"
        case .medical: return "Medical Leave"
        case .compensatory: return "Compensatory Leave"
        case .maternity: return "Maternity Leave"
        case .paternity: return "Paternity Leave"
        case .extraWithPay: return "Extraordinary Leave (Paid)"
        case .extraWithoutPay: return "Extraordinary Leave (Unpaid)"
        case .study: return "Study Leave"
        case .specialDisability: return "Special Disability Leave"
        case .quarantine: return "Quarantine Leave"
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
        case .extraWithPay: return "creditcard.fill"
        case .extraWithoutPay: return "creditcard"
        case .study: return "book.fill"
        case .specialDisability: return "figure.roll"
        case .quarantine: return "shield.lefthalf.filled"
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
        case .extraWithPay: return .orange
        case .extraWithoutPay: return .gray
        case .study: return .purple
        case .specialDisability: return .brown
        case .quarantine: return .teal
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
    let MATERNITY: Double?
    let PATERNITY: Double?
    let STUDY: Double?
    let SPECIAL: Double?
    let SPECIAL_DISABILITY: Double?
    let QUARANTINE: Double?
    let EXTRAWITHPAY: Double?
    let EXTRAWITHOUTPAY: Double?
}
