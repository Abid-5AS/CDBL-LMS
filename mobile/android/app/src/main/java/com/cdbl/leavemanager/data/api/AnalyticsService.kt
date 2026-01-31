package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.AnalyticsTrendResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

interface AnalyticsService {
    @GET("analytics/leave-trends")
    suspend fun getLeaveTrends(
        @Header("Authorization") token: String,
        @Query("period") period: String = "12m"
    ): Response<AnalyticsTrendResponse>
}
