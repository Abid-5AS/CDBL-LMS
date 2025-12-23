package com.cdbl.leavemanager.data.model

data class AdminUserListResponse(
    val users: List<User>,
    val items: List<User> // Legacy support if needed, but we'll use users
)

data class CreateUserRequest(
    val name: String,
    val email: String,
    val empCode: String,
    val department: String?,
    val role: String // EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN
)

data class UpdateUserRequest(
    val role: String?,
    val department: String?,
    val isActive: Boolean? = null // Optional, might be handled by separate endpoint
)

data class CreateUserResponse(
    val ok: Boolean,
    val user: User?,
    val error: String?
)

data class UpdateUserResponse(
    val item: User?,
    val error: String?
)
