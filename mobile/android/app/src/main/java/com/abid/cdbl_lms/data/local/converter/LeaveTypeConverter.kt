package com.abid.cdbl_lms.data.local.converter

import androidx.room.TypeConverter
import com.abid.cdbl_lms.data.model.LeaveType

class LeaveTypeConverter {
    @TypeConverter
    fun fromString(value: String): LeaveType {
        return LeaveType.valueOf(value)
    }

    @TypeConverter
    fun toString(type: LeaveType): String {
        return type.name
    }
}

