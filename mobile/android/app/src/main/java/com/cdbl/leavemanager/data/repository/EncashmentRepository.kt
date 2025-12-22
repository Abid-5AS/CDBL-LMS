package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.EncashmentService
import com.cdbl.leavemanager.data.model.CreateEncashmentRequest
import com.cdbl.leavemanager.data.model.EncashmentRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EncashmentRepository @Inject constructor(
    private val encashmentService: EncashmentService
) {
    suspend fun getEncashmentRequests(token: String): Result<List<EncashmentRequest>> {
        return try {
            val response = encashmentService.getEncashmentRequests("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.requests)
            } else {
                Result.failure(Exception("Failed to fetch requests: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestEncashment(token: String, days: Int, reason: String?): Result<EncashmentRequest> {
        return try {
            val request = CreateEncashmentRequest(days, reason)
            val response = encashmentService.requestEncashment("Bearer $token", request)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.ok && body.request != null) {
                    Result.success(body.request)
                } else {
                    Result.failure(Exception(body.error ?: "Unknown error"))
                }
            } else {
                Result.failure(Exception("Failed to submit request: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
