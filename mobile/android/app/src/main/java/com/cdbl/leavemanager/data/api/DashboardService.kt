package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.BalanceResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface DashboardService {
    @GET("balance/mine")
    suspend fun getMyBalance(@Header("Authorization") token: String): Response<BalanceResponse>
}
