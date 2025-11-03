//
//  ErrorMapper.swift
//  CDBLLeaveCompanion
//
//  Maps server error codes to user-friendly messages
//
//  TODO: Implement complete error mapping
//

import Foundation

enum ServerErrorCode: String, Codable {
    // Authentication
    case unauthorized
    case forbidden
    
    // Validation
    case invalidDates = "invalid_dates"
    case invalidInput = "invalid_input"
    case notFound = "not_found"
    
    // Earned Leave
    case elInsufficientNotice = "el_insufficient_notice"
    case elCarryCapExceeded = "el_carry_cap_exceeded"
    
    // Casual Leave
    case clExceedsConsecutiveLimit = "cl_exceeds_consecutive_limit"
    case clAnnualCapExceeded = "cl_annual_cap_exceeded"
    case clCannotTouchHoliday = "cl_cannot_touch_holiday"
    
    // Medical Leave
    case medicalCertificateRequired = "medical_certificate_required"
    case mlAnnualCapExceeded = "ml_annual_cap_exceeded"
    case fitnessCertificateRequired = "fitness_certificate_required"
    
    // Balance
    case insufficientBalance = "insufficient_balance"
    
    // Cancellation
    case cannotCancelNow = "cannot_cancel_now"
    case cancellationRequestInvalid = "cancellation_request_invalid"
    case alreadyCancelled = "already_cancelled"
    
    // Return/Recall
    case returnActionInvalid = "return_action_invalid"
    case cannotRecallNow = "cannot_recall_now"
    
    // File Upload
    case unsupportedFileType = "unsupported_file_type"
    case fileTooLarge = "file_too_large"
}

class ErrorMapper {
    /// Get user-friendly message for error code
    /// - Parameter code: Error code from server
    /// - Returns: Localized error message
    static func getUserFriendlyMessage(for code: ServerErrorCode) -> String {
        switch code {
        case .unauthorized:
            return "You are not authorized. Please log in."
        case .forbidden:
            return "You don't have permission to perform this action."
        case .invalidDates:
            return "Invalid date range. End date must be on or after start date."
        case .elInsufficientNotice:
            return "Earned Leave requires at least 5 working days advance notice."
        case .clExceedsConsecutiveLimit:
            return "Casual Leave cannot exceed 3 consecutive days per spell."
        case .clCannotTouchHoliday:
            return "Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead."
        case .medicalCertificateRequired:
            return "Medical certificate is required for sick leave over 3 days."
        case .insufficientBalance:
            return "Insufficient leave balance for this request."
        case .unsupportedFileType:
            return "Unsupported file type. Use PDF, JPG, or PNG."
        case .fileTooLarge:
            return "File too large (max 5 MB)."
        case .cannotCancelNow:
            return "Leave request cannot be cancelled at this stage."
        default:
            return "An error occurred. Please try again."
        }
    }
    
    /// Map error code string to enum
    /// - Parameter codeString: Error code from API response
    /// - Returns: Error code enum or nil if unknown
    static func mapErrorCode(_ codeString: String) -> ServerErrorCode? {
        return ServerErrorCode(rawValue: codeString)
    }
}

// MARK: - TODO List

/*
 * TODO Implementation Tasks:
 * 1. Add all error codes from lib/errors.ts
 * 2. Localize messages for Bangla support
 * 3. Add detailed error descriptions with recovery suggestions
 * 4. Add action buttons (e.g., "Contact HR") for certain errors
 * 5. Track error frequency for analytics
 */

