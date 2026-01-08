//
//  EncashmentModels.swift
//  CDBLLeaveManager
//
//  Leave encashment related models.
//

import Foundation
import SwiftUI

// MARK: - Encashment

struct Encashment: Decodable, Identifiable {
    let id: Int
    let leaveType: String
    let days: Double
    let amount: Double?
    let status: String
    let requestedAt: String
    let processedAt: String?
    let processedBy: String?
    let comments: String?
    
    var statusColor: Color {
        switch status.uppercased() {
        case "APPROVED":
            return .green
        case "REJECTED":
            return .red
        case "PENDING":
            return .orange
        case "PROCESSED":
            return .blue
        default:
            return .gray
        }
    }
    
    var formattedAmount: String {
        if let amount = amount {
            return String(format: "৳%.2f", amount)
        }
        return "Pending Calculation"
    }
    
    var formattedDate: String {
        if requestedAt.count >= 10 {
            let dateOnly = String(requestedAt.prefix(10))
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: dateOnly) {
                formatter.dateFormat = "MMM dd, yyyy"
                return formatter.string(from: date)
            }
        }
        return requestedAt
    }
}

// MARK: - Encashment List Response

struct EncashmentListResponse: Decodable {
    let encashments: [Encashment]?
    let items: [Encashment]?
    let total: Int?
    
    var allEncashments: [Encashment] {
        encashments ?? items ?? []
    }
}

// MARK: - Encashment Request

struct EncashmentRequest: Encodable {
    let leaveType: String
    let days: Double
    let reason: String?
}

// MARK: - Encashment Eligibility

struct EncashmentEligibility: Decodable {
    let isEligible: Bool
    let maxDays: Double
    let availableBalance: Double
    let ratePerDay: Double?
    let message: String?
    
    // UI Compatibility
    var eligibleDays: Double { availableBalance }
    var maxEncashable: Double { maxDays }
    var estimatedAmount: Double { (ratePerDay ?? 0) * availableBalance }
}
