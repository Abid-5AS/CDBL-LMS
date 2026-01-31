package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.ApprovalListResponse
import com.cdbl.leavemanager.data.model.DecisionRequest
import com.cdbl.leavemanager.data.model.DecisionResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface ApprovalApiService {
    @GET("approvals")
    suspend fun getPendingApprovals(
        @Header("Authorization") token: String
    ): Response<ApprovalListResponse>

    @POST("approvals/{id}/decision")
    suspend fun submitDecision(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body request: DecisionRequest
    ): Response<DecisionResponse>
}
