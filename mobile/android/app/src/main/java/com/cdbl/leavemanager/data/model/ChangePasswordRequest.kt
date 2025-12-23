package com.cdbl.leavemanager.data.model

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)

data class ChangePasswordResponse(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null
)
