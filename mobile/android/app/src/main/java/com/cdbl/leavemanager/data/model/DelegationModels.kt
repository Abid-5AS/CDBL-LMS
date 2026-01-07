package com.cdbl.leavemanager.data.model

data class DelegationsResponse(
    val delegations: List<DelegationEntry> = emptyList()
)

data class DelegationEntry(
    val id: Int,
    val delegatorId: Int,
    val delegatorName: String,
    val delegateId: Int,
    val delegateName: String,
    val startDate: String,
    val endDate: String,
    val reason: String? = null,
    val createdAt: String
)
