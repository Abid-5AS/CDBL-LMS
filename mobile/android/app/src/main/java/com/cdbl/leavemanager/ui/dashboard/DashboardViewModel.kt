package com.cdbl.leavemanager.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.BalanceResponse
import com.cdbl.leavemanager.data.model.AnalyticsTrendResponse
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
    val pendingApprovalsCount: Int = 0,
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

    fun loadDashboard(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            // Load Balance (all users)
            val balanceResult = dashboardRepository.getMyBalance(token)
            
            // Load Recent Activity
            val recentLeavesResult = leaveRepository.getRecentLeaves(token)

            // Load Pending Approvals (will return empty list if 403)
            val approvalsResult = approvalRepository.getPendingApprovals(token)

            // Load Analytics (will fail gracefully for non-admins due to RBAC, or we can check role before calling)
            // For now, we attempt to load it. If 403, we just ignore it.
            val analyticsResult = analyticsRepository.getLeaveTrends(token)

            _uiState.update { 
                it.copy(
                    isLoading = false,
                    balance = balanceResult.getOrNull(),
                    analytics = analyticsResult.getOrNull(),
                    recentLeaves = recentLeavesResult.getOrDefault(emptyList()),
                    pendingApprovalsCount = approvalsResult.getOrDefault(emptyList()).size,
                    error = balanceResult.exceptionOrNull()?.message
                )
            }
        }
    }
}
