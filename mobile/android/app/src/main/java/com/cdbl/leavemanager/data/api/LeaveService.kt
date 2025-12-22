package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.LeaveListResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

interface LeaveService {
    @GET("leaves")
    suspend fun getLeaves(
        @Header("Authorization") token: String,
        @Query("mine") mine: String = "1",
        @Query("limit") limit: Int = 50
    ): Response<LeaveListResponse>

    @POST("leaves")
    suspend fun createLeave(
        @Header("Authorization") token: String,
        @Body request: com.cdbl.leavemanager.data.model.ApplyLeaveRequest
    ): Response<com.cdbl.leavemanager.data.model.CreateLeaveResponse>

    @GET("leaves/{id}")
    suspend fun getLeaveDetails(
        @Header("Authorization") token: String,
        @retrofit2.http.Path("id") id: Int
    ): Response<com.cdbl.leavemanager.data.model.LeaveRequest> // Reusing LeaveRequest for detailed view

    @GET("leaves/{id}/comments")
    suspend fun getComments(
        @Header("Authorization") token: String,
        @retrofit2.http.Path("id") id: Int
    ): Response<com.cdbl.leavemanager.data.model.LeaveCommentListResponse>
}
