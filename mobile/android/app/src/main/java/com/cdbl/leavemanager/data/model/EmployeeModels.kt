package com.cdbl.leavemanager.data.model

data class EmployeeListResponse(
    val users: List<EmployeeSummary> = emptyList()
)

data class EmployeeSummary(
    val id: Int,
    val name: String,
    val email: String,
    val empCode: String? = null,
    val department: String? = null,
    val role: String,
    val profile: EmployeeProfile? = null,
    val leaves: List<EmployeeActiveLeave> = emptyList()
)

data class EmployeeProfile(
    val phone: String? = null
)

data class EmployeeActiveLeave(
    val id: Int,
    val type: String,
    val endDate: String
)

data class EmployeeDashboardData(
    val id: Int,
    val name: String,
    val email: String,
    val role: String,
    val department: String? = null,
    val designation: String? = null,
    val manager: String? = null,
    val managerEmail: String? = null,
    val joiningDate: String? = null,
    val employmentStatus: String? = null,
    val stats: EmployeeStats,
    val balances: List<EmployeeBalanceEntry> = emptyList(),
    val monthlyTrend: List<EmployeeTrendPoint> = emptyList(),
    val distribution: List<EmployeeDistributionSlice> = emptyList(),
    val history: List<EmployeeLeaveHistoryEntry> = emptyList(),
    val pendingRequestId: Int? = null
)

data class EmployeeStats(
    val employeesOnLeave: Int,
    val pendingRequests: Int,
    val avgApprovalTime: Double,
    val totalLeavesThisYear: Int,
    val encashmentPending: Int
)

data class EmployeeBalanceEntry(
    val type: String,
    val used: Int,
    val total: Int,
    val remaining: Int
)

data class EmployeeTrendPoint(
    val month: String,
    val leavesTaken: Int
)

data class EmployeeDistributionSlice(
    val type: String,
    val value: Int
)

data class EmployeeLeaveHistoryEntry(
    val id: Int,
    val type: String,
    val start: String,
    val end: String,
    val days: Int,
    val status: String
)
