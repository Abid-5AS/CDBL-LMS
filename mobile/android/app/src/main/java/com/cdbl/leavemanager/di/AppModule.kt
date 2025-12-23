package com.cdbl.leavemanager.di

import android.content.Context
import androidx.room.Room
import com.cdbl.leavemanager.data.local.AppDatabase
import com.cdbl.leavemanager.data.local.dao.LeaveDao
import com.cdbl.leavemanager.data.local.dao.UserDao
import com.cdbl.leavemanager.data.local.dao.PolicyDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "cdbl_leave_manager.db"
        ).fallbackToDestructiveMigration()
         .build()
    }

    @Provides
    @Singleton
    fun provideLeaveDao(database: AppDatabase): LeaveDao {
        return database.leaveDao()
    }

    @Provides
    @Singleton
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }

    @Provides
    @Singleton
    fun providePolicyDao(database: AppDatabase): PolicyDao {
        return database.policyDao()
    }
}
