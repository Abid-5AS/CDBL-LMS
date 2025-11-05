package com.abid.cdbl_lms.data.local.converter

import androidx.room.TypeConverter
import com.abid.cdbl_lms.data.model.LeaveStatus

class LeaveStatusConverter {
    @TypeConverter
    fun fromString(value: String): LeaveStatus {
        return LeaveStatus.valueOf(value)
    }

    @TypeConverter
    fun toString(status: LeaveStatus): String {
        return status.name
    }
}

