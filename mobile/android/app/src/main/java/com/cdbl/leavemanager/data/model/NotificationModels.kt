package com.cdbl.leavemanager.data.model

data class NotificationsResponse(
    val notifications: List<NotificationItem> = emptyList(),
    val unreadCount: Int = 0,
    val total: Int = 0
)

data class NotificationItem(
    val id: Int,
    val type: String,
    val title: String,
    val message: String,
    val link: String? = null,
    val leaveId: Int? = null,
    val read: Boolean = false,
    val readAt: String? = null,
    val createdAt: String,
    val expiresAt: String? = null
)
