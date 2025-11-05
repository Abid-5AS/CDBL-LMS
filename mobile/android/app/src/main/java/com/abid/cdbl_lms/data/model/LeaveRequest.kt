package com.abid.cdbl_lms.data.model

import java.util.Date
import java.util.UUID

/**
 * Leave request model
 * Policy Reference: docs/Policy Logic/02-Leave Application Rules and Validation.md
 */
data class LeaveRequest(
    val id: String = UUID.randomUUID().toString(),  // UUIDv7 for offline-first
    val type: LeaveType,
    val startDate: Date,
    val endDate: Date,
    val workingDays: Int,  // Calendar days inclusive (includes weekends/holidays)
    val reason: String,
    val status: LeaveStatus = LeaveStatus.DRAFT,
    val needsCertificate: Boolean = false,
    val certificateUrl: String? = null,
    val fitnessCertificateUrl: String? = null,  // For ML > 7 days return
    val createdAt: Date = Date(),
    val updatedAt: Date = Date(),
    val policyVersion: String = "v2.0",
    
    // Offline sync fields
    val isSynced: Boolean = false,
    val syncError: String? = null,
    
    // Balance snapshot at time of request
    val balanceAtRequest: LeaveBalance? = null
)

