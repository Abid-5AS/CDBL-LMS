package com.cdbl.leavemanager.data.model

data class CalendarIntegrationStatus(
    val provider: String,
    val isActive: Boolean,
    val lastSyncAt: String? = null
)
