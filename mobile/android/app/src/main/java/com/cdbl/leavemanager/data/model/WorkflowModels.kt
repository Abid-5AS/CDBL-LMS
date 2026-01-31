package com.cdbl.leavemanager.data.model

data class WorkflowPoliciesResponse(
    val policies: List<WorkflowPolicy> = emptyList(),
    val defaults: List<WorkflowPolicyDefault> = emptyList()
)

data class WorkflowPolicy(
    val requesterRole: String,
    val chain: List<String> = emptyList(),
    val isActive: Boolean = true,
    val updatedByUser: WorkflowUserSummary? = null
)

data class WorkflowPolicyDefault(
    val requesterRole: String,
    val chain: List<String> = emptyList(),
    val isDefault: Boolean = true,
    val isActive: Boolean = true
)

data class WorkflowUserSummary(
    val name: String? = null,
    val email: String? = null
)
