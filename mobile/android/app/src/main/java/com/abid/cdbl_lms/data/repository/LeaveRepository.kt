package com.abid.cdbl_lms.data.repository

import com.abid.cdbl_lms.data.local.AppDatabase
import com.abid.cdbl_lms.data.local.entity.LeaveRequestEntity
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.abid.cdbl_lms.data.model.LeaveStatus
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.util.toEntity
import com.abid.cdbl_lms.util.toModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.Date

class LeaveRepository(
    private val database: AppDatabase
) {
    private val leaveDao = database.leaveRequestDao()

    fun getAllLeaves(): Flow<List<LeaveRequest>> {
        return leaveDao.getAllLeaves().map { entities ->
            entities.map { it.toModel() }
        }
    }

    suspend fun getLeaveById(id: String): LeaveRequest? {
        return leaveDao.getLeaveById(id)?.toModel()
    }

    fun getLeavesByStatus(statuses: List<LeaveStatus>): Flow<List<LeaveRequest>> {
        return leaveDao.getLeavesByStatus(statuses).map { entities ->
            entities.map { it.toModel() }
        }
    }

    fun getLeavesByType(type: LeaveType): Flow<List<LeaveRequest>> {
        return leaveDao.getLeavesByType(type).map { entities ->
            entities.map { it.toModel() }
        }
    }

    fun getUnsyncedLeaves(): Flow<List<LeaveRequest>> {
        return leaveDao.getUnsyncedLeaves().map { entities ->
            entities.map { it.toModel() }
        }
    }

    fun getLeavesByDateRange(startDate: Date, endDate: Date): Flow<List<LeaveRequest>> {
        return leaveDao.getLeavesByDateRange(startDate, endDate).map { entities ->
            entities.map { it.toModel() }
        }
    }

    suspend fun insertLeave(leave: LeaveRequest) {
        leaveDao.insertLeave(leave.toEntity())
    }

    suspend fun updateLeave(leave: LeaveRequest) {
        leaveDao.updateLeave(leave.toEntity())
    }

    suspend fun deleteLeave(leave: LeaveRequest) {
        leaveDao.deleteLeave(leave.toEntity())
    }

    suspend fun markAsSynced(leaveId: String) {
        val leave = leaveDao.getLeaveById(leaveId) ?: return
        leaveDao.updateLeave(leave.copy(isSynced = true, syncError = null))
    }

    suspend fun markSyncError(leaveId: String, error: String) {
        val leave = leaveDao.getLeaveById(leaveId) ?: return
        leaveDao.updateLeave(leave.copy(syncError = error))
    }
}

