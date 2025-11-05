package com.abid.cdbl_lms.data.model

/**
 * Leave types as per Policy v2.0
 * Source: docs/Policy Logic/01-Leave Types and Entitlements.md
 */
enum class LeaveType {
    EARNED,          // Earned Leave (EL) - 24 days/year, accrues 2 days/month
    CASUAL,          // Casual Leave (CL) - 10 days/year, max 3 consecutive
    MEDICAL,         // Medical Leave (ML) - 14 days/year, certificate required if >3 days
    EXTRAWITHPAY,
    EXTRAWITHOUTPAY,
    MATERNITY,
    PATERNITY,
    STUDY,
    SPECIAL_DISABILITY,
    QUARANTINE
}

