package com.cdbl.leavemanager.data.model

data class LoginRequest(
    val email: String,
    val password: String,
    val skipOtp: Boolean = true // For now, leveraging the skipOtp flow
)

data class LoginResponse(
    val success: Boolean,
    val data: LoginData?,
    val error: String?
)

data class LoginData(
    val user: User,
    val token: String,
    val refreshToken: String,
    val expiresIn: Int
)

data class User(
    val id: String,
    val email: String,
    val name: String?,
    val employeeId: String,
    val department: String,
    val role: String
)
