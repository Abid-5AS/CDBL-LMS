package com.cdbl.leavemanager.data.model

data class AnalyticsTrendResponse(
    val monthlyTrend: List<MonthlyTrendItem>,
    val leaveTypeBreakdown: List<LeaveTypeBreakdownItem>,
    val totalLeaves: Int,
    val approvedLeaves: Int?, // API might return this as derived
    val approvalRate: Double
)

data class MonthlyTrendItem(
    val month: String,
    val leaves: Int,
    val approved: Int,
    val rejected: Int
)

data class LeaveTypeBreakdownItem(
    val type: String,
    val count: Int,
    val days: Double,
    val percentage: Double
)
