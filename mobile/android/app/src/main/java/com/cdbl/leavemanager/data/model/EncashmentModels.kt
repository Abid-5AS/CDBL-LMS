package com.cdbl.leavemanager.data.model

data class EncashmentRequest(
    val id: Int,
    val userId: Int,
    val year: Int,
    val daysRequested: Int,
    val balanceAtRequest: Int,
    val reason: String?,
    val status: String, // PENDING, APPROVED, REJECTED, PAID
    val rejectionReason: String?,
    val paymentStatus: String?,
    val createdAt: String
)

data class EncashmentListResponse(
    val requests: List<EncashmentRequest>
)

data class CreateEncashmentRequest(
    val daysRequested: Int,
    val reason: String?
)

data class CreateEncashmentResponse(
    val ok: Boolean,
    val request: EncashmentRequest?,
    val error: String?
)
