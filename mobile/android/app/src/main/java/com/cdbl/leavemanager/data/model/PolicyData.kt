package com.cdbl.leavemanager.data.model



import androidx.compose.material.icons.rounded.Warning
import androidx.compose.ui.graphics.vector.ImageVector

data class PolicySection(
    val title: String,
    val code: String,
    val availability: String,
    val summary: String,
    val rules: List<PolicyRule>,
    val examples: List<PolicyExample> = emptyList()
)

data class PolicyRule(
    val title: String,
    val description: String,
    val type: String, // "critical", "warning", "info"
    val policyRef: String
)

data class PolicyExample(
    val scenario: String,
    val result: String,
    val valid: Boolean
)

data class PolicyResponse(
    val success: Boolean,
    val data: List<PolicySection>
)
