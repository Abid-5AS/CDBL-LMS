package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.WorkflowPoliciesResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface WorkflowService {
    @GET("admin/workflows")
    suspend fun getWorkflowPolicies(
        @Header("Authorization") token: String
    ): Response<WorkflowPoliciesResponse>
}
