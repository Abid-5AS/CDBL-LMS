package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.LeaveListResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Multipart
import retrofit2.http.Part
import retrofit2.http.Path
import okhttp3.MultipartBody
import okhttp3.RequestBody

interface LeaveService {
    @GET("leaves")
    suspend fun getLeaves(
        @Header("Authorization") token: String,
        @Query("mine") mine: String = "1",
        @Query("limit") limit: Int = 50,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<LeaveListResponse>

    @POST("leaves")
    suspend fun createLeave(
        @Header("Authorization") token: String,
        @Body request: com.cdbl.leavemanager.data.model.ApplyLeaveRequest
    ): Response<com.cdbl.leavemanager.data.model.CreateLeaveResponse>

    @Multipart
    @POST("leaves")
    suspend fun createLeaveMultipart(
        @Header("Authorization") token: String,
        @Part("type") type: RequestBody,
        @Part("startDate") startDate: RequestBody,
        @Part("endDate") endDate: RequestBody,
        @Part("reason") reason: RequestBody,
        @Part file: MultipartBody.Part?
    ): Response<com.cdbl.leavemanager.data.model.CreateLeaveResponse>

    @GET("leaves/{id}")
    suspend fun getLeaveDetails(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<com.cdbl.leavemanager.data.model.LeaveRequest>

    @GET("leaves/{id}/comments")
    suspend fun getComments(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<com.cdbl.leavemanager.data.model.LeaveCommentListResponse>

    @POST("leaves/{id}/cancel")
    suspend fun cancelLeave(
        @Header("Authorization") token: String,
        @Path("id") id: Int,
        @Body reason: CancelLeaveRequest
    ): Response<CancelLeaveResponse>

    @GET("manager/pending")
    suspend fun getManagerPendingLeaves(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int = 20,
        @Query("offset") offset: Int = 0
    ): Response<com.cdbl.leavemanager.data.model.ManagerLeaveResponse>

    @GET("approvals/history")
    suspend fun getApprovalHistory(
        @Header("Authorization") token: String,
        @Query("decision") decision: String = "ALL",
        @Query("limit") limit: Int = 50,
        @Query("page") page: Int = 1
    ): Response<ApprovalHistoryResponse>
}

data class CancelLeaveRequest(
    val reason: String
)

data class CancelLeaveResponse(
    val ok: Boolean,
    val message: String? = null,
    val error: String? = null
)

data class ApprovalHistoryResponse(
    val items: List<ApprovalHistoryItem>,
    val page: Int,
    val pageSize: Int
)

data class ApprovalHistoryItem(
    val id: String,
    val type: String,
    val start: String,
    val end: String,
    val requestedDays: Int?,
    val reason: String?,
    val status: String,           // APPROVED, REJECTED, FORWARDED
    val requestedByName: String,
    val requestedByEmail: String
)

