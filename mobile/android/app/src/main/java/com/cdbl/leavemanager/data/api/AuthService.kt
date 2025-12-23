package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.LoginRequest
import com.cdbl.leavemanager.data.model.LoginResponse
import com.cdbl.leavemanager.data.model.VerifyOtpRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthService {
    @POST("auth/mobile-login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/mobile-verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<LoginResponse>

    @retrofit2.http.GET("auth/me")
    suspend fun getCurrentUser(@retrofit2.http.Header("Authorization") token: String): Response<com.cdbl.leavemanager.data.model.User>

    @retrofit2.http.POST("settings/change-password")
    suspend fun changePassword(
        @retrofit2.http.Header("Authorization") token: String,
        @retrofit2.http.Body request: com.cdbl.leavemanager.data.model.ChangePasswordRequest
    ): retrofit2.Response<com.cdbl.leavemanager.data.model.ChangePasswordResponse>

    @retrofit2.http.GET("user/profile")
    suspend fun getUserProfile(
        @retrofit2.http.Header("Authorization") token: String
    ): retrofit2.Response<com.cdbl.leavemanager.data.model.UserDetailsResponse>

    @retrofit2.http.PUT("user/profile")
    suspend fun updateProfile(
        @retrofit2.http.Header("Authorization") token: String,
        @retrofit2.http.Body request: com.cdbl.leavemanager.data.model.UpdateProfileRequest
    ): retrofit2.Response<Map<String, Any>>
}
