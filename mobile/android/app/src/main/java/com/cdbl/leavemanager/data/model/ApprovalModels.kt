package com.cdbl.leavemanager.data.model

data class ApprovalListResponse(
    val items: List<ApprovalItem>
)

data class ApprovalItem(
    val id: String, // leaveId
    val type: String,
    val startDate: String,
    val endDate: String,
    val workingDays: Int?,
    val reason: String?,
    val requestedByName: String,
    val requestedByEmail: String,
    val status: String
)

data class DecisionRequest(
    val action: String, // "approve" or "reject"
    val comment: String? = null
)

data class DecisionResponse(
    val ok: Boolean,
    val status: String?,
    val error: String?
)
