package com.cdbl.leavemanager.data.model

data class AdminUserListResponse(
    val users: List<AdminUser>,
    val items: List<AdminUser> // Legacy support if needed, but we'll use users
)

data class AdminUser(
    val id: Int,
    val name: String,
    val email: String,
    val empCode: String? = null,
    val department: String? = null,
    val role: String,
    val createdAt: String? = null
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
    val user: AdminUser?,
    val error: String?
)

data class UpdateUserResponse(
    val item: AdminUser?,
    val error: String?
)
