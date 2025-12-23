package com.cdbl.leavemanager.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.cdbl.leavemanager.data.local.entity.LeaveRequestEntity
import com.cdbl.leavemanager.data.local.entity.OfflineLeaveRequestEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LeaveDao {
    // Cache Operations
    @Query("SELECT * FROM leave_requests ORDER BY createdAt DESC")
    fun getAllLeaves(): Flow<List<LeaveRequestEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLeaves(leaves: List<LeaveRequestEntity>)

    @Query("DELETE FROM leave_requests")
    suspend fun clearLeaves()

    // Offline Operations
    @Query("SELECT * FROM offline_leave_requests ORDER BY createdAt DESC")
    fun getOfflineRequests(): Flow<List<OfflineLeaveRequestEntity>>

    @Query("SELECT * FROM offline_leave_requests WHERE status = 'SYNC_PENDING'")
    suspend fun getPendingSyncRequests(): List<OfflineLeaveRequestEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOfflineRequest(request: OfflineLeaveRequestEntity)

    @Query("DELETE FROM offline_leave_requests WHERE id = :id")
    suspend fun deleteOfflineRequest(id: Long)
    
    @Query("UPDATE offline_leave_requests SET status = :status, errorMessage = :error WHERE id = :id")
    suspend fun updateOfflineRequestStatus(id: Long, status: String, error: String?)
}
