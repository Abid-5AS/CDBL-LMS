package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.LoginRequest
import com.cdbl.leavemanager.data.model.LoginResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthService {
    @POST("auth/mobile-login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @retrofit2.http.GET("auth/me")
    suspend fun getCurrentUser(): Response<com.cdbl.leavemanager.data.model.User>
}
