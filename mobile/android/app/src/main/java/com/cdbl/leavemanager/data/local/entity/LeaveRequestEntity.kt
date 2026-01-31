package com.cdbl.leavemanager.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "leave_requests")
data class LeaveRequestEntity(
    @PrimaryKey
    val id: Int,
    val type: String,
    val startDate: String,
    val endDate: String,
    val reason: String?,
    val status: String,
    val days: Int?,
    val rejectionReason: String?,
    val createdAt: String
)
