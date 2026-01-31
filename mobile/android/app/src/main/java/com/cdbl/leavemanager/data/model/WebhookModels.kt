package com.cdbl.leavemanager.data.model

data class WebhookEntry(
    val id: Int,
    val url: String,
    val events: List<String> = emptyList(),
    val secret: String? = null,
    val isActive: Boolean = true,
    val createdAt: String,
    val _count: WebhookCount? = null
)

data class WebhookCount(
    val deliveries: Int = 0
)
