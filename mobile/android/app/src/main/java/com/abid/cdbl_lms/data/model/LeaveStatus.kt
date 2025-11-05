package com.abid.cdbl_lms.data.model

/**
 * Leave status enum as per Policy v2.0
 * Source: docs/Policy Logic/06-Approval Workflow and Chain.md
 */
enum class LeaveStatus {
    DRAFT,
    SUBMITTED,
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED,
    RETURNED,                  // Returned for modification
    CANCELLATION_REQUESTED,    // Employee requested cancellation of approved leave
    RECALLED,                  // Recalled from leave
    OVERSTAY_PENDING          // Overstay detected
}

