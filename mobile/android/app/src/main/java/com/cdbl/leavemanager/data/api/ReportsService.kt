package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.ReportsResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

interface ReportsService {
    @GET("reports")
    suspend fun getReports(
        @Header("Authorization") token: String,
        @Query("isActive") isActive: Boolean? = null
    ): Response<ReportsResponse>
}
