package com.cdbl.leavemanager.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.BalanceResponse
import com.cdbl.leavemanager.data.model.AnalyticsTrendResponse
import com.cdbl.leavemanager.data.model.TeamMemberOnLeave
import com.cdbl.leavemanager.data.repository.DashboardRepository
import com.cdbl.leavemanager.data.repository.AnalyticsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.data.repository.LeaveRepository
import com.cdbl.leavemanager.data.repository.ApprovalRepository

data class DashboardUiState(
    val isLoading: Boolean = false,
    val balance: BalanceResponse? = null,
    val analytics: AnalyticsTrendResponse? = null,
    val recentLeaves: List<LeaveRequest> = emptyList(),
    val whosOutToday: List<TeamMemberOnLeave> = emptyList(),
    val pendingApprovalsCount: Int = 0,
    val needsAttentionCount: Int = 0,
    val underReviewCount: Int = 0,
    val nextApprovedLeave: LeaveRequest? = null,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository,
    private val analyticsRepository: AnalyticsRepository,
    private val leaveRepository: LeaveRepository,
    private val approvalRepository: ApprovalRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _hrHeadStats = MutableStateFlow<Result<HRHeadStats>?>(null)
    val hrHeadStats: StateFlow<Result<HRHeadStats>?> = _hrHeadStats.asStateFlow()

    private val _users = MutableStateFlow<Result<List<User>>?>(null)
    val users: StateFlow<Result<List<User>>?> = _users.asStateFlow()

    fun loadDashboard(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            // Load Balance (all users)
            val balanceResult = dashboardRepository.getMyBalance(token)
            
            // Load Recent Activity (assuming this fetches the user's leave history)
            val recentLeavesResult = leaveRepository.getRecentLeaves(token)

            // Load Pending Approvals (will return empty list if 403)
            val approvalsResult = approvalRepository.getPendingApprovals(token)

            // Load Analytics (will fail gracefully for non-admins due to RBAC, or we can check role before calling)
            // For now, we attempt to load it. If 403, we just ignore it.
            val analyticsResult = analyticsRepository.getLeaveTrends(token)

            // Load Team On Leave (dashboard widget)
            val teamResult = dashboardRepository.getTeamOnLeave(token)

            _uiState.update { state ->
                val recentLeaves = recentLeavesResult.getOrDefault(emptyList())
                val needsAttention = recentLeaves.count { it.status == "RETURNED" || it.status == "REJECTED" } // Expanded definition
                val underReview = recentLeaves.count { it.status == "PENDING" || it.status == "SUBMITTED" }
                val nextApproved = recentLeaves
                    .filter { it.status == "APPROVED" } // Filter for future dates if possible, assuming list is sorted or we parse dates
                    // For simplicity in MVP, we take the first approved leave. 
                    // Ideally check startDate > today.
                    .firstOrNull()

                state.copy(
                    isLoading = false,
                    balance = balanceResult.getOrNull(),
                    analytics = analyticsResult.getOrNull(),
                    recentLeaves = recentLeaves,
                    whosOutToday = teamResult.getOrNull()?.members ?: emptyList(),
                    pendingApprovalsCount = approvalsResult.getOrDefault(emptyList()).size,
                    
                    // Computed KPIs
                    needsAttentionCount = needsAttention,
                    underReviewCount = underReview,
                    nextApprovedLeave = nextApproved,
                    
                    error = balanceResult.exceptionOrNull()?.message
                )
            }
        }
    }


    suspend fun fetchManagerPendingLeaves(token: String): Result<com.cdbl.leavemanager.data.model.ManagerLeaveResponse> {
        return leaveRepository.getManagerPendingLeaves(token)
    }

    suspend fun fetchSystemStats(token: String): Result<com.cdbl.leavemanager.data.model.SystemStatsResponse> {
        return dashboardRepository.getSystemStats(token)
    }

    suspend fun fetchHRStats(token: String): Result<com.cdbl.leavemanager.data.model.HRAdminStats> {
        return dashboardRepository.getHRStats(token)
    }

    suspend fun fetchAuditLogs(token: String): Result<List<com.cdbl.leavemanager.data.model.AuditLog>> {
        return dashboardRepository.getAuditLogs(token)
    }

    suspend fun fetchCEOStats(token: String): Result<com.cdbl.leavemanager.data.model.CEOStats> {
        return dashboardRepository.getCEOStats(token)
    }

    suspend fun fetchHRHeadStats(token: String): Result<com.cdbl.leavemanager.data.model.HRHeadStats> {
        return dashboardRepository.getHRHeadStats(token)
    }
}
