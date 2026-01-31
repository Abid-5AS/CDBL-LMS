package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.local.dao.LeaveDao
import com.cdbl.leavemanager.data.local.entity.LeaveRequestEntity
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map

import com.cdbl.leavemanager.data.api.LeaveService
import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.data.local.CacheManager
import com.google.gson.reflect.TypeToken
import javax.inject.Inject
import javax.inject.Singleton
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.MultipartBody
import java.io.File

@Singleton
class LeaveRepository @Inject constructor(
    private val leaveService: LeaveService,
    private val leaveDao: LeaveDao,
    private val cacheManager: CacheManager,
    @dagger.hilt.android.qualifiers.ApplicationContext private val context: android.content.Context
) {
    // Expose a Flow that combines server data (cached in DB) and offline requests
    fun getMyLeavesFlow(token: String): kotlinx.coroutines.flow.Flow<List<LeaveRequest>> {
        return kotlinx.coroutines.flow.combine(
            leaveDao.getAllLeaves(),
            leaveDao.getOfflineRequests()
        ) { serverLeaves, offlineRequests ->
            val mappedServerLeaves = serverLeaves.map { it.toDomainModel() }
            val mappedOfflineLeaves = offlineRequests.map { it.toDomainModel() }
            mappedOfflineLeaves + mappedServerLeaves
        }
    }

    // Trigger a refresh from the server
    suspend fun syncLeaves(token: String): Result<Unit> {
        return try {
            val response = leaveService.getLeaves("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                val remoteLeaves = response.body()!!.items
                val entities = remoteLeaves.map { it.toEntity() }
                leaveDao.clearLeaves() // Simple strategy: Replace all
                leaveDao.insertLeaves(entities)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to fetch leaves: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Helper Mappers (extensions)
    private fun LeaveRequestEntity.toDomainModel(): LeaveRequest {
        return LeaveRequest(
            id = this.id,
            type = this.type,
            startDate = this.startDate,
            endDate = this.endDate,
            reason = this.reason,
            status = this.status,
            workingDays = this.days,
            rejectionReason = this.rejectionReason,
            createdAt = this.createdAt,
            requesterId = 0, // Not stored
            updatedAt = "", // Not stored
            employeeName = "", // Not stored for self
            managerName = ""
        )
    }

    private fun com.cdbl.leavemanager.data.local.entity.OfflineLeaveRequestEntity.toDomainModel(): LeaveRequest {
        return LeaveRequest(
            id = this.id.toInt() * -1, // Negative ID for offline items
            type = this.type,
            startDate = this.startDate,
            endDate = this.endDate,
            reason = this.reason,
            status = this.status, // "SYNC_PENDING" or "SYNC_FAILED"
            workingDays = null,
            rejectionReason = this.errorMessage,
            createdAt = java.time.format.DateTimeFormatter.ISO_INSTANT.format(java.time.Instant.ofEpochMilli(this.createdAt)),
            requesterId = 0,
            updatedAt = "",
            employeeName = "Me",
            managerName = "Pending Sync"
        )
    }

    private fun LeaveRequest.toEntity(): LeaveRequestEntity {
        return LeaveRequestEntity(
            id = this.id,
            type = this.type,
            startDate = this.startDate,
            endDate = this.endDate,
            reason = this.reason,
            status = this.status,
            days = this.workingDays,
            rejectionReason = this.rejectionReason,
            createdAt = this.createdAt
        )
    }
    
    // Original methods for details and others can remain or be updated
    suspend fun getRecentLeaves(token: String): Result<List<LeaveRequest>> {
        // ... (can use DB or cache)
         return try {
            val response = leaveService.getLeaves("Bearer $token", limit = 3)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else {
                Result.failure(Exception("Failed to fetch recent leaves: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun applyLeave(token: String, request: com.cdbl.leavemanager.data.model.ApplyLeaveRequest, file: File? = null): Result<Unit> {
        return try {
            val response = if (file != null) {
                val typePart = request.type.toRequestBody("text/plain".toMediaTypeOrNull())
                val startPart = request.startDate.toRequestBody("text/plain".toMediaTypeOrNull())
                val endPart = request.endDate.toRequestBody("text/plain".toMediaTypeOrNull())
                val reasonPart = request.reason.toRequestBody("text/plain".toMediaTypeOrNull())
                val needsCertificatePart = request.needsCertificate?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
                val incidentDatePart = request.incidentDate?.toRequestBody("text/plain".toMediaTypeOrNull())
                val isHalfDayPart = request.isHalfDay?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
                val halfDayPeriodPart = request.halfDayPeriod?.toRequestBody("text/plain".toMediaTypeOrNull())

                val fileReq = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
                val filePart = MultipartBody.Part.createFormData("certificate", file.name, fileReq)

                leaveService.createLeaveMultipart(
                    "Bearer $token",
                    typePart,
                    startPart,
                    endPart,
                    reasonPart,
                    needsCertificatePart,
                    incidentDatePart,
                    isHalfDayPart,
                    halfDayPeriodPart,
                    filePart
                )
            } else {
                leaveService.createLeave("Bearer $token", request)
            }
             
            if (response.isSuccessful) {
                syncLeaves(token) // Refresh list on success
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to create leave"))
            }
        } catch (e: Exception) {
            // Offline fallback: Save to DB
            val offlineRequest = com.cdbl.leavemanager.data.local.entity.OfflineLeaveRequestEntity(
                type = request.type,
                startDate = request.startDate,
                endDate = request.endDate,
                reason = request.reason
            )
            leaveDao.insertOfflineRequest(offlineRequest)
            
            // Schedule Sync
            val constraints = androidx.work.Constraints.Builder()
                .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                .build()
                
            val syncRequest = androidx.work.OneTimeWorkRequest.Builder(com.cdbl.leavemanager.workers.SyncLeaveWorker::class.java)
                .setConstraints(constraints)
                .setInputData(androidx.work.workDataOf("auth_token" to token)) // Pass token
                .build()
                
            androidx.work.WorkManager.getInstance(context).enqueueUniqueWork(
                "SyncLeaves",
                androidx.work.ExistingWorkPolicy.APPEND_OR_REPLACE,
                syncRequest
            )
            
            Result.success(Unit) // Return success to UI, but it's actually offline queued
        }
    }

    suspend fun getLeaveDetails(token: String, id: Int): Result<LeaveRequest> {
        return try {
            val response = leaveService.getLeaveDetails("Bearer $token", id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch details"))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }

    suspend fun getComments(token: String, id: Int): Result<List<com.cdbl.leavemanager.data.model.LeaveComment>> {
        return try {
            val response = leaveService.getComments("Bearer $token", id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else {
                Result.failure(Exception("Failed to fetch comments"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadCertificate(
        token: String,
        leaveId: Int,
        certificateType: String,
        file: File
    ): Result<Unit> {
        return try {
            val typePart = certificateType.toRequestBody("text/plain".toMediaTypeOrNull())
            val fileReq = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
            val filePart = MultipartBody.Part.createFormData("certificate", file.name, fileReq)
            val response = leaveService.uploadCertificate("Bearer $token", leaveId, typePart, filePart)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to upload certificate"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resubmitLeave(
        token: String,
        leaveId: Int,
        request: com.cdbl.leavemanager.data.model.ApplyLeaveRequest,
        file: File? = null
    ): Result<Unit> {
        return try {
            val response = if (file != null) {
                val typePart = request.type.toRequestBody("text/plain".toMediaTypeOrNull())
                val startPart = request.startDate.toRequestBody("text/plain".toMediaTypeOrNull())
                val endPart = request.endDate.toRequestBody("text/plain".toMediaTypeOrNull())
                val reasonPart = request.reason.toRequestBody("text/plain".toMediaTypeOrNull())
                val needsCertificatePart = request.needsCertificate?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
                val fileReq = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
                val filePart = MultipartBody.Part.createFormData("certificate", file.name, fileReq)

                leaveService.resubmitLeaveMultipart(
                    "Bearer $token",
                    leaveId,
                    typePart,
                    startPart,
                    endPart,
                    reasonPart,
                    needsCertificatePart,
                    filePart
                )
            } else {
                leaveService.resubmitLeave("Bearer $token", leaveId, request)
            }

            if (response.isSuccessful) {
                syncLeaves(token)
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to resubmit leave"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getManagerPendingLeaves(token: String): Result<com.cdbl.leavemanager.data.model.ManagerLeaveResponse> {
        return try {
            val response = leaveService.getManagerPendingLeaves("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch pending leaves: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Cancel Leave - PATCH /leaves/{id}
    // PENDING/SUBMITTED: immediate cancellation → CANCELLED
    // APPROVED: request cancellation → CANCELLATION_REQUESTED (needs HR approval)
    // Both full and partial cancel now use the same endpoint
    suspend fun cancelLeave(token: String, leaveId: Int, reason: String): Result<com.cdbl.leavemanager.data.api.CancelLeaveResponse> {
        return try {
            val request = com.cdbl.leavemanager.data.api.CancelLeaveRequest(reason)
            val response = leaveService.cancelLeave("Bearer $token", leaveId, request)
            if (response.isSuccessful && response.body()?.ok == true) {
                syncLeaves(token) // Refresh leaves after cancel
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.body()?.error ?: response.body()?.message ?: "Failed to cancel leave"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
