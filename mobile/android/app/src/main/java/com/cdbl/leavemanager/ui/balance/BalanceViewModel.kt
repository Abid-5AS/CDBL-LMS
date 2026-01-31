package com.cdbl.leavemanager.ui.balance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.BalanceDetail
import com.cdbl.leavemanager.data.model.BalanceDetailResponse
import com.cdbl.leavemanager.data.repository.DashboardRepository
import com.cdbl.leavemanager.data.repository.LeaveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class BalanceUiState(
    val isLoading: Boolean = false,
    val balance: BalanceDetailResponse? = null,
    val pendingDays: Int = 0,
    val pendingByType: Map<String, Double> = emptyMap(),
    val error: String? = null,
    val useMock: Boolean = false
)

@HiltViewModel
class BalanceViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository,
    private val leaveRepository: LeaveRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(BalanceUiState())
    val uiState: StateFlow<BalanceUiState> = _uiState.asStateFlow()

    fun loadBalance(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val balanceResult = dashboardRepository.getMyBalanceDetailed(token)
            val leaves = leaveRepository.getMyLeavesFlow(token).first()
            val pendingByType = leaves
                .filter { it.status == "PENDING" || it.status == "SUBMITTED" }
                .groupBy { it.type }
                .mapValues { Entry -> Entry.value.sumOf { (it.workingDays ?: 0).toDouble() } }

            val totalPending = pendingByType.values.sumOf { it.toInt() }

            balanceResult.onSuccess { data ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        balance = data,
                        pendingDays = totalPending,
                        pendingByType = pendingByType,
                        useMock = false
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        balance = null, // No fallback
                        pendingDays = totalPending,
                        pendingByType = pendingByType,
                        error = error.message,
                        useMock = false
                    )
                }
            }
        }
    }
}
