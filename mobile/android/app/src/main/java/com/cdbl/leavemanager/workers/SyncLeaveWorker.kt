package com.cdbl.leavemanager.workers

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.cdbl.leavemanager.data.local.dao.LeaveDao
import com.cdbl.leavemanager.data.api.LeaveService
import com.cdbl.leavemanager.data.model.ApplyLeaveRequest
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@HiltWorker
class SyncLeaveWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val leaveDao: LeaveDao,
    private val leaveService: LeaveService
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val pendingRequests = leaveDao.getPendingSyncRequests()
            if (pendingRequests.isEmpty()) return@withContext Result.success()

            // We need a token. In a real app, use EncryptedSharedPreferences or verify Session
            // For now, we assume the worker is triggered only when we have a valid session in memory or passed as input data
            // But WorkManager can run anytime. A robust solution needs TokenManager.
            // Simplified: Retrieve token from inputData or SharedPreferences
            val token = inputData.getString("auth_token") ?: return@withContext Result.failure()

            pendingRequests.forEach { request ->
                try {
                    val apiRequest = ApplyLeaveRequest(
                        leaveType = request.type,
                        startDate = request.startDate,
                        endDate = request.endDate,
                        reason = request.reason
                    )
                    
                    val response = leaveService.createLeave("Bearer $token", apiRequest)
                    if (response.isSuccessful) {
                        // Success: Delete local offline request
                        leaveDao.deleteOfflineRequest(request.id)
                    } else {
                        // Failure: Update status to SYNC_FAILED
                        leaveDao.updateOfflineRequestStatus(
                            request.id, 
                            "SYNC_FAILED", 
                            response.errorBody()?.string() ?: "Unknown error"
                        )
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    // Keep as PENDING for retry
                }
            }
            
            // Refresh leaves after sync attempts
            try {
                 val refreshResponse = leaveService.getLeaves("Bearer $token")
                 if (refreshResponse.isSuccessful && refreshResponse.body() != null) {
                    // Update main cache
                    // This creates a circular dependency if we use Repository. 
                    // Better to just let the next UI load handle it or replicate logic.
                    // Ideally, Worker uses UseCase or Repository. For simplicity, we skip refresh here
                    // or inject Repository lazily.
                 }
            } catch (e: Exception) {}

            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
