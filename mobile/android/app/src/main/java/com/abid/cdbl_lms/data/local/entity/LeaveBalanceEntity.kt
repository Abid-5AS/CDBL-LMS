package com.abid.cdbl_lms.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.abid.cdbl_lms.data.local.converter.LeaveTypeConverter
import com.abid.cdbl_lms.data.model.LeaveType

@Entity(
    tableName = "leave_balances",
    primaryKeys = ["type", "year"]
)
@TypeConverters(LeaveTypeConverter::class)
data class LeaveBalanceEntity(
    val type: LeaveType,
    val year: Int,
    val opening: Int = 0,
    val accrued: Int = 0,
    val used: Int = 0,
    val closing: Int = 0
)

