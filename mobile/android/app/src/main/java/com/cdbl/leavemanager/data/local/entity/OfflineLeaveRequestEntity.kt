package com.cdbl.leavemanager.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "offline_leave_requests")
data class OfflineLeaveRequestEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: String,
    val startDate: String,
    val endDate: String,
    val reason: String,
    val createdAt: Long = System.currentTimeMillis(),
    val status: String = "SYNC_PENDING", // SYNC_PENDING, SYNC_FAILED
    val errorMessage: String? = null
)
