package com.abid.cdbl_lms.domain.policy

import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.model.LeaveStatus
import java.util.Calendar
import java.util.Date

/**
 * Policy validation engine
 * Source: docs/Policy Logic/02-Leave Application Rules and Validation.md
 * Policy Version: v2.0
 */
object LeavePolicyValidator {
    
    // Policy Constants (from docs/Policy Logic/01-Leave Types and Entitlements.md)
    const val EL_PER_YEAR = 24  // 2 days/month × 12 months
    const val CL_PER_YEAR = 10
    const val ML_PER_YEAR = 14
    const val EL_MIN_NOTICE_DAYS = 5  // Working days (excludes Fri/Sat/holidays)
    const val CL_MAX_CONSECUTIVE = 3
    const val ML_CERTIFICATE_THRESHOLD = 3
    const val EL_CARRY_FORWARD_CAP = 60
    const val MAX_BACKDATE_DAYS = 30

    /**
     * Validates if medical certificate is required
     * Policy: docs/Policy Logic/05-File Upload and Medical Certificate Rules.md
     */
    fun needsMedicalCertificate(type: LeaveType, days: Int): Boolean {
        return type == LeaveType.MEDICAL && days > ML_CERTIFICATE_THRESHOLD
    }

    /**
     * Validates if leave can be cancelled
     * Policy: docs/Policy Logic/07-Cancellation and Modification Rules.md
     */
    fun canCancel(status: LeaveStatus): Boolean {
        return status in listOf(LeaveStatus.SUBMITTED, LeaveStatus.PENDING, LeaveStatus.RETURNED, LeaveStatus.CANCELLATION_REQUESTED)
    }

    /**
     * Validates if leave can request cancellation (for approved leaves)
     */
    fun canRequestCancellation(status: LeaveStatus): Boolean {
        return status == LeaveStatus.APPROVED
    }

    /**
     * Check if date is weekend (Friday or Saturday)
     * Policy: docs/Policy Logic/03-Holiday and Weekend Handling.md
     */
    fun isWeekend(date: Date): Boolean {
        val calendar = Calendar.getInstance().apply { time = date }
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
        // Calendar.SUNDAY = 1, Calendar.SATURDAY = 7
        // Friday = 6, Saturday = 7
        return dayOfWeek == Calendar.FRIDAY || dayOfWeek == Calendar.SATURDAY
    }

    /**
     * Check if start/end date can be on weekend or holiday
     * Policy: Start/End dates cannot be Fri/Sat/holiday
     */
    fun isValidStartOrEndDate(date: Date, holidays: List<Date> = emptyList()): Boolean {
        if (isWeekend(date)) return false
        // Check if date is in holidays list
        val dateStr = dateToString(date)
        return holidays.none { dateToString(it) == dateStr }
    }

    /**
     * Check if CL touches holiday/weekend on sides
     * Policy: CL cannot touch holidays/weekends on start OR end dates
     */
    fun clTouchesHolidayOrWeekend(startDate: Date, endDate: Date, holidays: List<Date> = emptyList()): Boolean {
        return !isValidStartOrEndDate(startDate, holidays) || !isValidStartOrEndDate(endDate, holidays)
    }

    /**
     * Calculate working days between two dates (excludes Fri/Sat and holidays)
     * Used for EL notice calculation
     */
    fun countWorkingDays(start: Date, end: Date, holidays: List<Date> = emptyList()): Int {
        val calendar = Calendar.getInstance()
        calendar.time = start
        var count = 0
        val endTime = end.time

        while (calendar.timeInMillis <= endTime) {
            val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
            val isNotWeekend = dayOfWeek != Calendar.FRIDAY && dayOfWeek != Calendar.SATURDAY
            val dateStr = dateToString(calendar.time)
            val isNotHoliday = holidays.none { dateToString(it) == dateStr }

            if (isNotWeekend && isNotHoliday) {
                count++
            }
            calendar.add(Calendar.DAY_OF_MONTH, 1)
        }
        return count
    }

