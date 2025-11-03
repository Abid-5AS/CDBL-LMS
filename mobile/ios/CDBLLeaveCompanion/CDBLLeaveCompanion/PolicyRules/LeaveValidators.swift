//
//  LeaveValidators.swift
//  CDBLLeaveCompanion
//
//  Policy v2.0 validators matching server logic in lib/policy.ts
//

import Foundation

/// Validation result for leave request checks
struct ValidationResult {
    let isValid: Bool
    let errorKey: String?
    let message: String?
    
    static func valid() -> ValidationResult {
        ValidationResult(isValid: true, errorKey: nil, message: nil)
    }
    
    static func invalid(key: String, message: String) -> ValidationResult {
        ValidationResult(isValid: false, errorKey: key, message: message)
    }
}

/// Centralized validators for CDBL Leave Management Policy v2.0
/// All validators mirror server logic in lib/policy.ts and app/api/leaves/route.ts
struct LeaveValidators {
    
    // MARK: - Earned Leave Validators
    
    /// Validate EL advance notice requirement: ≥5 working days
    static func validateELNotice(
        start: Date,
        applyDate: Date = Date(),
        excluding holidays: [Date] = []
    ) -> ValidationResult {
        let workingDays = WorkingDayCalculator.countWorkingDays(
            from: applyDate,
            to: start,
            excluding: holidays.map { Holiday(date: DateFormatter.iso8601Day.string(from: $0), name: "", type: "PUBLIC_HOLIDAY") }
        )
        
        // Require at least 5 working days notice
        if workingDays < PolicyConstants.elMinNoticeDays {
            return .invalid(
                key: "el_insufficient_notice",
                message: "Earned Leave requires at least \(PolicyConstants.elMinNoticeDays) working days advance notice. You have \(workingDays) working day\(workingDays == 1 ? "" : "s")."
            )
        }
        
        return .valid()
    }
    
    // MARK: - Casual Leave Validators
    
    /// Validate CL consecutive day limit: ≤3 working days
    static func validateCLConsecutive(
        start: Date,
        end: Date,
        excluding holidays: [Date] = []
    ) -> ValidationResult {
        let workingDays = WorkingDayCalculator.countWorkingDays(
            from: start,
            to: end,
            excluding: holidays.map { Holiday(date: DateFormatter.iso8601Day.string(from: $0), name: "", type: "PUBLIC_HOLIDAY") }
        )
        
        if workingDays > PolicyConstants.clMaxConsecutiveDays {
            return .invalid(
                key: "cl_exceeds_consecutive_limit",
                message: "Casual Leave cannot exceed \(PolicyConstants.clMaxConsecutiveDays) consecutive working days. Your request spans \(workingDays) days."
            )
        }
        
        return .valid()
    }
    
