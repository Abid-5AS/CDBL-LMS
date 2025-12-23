package com.cdbl.leavemanager.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.cdbl.leavemanager.data.local.dao.UserDao
import com.cdbl.leavemanager.data.local.dao.PolicyDao
import com.cdbl.leavemanager.data.local.entity.UserEntity
import com.cdbl.leavemanager.data.local.entity.PolicyEntity
import com.cdbl.leavemanager.data.local.entity.PolicyTypeConverters

@Database(
    entities = [
        LeaveRequestEntity::class, 
        OfflineLeaveRequestEntity::class,
        UserEntity::class,
        PolicyEntity::class
    ],
    version = 2,
    exportSchema = false
)
@TypeConverters(PolicyTypeConverters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun leaveDao(): LeaveDao
    abstract fun userDao(): UserDao
    abstract fun policyDao(): PolicyDao
}
