package com.abid.cdbl_lms.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.abid.cdbl_lms.data.local.converter.DateConverter
import com.abid.cdbl_lms.data.local.converter.LeaveTypeConverter
import com.abid.cdbl_lms.data.local.converter.LeaveStatusConverter
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.model.LeaveStatus
import java.util.Date

@Entity(tableName = "leave_requests")
@TypeConverters(DateConverter::class, LeaveTypeConverter::class, LeaveStatusConverter::class)
data class LeaveRequestEntity(
    @PrimaryKey
    val id: String,
    val type: LeaveType,
    val startDate: Date,
    val endDate: Date,
    val workingDays: Int,
    val reason: String,
    val status: LeaveStatus,
    val needsCertificate: Boolean,
    val certificateUrl: String?,
    val fitnessCertificateUrl: String?,
    val createdAt: Date,
    val updatedAt: Date,
    val policyVersion: String,
    val isSynced: Boolean,
    val syncError: String?,
    val balanceSnapshot: String?  // JSON string of balance at request time
)

