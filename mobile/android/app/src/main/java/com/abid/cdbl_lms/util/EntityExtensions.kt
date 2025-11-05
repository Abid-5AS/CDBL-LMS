package com.abid.cdbl_lms.util

import com.abid.cdbl_lms.data.local.entity.LeaveBalanceEntity
import com.abid.cdbl_lms.data.local.entity.LeaveRequestEntity
import com.abid.cdbl_lms.data.model.LeaveBalance
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.google.gson.Gson

private val gson = Gson()

fun LeaveRequest.toEntity(): LeaveRequestEntity {
    return LeaveRequestEntity(
        id = id,
        type = type,
        startDate = startDate,
        endDate = endDate,
        workingDays = workingDays,
        reason = reason,
        status = status,
        needsCertificate = needsCertificate,
        certificateUrl = certificateUrl,
        fitnessCertificateUrl = fitnessCertificateUrl,
        createdAt = createdAt,
        updatedAt = updatedAt,
        policyVersion = policyVersion,
        isSynced = isSynced,
        syncError = syncError,
        balanceSnapshot = balanceAtRequest?.let { gson.toJson(it) }
    )
}

fun LeaveRequestEntity.toModel(): LeaveRequest {
    return LeaveRequest(
        id = id,
        type = type,
        startDate = startDate,
        endDate = endDate,
        workingDays = workingDays,
        reason = reason,
        status = status,
        needsCertificate = needsCertificate,
        certificateUrl = certificateUrl,
        fitnessCertificateUrl = fitnessCertificateUrl,
        createdAt = createdAt,
        updatedAt = updatedAt,
        policyVersion = policyVersion,
        isSynced = isSynced,
        syncError = syncError,
        balanceAtRequest = balanceSnapshot?.let { gson.fromJson(it, LeaveBalance::class.java) }
    )
}

fun LeaveBalance.toEntity(): LeaveBalanceEntity {
    return LeaveBalanceEntity(
        type = type,
        year = year,
        opening = opening,
        accrued = accrued,
        used = used,
        closing = closing
    )
}

fun LeaveBalanceEntity.toModel(): LeaveBalance {
    return LeaveBalance(
        type = type,
        year = year,
        opening = opening,
        accrued = accrued,
        used = used,
        closing = closing
    )
}

