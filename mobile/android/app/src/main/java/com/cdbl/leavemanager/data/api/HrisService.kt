package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.HrisSyncResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface HrisService {
    @GET("hris/sync")
    suspend fun getSyncHistory(@Header("Authorization") token: String): Response<HrisSyncResponse>
}
