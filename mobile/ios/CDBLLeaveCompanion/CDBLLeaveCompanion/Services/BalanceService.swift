//
//  BalanceService.swift
//  CDBLLeaveCompanion
//
//  Service for fetching leave balances (stub implementation for future API integration)
//

import Foundation
import Combine

struct LeaveBalance: Codable, Identifiable {
    let id = UUID()
    let year: Int
    let CASUAL: Int
    let MEDICAL: Int
    let EARNED: Int
}

enum BalanceService {
    // TODO: Replace with real API call when endpoint is available
    static func fetchBalances() async throws -> LeaveBalance {
        // Simulate network delay
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        
        // Return mock data for now
        return LeaveBalance(
            year: Calendar.current.component(.year, from: Date()),
            CASUAL: 10,
            MEDICAL: 14,
            EARNED: 45
        )
    }
    
    /// Get balance for a specific leave type
    static func balance(for type: LeaveType, in balances: LeaveBalance) -> Int {
        switch type {
        case .CASUAL: return balances.CASUAL
        case .MEDICAL: return balances.MEDICAL
        case .EARNED: return balances.EARNED
        default: return 0
        }
    }
}

