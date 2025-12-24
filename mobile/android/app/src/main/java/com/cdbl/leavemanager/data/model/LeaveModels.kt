package com.cdbl.leavemanager.data.model

data class LeaveListResponse(
    val items: List<LeaveRequest>,
    val nextCursor: Int?
)

data class LeaveRequest(
    val id: Int,
    val requesterId: Int,
    val type: String,
    val startDate: String,
    val endDate: String,
    val workingDays: Int?,
    val reason: String?,
    val status: String,
    val createdAt: String,
    val updatedAt: String,
    val rejectionReason: String? = null,
    val employeeName: String? = null,
    val managerName: String? = null
)

data class ApplyLeaveRequest(
    val type: String,
    val startDate: String,
    val endDate: String,
    val reason: String
)

data class CreateLeaveResponse(
    val ok: Boolean,
    val id: Int?, // Optional ID
    val warnings: List<String>? = null,
    val error: String? = null
)

data class LeaveComment(
    val id: Int,
    val comment: String,
    val authorRole: String,
    val authorName: String,
    val createdAt: String
)

data class LeaveCommentListResponse(
    val items: List<LeaveComment>
)

data class ManagerLeaveResponse(
    val rows: List<LeaveRequest>,
    val counts: ManagerCounts,
    val total: Int
)

data class ManagerCounts(
    val pending: Int,
    val forwarded: Int,
    val returned: Int,
    val cancelled: Int
)
