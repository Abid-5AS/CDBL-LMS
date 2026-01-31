package com.cdbl.leavemanager.data.model

data class ReportsResponse(
    val reports: List<ScheduledReport> = emptyList()
)

data class ScheduledReport(
    val id: Int,
    val name: String,
    val reportType: String,
    val format: String,
    val frequency: String,
    val isActive: Boolean,
    val lastRunAt: String? = null,
    val nextRunAt: String? = null,
    val createdBy: ReportCreator? = null,
    val lastExecution: ReportExecutionSummary? = null
)

data class ReportCreator(
    val id: Int,
    val name: String
)

data class ReportExecutionSummary(
    val status: String,
    val completedAt: String? = null,
    val recordCount: Int? = null
)
