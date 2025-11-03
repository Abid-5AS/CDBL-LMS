//
//  LeaveRequest.swift
//  CDBLLeaveCompanion
//
//  Codable model matching Prisma LeaveRequest schema
//

import Foundation

// MARK: - Leave Type Enum

enum LeaveType: String, Codable, CaseIterable, Identifiable {
    case CASUAL = "CASUAL"
    case MEDICAL = "MEDICAL"
    case EARNED = "EARNED"
    case EXTRAWITHPAY = "EXTRAWITHPAY"
    case EXTRAWITHOUTPAY = "EXTRAWITHOUTPAY"
    case MATERNITY = "MATERNITY"
    case PATERNITY = "PATERNITY"
    case STUDY = "STUDY"
    case SPECIAL_DISABILITY = "SPECIAL_DISABILITY"
    case QUARANTINE = "QUARANTINE"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .CASUAL: return "Casual Leave"
        case .MEDICAL: return "Sick Leave"
        case .EARNED: return "Earned Leave"
        case .EXTRAWITHPAY: return "Extra Leave (With Pay)"
        case .EXTRAWITHOUTPAY: return "Extra Leave (Without Pay)"
        case .MATERNITY: return "Maternity Leave"
        case .PATERNITY: return "Paternity Leave"
        case .STUDY: return "Study Leave"
        case .SPECIAL_DISABILITY: return "Special Disability Leave"
        case .QUARANTINE: return "Quarantine Leave"
        }
    }
    
    // Primary types used in the app (as per web form)
    static var primaryTypes: [LeaveType] {
        [.CASUAL, .MEDICAL, .EARNED]
    }

    /// Policy helper: guidance strings that mirror the web form tips
    var policyTips: [String] {
        switch self {
        case .CASUAL:
            return ["Max 3 consecutive days", "Must retain 5 days balance"]
        case .MEDICAL:
            return ["> 3 days requires certificate", "Backdating allowed up to 30 days"]
        case .EARNED:
            return ["Submit at least 5 working days in advance", "Balance carries forward up to 60 days"]
        default:
            return []
        }
    }

    /// Policy helper: maximum continuous days allowed for specific leave types
    var maximumConsecutiveDays: Int? {
        switch self {
        case .CASUAL:
            return 3  // Policy v2.0: CL max 3 consecutive days
        default:
            return nil
        }
    }

    /// Policy helper: returns the earliest allowed selection date for the leave type
    func minimumSelectableDate(referenceDate: Date = Date()) -> Date {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: referenceDate)

        switch self {
        case .MEDICAL, .EARNED:
            return calendar.date(byAdding: .day, value: -30, to: today) ?? today
        default:
            return today
        }
    }
}

// MARK: - Leave Status Enum

enum LeaveStatus: String, Codable, CaseIterable, Identifiable {
    var id: String { rawValue }
    case DRAFT
    case SUBMITTED
    case PENDING
    case APPROVED
    case REJECTED
    case CANCELLED
    // Policy v2.0 additions
    case RETURNED
    case CANCELLATION_REQUESTED
    case RECALLED
    case OVERSTAY_PENDING
    
    var displayName: String {
        switch self {
        case .DRAFT: return "Draft"
        case .SUBMITTED: return "Submitted"
        case .PENDING: return "Pending"
        case .APPROVED: return "Approved"
        case .REJECTED: return "Rejected"
        case .CANCELLED: return "Cancelled"
        case .RETURNED: return "Returned"
        case .CANCELLATION_REQUESTED: return "Cancellation Requested"
        case .RECALLED: return "Recalled"
        case .OVERSTAY_PENDING: return "Overstay Pending"
        }
    }
}

// MARK: - Leave Request Model

struct LeaveRequest: Codable, Identifiable {
    let id: UUID?
    let type: LeaveType
    let startDate: Date
    let endDate: Date
    let workingDays: Int
    let reason: String
    let needsCertificate: Bool
    let status: LeaveStatus
    let policyVersion: String
    
    init(
        id: UUID? = nil,
        type: LeaveType,
        startDate: Date,
        endDate: Date,
        reason: String,
        needsCertificate: Bool = false,
        status: LeaveStatus = .DRAFT,
        policyVersion: String = "v1.1"
    ) {
        self.id = id
        self.type = type
        self.startDate = startDate
        self.endDate = endDate
        self.workingDays = Self.calculateWorkingDays(from: startDate, to: endDate)
        self.reason = reason
        self.needsCertificate = needsCertificate
        self.status = status
        self.policyVersion = policyVersion
    }
    
    // MARK: - Date Coding
    
    enum CodingKeys: String, CodingKey {
        case id, type, reason, status, policyVersion, needsCertificate
        case startDate, endDate, workingDays
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decodeIfPresent(UUID.self, forKey: .id)
        type = try container.decode(LeaveType.self, forKey: .type)
        
