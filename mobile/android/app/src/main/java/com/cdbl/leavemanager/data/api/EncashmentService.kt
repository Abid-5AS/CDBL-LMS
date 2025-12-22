package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.CreateEncashmentRequest
import com.cdbl.leavemanager.data.model.CreateEncashmentResponse
import com.cdbl.leavemanager.data.model.EncashmentListResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface EncashmentService {
    @GET("api/encashment")
    suspend fun getEncashmentRequests(
        @Header("Authorization") token: String
    ): Response<EncashmentListResponse>

    @POST("api/encashment")
    suspend fun requestEncashment(
        @Header("Authorization") token: String,
        @Body request: CreateEncashmentRequest
    ): Response<CreateEncashmentResponse>
}
