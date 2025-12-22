package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.LeaveService
import com.cdbl.leavemanager.data.model.LeaveRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LeaveRepository @Inject constructor(
    private val leaveService: LeaveService
) {
    suspend fun getMyLeaves(token: String): Result<List<LeaveRequest>> {
        return try {
            val response = leaveService.getLeaves("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else {
                Result.failure(Exception("Failed to fetch leaves: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getRecentLeaves(token: String): Result<List<LeaveRequest>> {
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

    suspend fun applyLeave(token: String, request: com.cdbl.leavemanager.data.model.ApplyLeaveRequest): Result<com.cdbl.leavemanager.data.model.CreateLeaveResponse> {
        return try {
            val response = leaveService.createLeave("Bearer $token", request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to create leave"))
            }
        } catch (e: Exception) {
            Result.failure(e)
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
}
