package com.abid.cdbl_lms.data.model

/**
 * Leave balance model per year per type
 * Policy Reference: docs/Policy Logic/04-Leave Balance and Accrual Logic.md
 */
data class LeaveBalance(
    val type: LeaveType,
    val year: Int,
    val opening: Int = 0,      // Carry-forward (for EL)
    val accrued: Int = 0,      // Monthly accrual (e.g., 2 days/month for EL)
    val used: Int = 0,
    val closing: Int = 0       // Calculated: (opening + accrued) - used
) {
    val available: Int
        get() = (opening + accrued) - used
}

