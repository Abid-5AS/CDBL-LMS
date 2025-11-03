//
//  PolicyConstants.swift
//  CDBLLeaveCompanion
//
//  Policy v2.0 constants matching lib/policy.ts
//

import Foundation

/// Centralized policy constants for CDBL Leave Management System
/// All values must match lib/policy.ts to ensure server-client parity
struct PolicyConstants {
    /// Policy version identifier
    static let version = "v2.0"
    
    // MARK: - Advance Notice Requirements
    
    /// Earned Leave: Minimum 5 working days advance notice (hard requirement)
    static let elMinNoticeDays = 5
    
    /// Casual Leave: Minimum 5 days advance notice (soft warning only)
    static let clMinNoticeDays = 5
    
    // MARK: - Consecutive Day Limits
    
    /// Casual Leave: Maximum 3 consecutive working days per spell
    static let clMaxConsecutiveDays = 3
    
    // MARK: - Medical Leave Certificate Thresholds
    
    /// Medical Leave >3 days requires medical certificate
    static let mlCertificateThreshold = 3
    
    /// Medical Leave >7 days requires fitness certificate on return
    static let mlFitnessCertificateThreshold = 7
    
    // MARK: - Annual Entitlements
    
    /// Earned Leave: 24 days per year (2 days per month accrual)
    static let elPerYear = 24
    
    /// Casual Leave: 10 days per year
    static let clPerYear = 10
    
    /// Medical Leave: 14 days per year
    static let mlPerYear = 14
    
    /// Earned Leave: Accrual rate (2 days per month)
    static let elAccrualPerMonth = 2
    
    // MARK: - Carry Forward
    
    /// Earned Leave: Maximum 60 days can be carried forward
    static let elCarryForwardCap = 60
    
    // MARK: - Backdate Rules
    
    /// Backdate allowed for these leave types
    static let allowBackdate: [String: Bool] = [
        "EL": true,
        "EARNED": true,
        "ML": true,
        "MEDICAL": true,
        "CL": false,
        "CASUAL": false
    ]
    
    /// Maximum backdate window (30 days for EL/ML)
    static let maxBackdateDays: [String: Int] = [
        "EL": 30,
        "EARNED": 30,
        "ML": 30,
        "MEDICAL": 30
    ]
    
    // MARK: - Helper Functions
    
    /// Check if a leave type allows backdating
    static func canBackdate(_ leaveType: String) -> Bool {
        return allowBackdate[leaveType.uppercased()] ?? false
    }
    
    /// Get maximum backdate window for a leave type
    static func maxBackdateWindow(for leaveType: String) -> Int? {
        return maxBackdateDays[leaveType.uppercased()]
    }
}