        // Decode dates as ISO8601 strings
        let startDateString = try container.decode(String.self, forKey: .startDate)
        let endDateString = try container.decode(String.self, forKey: .endDate)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let start = formatter.date(from: startDateString) else {
            throw DecodingError.dataCorruptedError(forKey: .startDate, in: container, debugDescription: "Invalid date format")
        }
        guard let end = formatter.date(from: endDateString) else {
            throw DecodingError.dataCorruptedError(forKey: .endDate, in: container, debugDescription: "Invalid date format")
        }
        
        startDate = start
        endDate = end
        workingDays = try container.decode(Int.self, forKey: .workingDays)
        reason = try container.decode(String.self, forKey: .reason)
        needsCertificate = try container.decode(Bool.self, forKey: .needsCertificate)
        status = try container.decode(LeaveStatus.self, forKey: .status)
        policyVersion = try container.decode(String.self, forKey: .policyVersion)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encodeIfPresent(id, forKey: .id)
        try container.encode(type, forKey: .type)
        
        // Encode dates as ISO8601 strings
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        try container.encode(formatter.string(from: startDate), forKey: .startDate)
        try container.encode(formatter.string(from: endDate), forKey: .endDate)
        
        try container.encode(workingDays, forKey: .workingDays)
        try container.encode(reason, forKey: .reason)
        try container.encode(needsCertificate, forKey: .needsCertificate)
        try container.encode(status, forKey: .status)
        try container.encode(policyVersion, forKey: .policyVersion)
    }
    
    // MARK: - Validation
    
    /// Calculate working days excluding weekends (Fri/Sat) and holidays
    /// Matches web app logic: Business days are Sun(0) to Thu(4). Weekends: Fri(5), Sat(6).
    static func calculateWorkingDays(from start: Date, to end: Date) -> Int {
        let calendar = Calendar.current
        let startDay = calendar.startOfDay(for: start)
        let endDay = calendar.startOfDay(for: end)
        
        guard startDay <= endDay else {
            return 0
        }
        
        var count = 0
        var currentDate = startDay
        
        while currentDate <= endDay {
            let weekday = calendar.component(.weekday, from: currentDate)
            // Calendar.component(.weekday) returns: 1=Sunday, 2=Monday, ..., 7=Saturday
            // Business days: Sunday(1), Monday(2), Tuesday(3), Wednesday(4), Thursday(5)
            // Weekends: Friday(6), Saturday(7)
            if weekday <= 5 { // Sunday through Thursday
                // TODO: Check against holidays list when available
                count += 1
            }
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        return count
    }
    
    /// Check if a date falls on a weekend (Friday or Saturday)
    static func isWeekend(_ date: Date) -> Bool {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: date)
        // Friday = 6, Saturday = 7
        return weekday == 6 || weekday == 7
    }
    
    /// Check if a date is a valid working day (not weekend)
    static func isValidWorkingDay(_ date: Date) -> Bool {
        return !isWeekend(date)
        // TODO: Also check against holidays list when available
    }
    
    func validate() -> ValidationResult {
        var errors: [String] = []
        
        // Date validation (exact web app wording)
        if startDate > endDate {
            errors.append("End date must be on or after start date")
        }
        
        // Weekend validation
        if Self.isWeekend(startDate) {
            errors.append("Leave cannot start on a weekend (Friday or Saturday)")
        }
        
        if Self.isWeekend(endDate) {
            errors.append("Leave cannot end on a weekend (Friday or Saturday)")
        }
        
        if workingDays <= 0 {
            errors.append("Invalid date range")
        }

        // Reason validation (exact web app wording)
        let trimmedReason = reason.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedReason.isEmpty {
            errors.append("Reason is required")
        } else if trimmedReason.count < 10 {
            errors.append("Reason must be at least 10 characters")
        }

        // Type-specific validation
        if let maximum = type.maximumConsecutiveDays, workingDays > maximum {
            errors.append("\(type.displayName) cannot exceed \(maximum) consecutive day(s).")
        }
        
        // Medical certificate validation (exact web app wording)
        if type == .MEDICAL && workingDays > 3 && !needsCertificate {
            errors.append("Medical certificate is required for sick leave over 3 days")
        }
        
        // Advance notice validation for Earned Leave
        if type == .EARNED {
            let calendar = Calendar.current
            let today = calendar.startOfDay(for: Date())
            let start = calendar.startOfDay(for: startDate)
            if let days = calendar.dateComponents([.day], from: today, to: start).day, days < 15 {
                errors.append("Earned Leave requires 15 days' advance notice.")
            }
        }
        
        return ValidationResult(isValid: errors.isEmpty, errors: errors)
    }
}

// MARK: - Validation Result

struct ValidationResult {
    let isValid: Bool
    let errors: [String]
}
