package com.cdbl.leavemanager.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.AuditLog
import com.cdbl.leavemanager.data.repository.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuditLogsUiState(
    val isLoading: Boolean = false,
    val logs: List<AuditLog> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class AuditLogsViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(AuditLogsUiState())
    val uiState: StateFlow<AuditLogsUiState> = _uiState.asStateFlow()

    fun loadAuditLogs(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = dashboardRepository.getAuditLogs(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, logs = result.getOrDefault(emptyList()))
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load audit logs")
                }
            }
        }
    }
}
