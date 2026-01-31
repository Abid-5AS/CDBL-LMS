package com.cdbl.leavemanager.data.model

data class SystemStatsResponse(
    val totalEmployees: Int,
    val onLeaveToday: Int,
    val pendingRequests: Int,
    val departmentStats: List<DepartmentStat>
)

data class DepartmentStat(
    val department: String,
    val totalEmployees: Int,
    val onLeave: Int
)

data class ManagerStatsResponse(
    val pendingApprovals: Int,
    val teamAvailability: Double // Percentage or count
)

data class Holiday(
    val id: Int,
    val date: String,
    val name: String,
    val isOptional: Boolean,
    val description: String? = null
)

data class HolidayResponse(
    val holidays: List<Holiday>
)

data class HRAdminStats(
    val employeesOnLeave: Int,
    val pendingRequests: Int,
    val avgApprovalTime: Double,
    val encashmentPending: Int,
    val totalLeavesThisYear: Int,
    val processedToday: Int,
    val teamUtilization: Double,
    val complianceScore: Double
)

data class AuditLog(
    val id: String,
    val actorEmail: String,
    val action: String,
    val targetEmail: String? = null,
    val details: String? = null,
    val createdAt: String
)

data class AuditLogsResponse(
    val items: List<AuditLog> = emptyList()
)

data class AdminDashboardData(
    val systemStats: SystemStatsResponse,
    val auditLogs: List<AuditLog>
)

data class CEOStats(
    val totalEmployees: Int,
    val activeEmployees: Int,
    val onLeaveToday: Int,
    val utilizationRate: Double,
    val pendingApprovals: Int,
    val avgApprovalTime: Double,
    val complianceScore: Double,
    val estimatedCost: Double,
    val totalLeaveDays: Int,
    val yoyGrowth: Double,
    val departmentStats: List<DepartmentStat> // Reusing DepartmentStat
)

data class HRHeadStats(
    val pending: Int,
    val onLeave: Int,
    val returned: Int,
    val upcoming: Int,
    val monthlyRequests: Int,
    val newHires: Int,
    val complianceScore: Double,
    val escalatedCases: List<EscalatedCase>,
    val departmentPerformance: List<DepartmentPerformance>
)

data class EscalatedCase(
    val id: Int,
    val employeeName: String,
    val department: String,
    val leaveType: String,
    val days: Int,
    val reason: String
)

data class DepartmentPerformance(
    val name: String,
    val pending: Int,
    val avgApprovalTime: Double
)
