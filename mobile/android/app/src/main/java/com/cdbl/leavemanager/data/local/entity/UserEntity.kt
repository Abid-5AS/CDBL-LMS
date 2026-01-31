package com.cdbl.leavemanager.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val email: String,
    val name: String?,
    val employeeId: String,
    val department: String,
    val role: String,
    val lastUpdated: Long = System.currentTimeMillis()
)
