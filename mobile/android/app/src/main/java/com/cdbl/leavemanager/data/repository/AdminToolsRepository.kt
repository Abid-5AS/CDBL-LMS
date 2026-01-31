package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.HrisService
import com.cdbl.leavemanager.data.api.WebhookService
import com.cdbl.leavemanager.data.api.WorkflowService
import com.cdbl.leavemanager.data.model.HrisSyncEntry
import com.cdbl.leavemanager.data.model.WebhookEntry
import com.cdbl.leavemanager.data.model.WorkflowPoliciesResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdminToolsRepository @Inject constructor(
    private val workflowService: WorkflowService,
    private val hrisService: HrisService,
    private val webhookService: WebhookService
) {
    suspend fun getWorkflowPolicies(token: String): Result<WorkflowPoliciesResponse> {
        return try {
            val response = workflowService.getWorkflowPolicies("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch workflow policies: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHrisSyncs(token: String): Result<List<HrisSyncEntry>> {
        return try {
            val response = hrisService.getSyncHistory("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.syncs)
            } else {
                Result.failure(Exception("Failed to fetch HRIS syncs: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getWebhooks(token: String): Result<List<WebhookEntry>> {
        return try {
            val response = webhookService.getWebhooks("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch webhooks: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