    /// Validate CL side-touch rule: cannot be adjacent to Fri/Sat/holiday on either side
    static func validateCLSideTouch(
        start: Date,
        end: Date,
        excluding holidays: [Date] = []
    ) -> ValidationResult {
        let calendar = Calendar.current
        
        // Check day before start
        let dayBeforeStart = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: start))
        if let dayBefore = dayBeforeStart {
            if WorkingDayCalculator.isWeekend(dayBefore) || isHoliday(dayBefore, in: holidays) {
                return .invalid(
                    key: "cl_cannot_touch_holiday",
                    message: "Casual Leave cannot be adjacent to weekends or holidays. Please use Earned Leave if you need to include Friday or Saturday."
                )
            }
        }
        
        // Check day after end
        let dayAfterEnd = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: end))
        if let dayAfter = dayAfterEnd {
            if WorkingDayCalculator.isWeekend(dayAfter) || isHoliday(dayAfter, in: holidays) {
                return .invalid(
                    key: "cl_cannot_touch_holiday",
                    message: "Casual Leave cannot be adjacent to weekends or holidays. Please use Earned Leave if you need to include Friday or Saturday."
                )
            }
        }
        
        return .valid()
    }
    
    // MARK: - Medical Leave Validators
    
    /// Validate ML certificate requirement: >3 days requires certificate
    static func validateMLCertificate(days: Int, hasFile: Bool) -> ValidationResult {
        if days > PolicyConstants.mlCertificateThreshold && !hasFile {
            return .invalid(
                key: "medical_certificate_required",
                message: "Medical leave over \(PolicyConstants.mlCertificateThreshold) days requires a medical certificate. Please attach your certificate."
            )
        }
        
        return .valid()
    }
    
    // MARK: - Date Validators
    
    /// Validate that a date is not a weekend or holiday
    static func validateDateNotWeekendOrHoliday(
        _ date: Date,
        excluding holidays: [Date] = []
    ) -> ValidationResult {
        if WorkingDayCalculator.isWeekend(date) {
            return .invalid(
                key: "start_or_end_on_holiday",
                message: "Leave cannot start or end on a Friday or Saturday. Please select a working day."
            )
        }
        
        if isHoliday(date, in: holidays) {
            return .invalid(
                key: "start_or_end_on_holiday",
                message: "Leave cannot start or end on a company holiday. Please select a working day."
            )
        }
        
        return .valid()
    }
    
    // MARK: - Attachment Validators
    
    /// Validate attachment file size: ≤5MB per file
    static func validateAttachmentSize(_ fileURL: URL) -> ValidationResult {
        guard let attributes = try? FileManager.default.attributesOfItem(atPath: fileURL.path),
              let fileSize = attributes[.size] as? Int64 else {
            return .invalid(
                key: "file_required",
                message: "Could not read file size. Please select a valid file."
            )
        }
        
        let maxBytes = 5 * 1024 * 1024  // 5 MB
        if fileSize > maxBytes {
            let mbSize = Double(fileSize) / (1024 * 1024)
            return .invalid(
                key: "file_too_large",
                message: String(format: "File too large (%.1f MB). Maximum allowed is 5 MB per file.", mbSize)
            )
        }
        
        return .valid()
    }
    
    /// Validate attachment type: PDF/JPG/PNG/HEIC only
    static func validateAttachmentType(_ fileURL: URL) -> ValidationResult {
        let allowedTypes: Set<String> = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/heic"
        ]
        
        // Try to determine type via UTType
        if #available(iOS 14.0, *) {
            guard let typeIdentifier = try? fileURL.resourceValues(forKeys: [.typeIdentifierKey]).typeIdentifier,
                  let utType = UTType(typeIdentifier) else {
                return .invalid(
                    key: "certificate_invalid_type",
                    message: "Cannot determine file type. Upload a valid PDF, JPG, PNG, or HEIC file."
                )
            }
            
            if !allowedTypes.contains(where: { utType.conforms(to: UTType($0) ?? UTType.data) }) {
                return .invalid(
                    key: "unsupported_file_type",
                    message: "Unsupported file type. Use PDF, JPG, PNG, or HEIC."
                )
            }
        } else {
            // Fallback for iOS < 14: check file extension
            let ext = fileURL.pathExtension.lowercased()
            let allowedExts = ["pdf", "jpg", "jpeg", "png", "heic"]
            if !allowedExts.contains(ext) {
                return .invalid(
                    key: "unsupported_file_type",
                    message: "Unsupported file type. Use PDF, JPG, PNG, or HEIC."
                )
            }
        }
        
        return .valid()
    }
    
    /// Validate total attachment size: ≤20MB total
    static func validateTotalAttachmentSize(_ fileURLs: [URL]) -> ValidationResult {
        var totalBytes: Int64 = 0
        let maxTotalBytes = 20 * 1024 * 1024  // 20 MB
        
        for url in fileURLs {
            guard let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
                  let fileSize = attributes[.size] as? Int64 else {
                continue
            }
            totalBytes += fileSize
        }
        
        if totalBytes > maxTotalBytes {
            let mbSize = Double(totalBytes) / (1024 * 1024)
            return .invalid(
                key: "file_too_large",
                message: String(format: "Total attachment size too large (%.1f MB). Maximum allowed is 20 MB total.", mbSize)
            )
        }
        
        return .valid()
    }
    
    // MARK: - Helper Functions
    
    /// Check if a date is a holiday
    private static func isHoliday(_ date: Date, in holidays: [Date]) -> Bool {
        let dateString = DateFormatter.iso8601Day.string(from: date)
        return holidays.contains { DateFormatter.iso8601Day.string(from: $0) == dateString }
    }
}

#if canImport(UniformTypeIdentifiers)
import UniformTypeIdentifiers
#endif