    /**
     * Calculate calendar days inclusive (for leave duration)
     * Policy: All days count, including weekends/holidays
     */
    fun calculateCalendarDays(start: Date, end: Date): Int {
        val diff = end.time - start.time
        return (diff / (1000 * 60 * 60 * 24)).toInt() + 1
    }

    /**
     * Validate EL advance notice requirement
     * Policy: ≥5 working days (not calendar days)
     */
    fun validateELNotice(startDate: Date, holidays: List<Date> = emptyList()): ValidationResult {
        val today = Date()
        val workingDays = countWorkingDays(today, startDate, holidays)
        
        return if (workingDays < EL_MIN_NOTICE_DAYS) {
            ValidationResult.Error("EL requires at least $EL_MIN_NOTICE_DAYS working days notice. You have $workingDays days.")
        } else {
            ValidationResult.Success
        }
    }

    /**
     * Validate CL consecutive limit
     */
    fun validateCLConsecutive(days: Int): ValidationResult {
        return if (days > CL_MAX_CONSECUTIVE) {
            ValidationResult.Error("Casual Leave cannot exceed $CL_MAX_CONSECUTIVE consecutive days.")
        } else {
            ValidationResult.Success
        }
    }

    /**
     * Validate CL side-touch rule
     */
    fun validateCLSideTouch(startDate: Date, endDate: Date, holidays: List<Date> = emptyList()): ValidationResult {
        return if (clTouchesHolidayOrWeekend(startDate, endDate, holidays)) {
            ValidationResult.Error("Casual Leave cannot be adjacent to holidays or weekends. Please use Earned Leave instead.")
        } else {
            ValidationResult.Success
        }
    }

    /**
     * Validate backdate window
     */
    fun validateBackdateWindow(startDate: Date, type: LeaveType): ValidationResult {
        val today = Date()
        if (startDate >= today) return ValidationResult.Success

        when (type) {
            LeaveType.CASUAL -> {
                return ValidationResult.Error("Casual Leave cannot be backdated.")
            }
            LeaveType.EARNED, LeaveType.MEDICAL -> {
                val daysBack = calculateCalendarDays(startDate, today)
                return if (daysBack > MAX_BACKDATE_DAYS) {
                    ValidationResult.Error("Backdate window exceeded. Maximum $MAX_BACKDATE_DAYS days allowed.")
                } else {
                    ValidationResult.Success
                }
            }
            else -> return ValidationResult.Success
        }
    }

    /**
     * Validate balance availability
     */
    fun validateBalance(available: Int, requested: Int, type: LeaveType): ValidationResult {
        return if (requested > available) {
            ValidationResult.Error("Insufficient balance. Available: $available days, Requested: $requested days.")
        } else {
            ValidationResult.Success
        }
    }

    /**
     * Validate EL carry-forward cap
     */
    fun validateELCarryForwardCap(totalAfterRequest: Int): ValidationResult {
        return if (totalAfterRequest > EL_CARRY_FORWARD_CAP) {
            ValidationResult.Error("EL carry-forward cap exceeded. Maximum $EL_CARRY_FORWARD_CAP days allowed.")
        } else {
            ValidationResult.Success
        }
    }

    /**
     * Validate annual cap
     */
    fun validateAnnualCap(usedThisYear: Int, requested: Int, type: LeaveType): ValidationResult {
        val cap = when (type) {
            LeaveType.CASUAL -> CL_PER_YEAR
            LeaveType.MEDICAL -> ML_PER_YEAR
            else -> Int.MAX_VALUE
        }
        val total = usedThisYear + requested
        return if (total > cap) {
            ValidationResult.Error("Annual cap exceeded. Limit: $cap days/year, Already used: $usedThisYear, Requested: $requested")
        } else {
            ValidationResult.Success
        }
    }

    private fun dateToString(date: Date): String {
        val calendar = Calendar.getInstance().apply { time = date }
        return "${calendar.get(Calendar.YEAR)}-${calendar.get(Calendar.MONTH)}-${calendar.get(Calendar.DAY_OF_MONTH)}"
    }
}

sealed class ValidationResult {
    object Success : ValidationResult()
    data class Error(val message: String) : ValidationResult()
}

