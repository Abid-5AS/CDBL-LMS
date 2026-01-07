package com.cdbl.leavemanager.data.model

data class HrisSyncResponse(
    val syncs: List<HrisSyncEntry> = emptyList()
)

data class HrisSyncEntry(
    val id: Int,
    val provider: String,
    val status: String,
    val startedAt: String,
    val completedAt: String? = null,
    val recordsTotal: Int = 0,
    val recordsSynced: Int = 0,
    val recordsFailed: Int = 0,
    val createdBy: Int? = null,
    val unresolvedConflicts: Int = 0,
    val user: HrisUserSummary? = null
)

data class HrisUserSummary(
    val name: String? = null,
    val email: String? = null
)
