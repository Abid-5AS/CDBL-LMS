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

                val fileReq = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
                val filePart = MultipartBody.Part.createFormData("file", file.name, fileReq) // "file" is the field name on server? Checking ApplyLeaveForm.tsx: formData.append('file', file)

                leaveService.createLeaveMultipart("Bearer $token", typePart, startPart, endPart, reasonPart, filePart)
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
                type = request.leaveType,
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
}
