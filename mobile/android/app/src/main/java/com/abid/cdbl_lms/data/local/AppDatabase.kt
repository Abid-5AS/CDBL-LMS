package com.abid.cdbl_lms.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.abid.cdbl_lms.data.local.converter.DateConverter
import com.abid.cdbl_lms.data.local.converter.LeaveStatusConverter
import com.abid.cdbl_lms.data.local.converter.LeaveTypeConverter
import com.abid.cdbl_lms.data.local.dao.LeaveBalanceDao
import com.abid.cdbl_lms.data.local.dao.LeaveRequestDao
import com.abid.cdbl_lms.data.local.entity.LeaveBalanceEntity
import com.abid.cdbl_lms.data.local.entity.LeaveRequestEntity

@Database(
    entities = [LeaveRequestEntity::class, LeaveBalanceEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(
    DateConverter::class,
    LeaveTypeConverter::class,
    LeaveStatusConverter::class
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun leaveRequestDao(): LeaveRequestDao
    abstract fun leaveBalanceDao(): LeaveBalanceDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "cdbl_lms_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

