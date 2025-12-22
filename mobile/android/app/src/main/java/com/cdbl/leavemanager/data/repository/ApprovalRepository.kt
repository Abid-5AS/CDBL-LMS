package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.ApprovalApiService
import com.cdbl.leavemanager.data.model.ApprovalItem
import com.cdbl.leavemanager.data.model.DecisionRequest
import com.cdbl.leavemanager.data.model.DecisionResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApprovalRepository @Inject constructor(
    private val approvalApiService: ApprovalApiService
) {
    suspend fun getPendingApprovals(token: String): Result<List<ApprovalItem>> {
        return try {
            val response = approvalApiService.getPendingApprovals("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else if (response.code() == 403) {
                 // Return empty list efficiently for unauthorized users but log validation needs
                 Result.success(emptyList()) 
            } else {
                Result.failure(Exception("Failed to fetch approvals: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitDecision(token: String, id: String, action: String, comment: String? = null): Result<DecisionResponse> {
        return try {
            val request = DecisionRequest(action, comment)
            val response = approvalApiService.submitDecision("Bearer $token", id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to submit decision: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
