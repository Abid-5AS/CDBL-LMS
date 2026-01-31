package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.BalanceResponse
import com.cdbl.leavemanager.data.model.BalanceDetailResponse
import com.cdbl.leavemanager.data.model.TeamOnLeaveResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Body
import retrofit2.http.PATCH
import retrofit2.http.Path

interface DashboardService {
    @GET("balance/mine")
    suspend fun getMyBalance(@Header("Authorization") token: String): Response<BalanceResponse>

    @GET("balance/mine")
    suspend fun getMyBalanceDetailed(
        @Header("Authorization") token: String,
        @retrofit2.http.Query("detailed") detailed: Boolean = true
    ): Response<BalanceDetailResponse>

    @GET("team/on-leave?scope=team")
    suspend fun getTeamOnLeave(@Header("Authorization") token: String): Response<TeamOnLeaveResponse>

    @GET("admin/system-stats")
    suspend fun getSystemStats(@Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.SystemStatsResponse>

    @GET("admin/logs")
    suspend fun getAuditLogs(@Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.AuditLogsResponse>

    @GET("dashboard/hr/stats")
    suspend fun getHRStats(@Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.HRAdminStats>

    @GET("dashboard/ceo/stats")
    suspend fun getCEOStats(@Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.CEOStats>

    @GET("dashboard/hr-head/stats")
    suspend fun getHRHeadStats(@Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.HRHeadStats>

    @GET("admin/users")
    suspend fun getUsers(@Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.AdminUserListResponse>

    @POST("admin/users/create")
    suspend fun createUser(
        @Header("Authorization") token: String,
        @Body request: com.cdbl.leavemanager.data.model.CreateUserRequest
    ): Response<com.cdbl.leavemanager.data.model.CreateUserResponse>

    @PATCH("admin/users/{id}")
    suspend fun updateUser(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body request: com.cdbl.leavemanager.data.model.UpdateUserRequest
    ): Response<com.cdbl.leavemanager.data.model.UpdateUserResponse>

    @GET("holidays")
    suspend fun getHolidays(@Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.HolidayResponse>
}
