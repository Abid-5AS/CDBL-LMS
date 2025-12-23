package com.cdbl.leavemanager.data.model

data class LoginRequest(
    val email: String,
    val password: String,
    val skipOtp: Boolean = false
)

data class LoginResponse(
    val success: Boolean,
    val data: LoginData?,
    val error: String?
)

data class LoginData(
    val user: User?,
    val token: String?,
    val refreshToken: String?,
    val expiresIn: Int?,
    val requiresOtp: Boolean = false,
    val message: String?
)

data class VerifyOtpRequest(
    val email: String,
    val code: String
)

data class User(
    val id: String,
    val email: String,
    val name: String?,
    val employeeId: String,
    val department: String,
    val role: String
)
