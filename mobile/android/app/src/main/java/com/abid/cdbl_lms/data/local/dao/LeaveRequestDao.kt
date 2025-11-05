package com.abid.cdbl_lms.data.local.dao

import androidx.room.*
import com.abid.cdbl_lms.data.local.entity.LeaveRequestEntity
import com.abid.cdbl_lms.data.model.LeaveStatus
import com.abid.cdbl_lms.data.model.LeaveType
import kotlinx.coroutines.flow.Flow
import java.util.Date

@Dao
interface LeaveRequestDao {
    @Query("SELECT * FROM leave_requests ORDER BY createdAt DESC")
    fun getAllLeaves(): Flow<List<LeaveRequestEntity>>

    @Query("SELECT * FROM leave_requests WHERE id = :id")
    suspend fun getLeaveById(id: String): LeaveRequestEntity?

    @Query("SELECT * FROM leave_requests WHERE status IN (:statuses) ORDER BY createdAt DESC")
    fun getLeavesByStatus(statuses: List<LeaveStatus>): Flow<List<LeaveRequestEntity>>

    @Query("SELECT * FROM leave_requests WHERE type = :type ORDER BY createdAt DESC")
    fun getLeavesByType(type: LeaveType): Flow<List<LeaveRequestEntity>>

    @Query("SELECT * FROM leave_requests WHERE isSynced = 0 ORDER BY createdAt ASC")
    fun getUnsyncedLeaves(): Flow<List<LeaveRequestEntity>>

    @Query("SELECT * FROM leave_requests WHERE startDate >= :startDate AND endDate <= :endDate ORDER BY startDate ASC")
    fun getLeavesByDateRange(startDate: Date, endDate: Date): Flow<List<LeaveRequestEntity>>

    @Query("SELECT * FROM leave_requests WHERE status IN ('APPROVED', 'PENDING') AND startDate <= :date AND endDate >= :date")
    suspend fun getActiveLeaveOnDate(date: Date): LeaveRequestEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLeave(leave: LeaveRequestEntity)

    @Update
    suspend fun updateLeave(leave: LeaveRequestEntity)

    @Delete
    suspend fun deleteLeave(leave: LeaveRequestEntity)

    @Query("DELETE FROM leave_requests WHERE id = :id")
    suspend fun deleteLeaveById(id: String)
}

