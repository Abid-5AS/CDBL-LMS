package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.ApprovalApiService
import com.cdbl.leavemanager.data.api.ApprovalHistoryResponse
import com.cdbl.leavemanager.data.api.LeaveService
import com.cdbl.leavemanager.data.model.ApprovalItem
import com.cdbl.leavemanager.data.model.DecisionRequest
import com.cdbl.leavemanager.data.model.DecisionResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApprovalRepository @Inject constructor(
    private val approvalApiService: ApprovalApiService,
    private val leaveService: LeaveService
) {
    suspend fun getPendingApprovals(token: String): Result<List<ApprovalItem>> {
        return try {
            val response = approvalApiService.getPendingApprovals("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else if (response.code() == 403) {
                 Result.success(emptyList()) 
            } else {
                Result.failure(Exception("Failed to fetch approvals: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getApprovalHistory(token: String, decision: String = "ALL"): Result<ApprovalHistoryResponse> {
        return try {
            val response = leaveService.getApprovalHistory("Bearer $token", decision)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else if (response.code() == 403) {
                 Result.success(ApprovalHistoryResponse(emptyList(), 1, 25)) 
            } else {
                Result.failure(Exception("Failed to fetch approval history: ${response.code()}"))
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

