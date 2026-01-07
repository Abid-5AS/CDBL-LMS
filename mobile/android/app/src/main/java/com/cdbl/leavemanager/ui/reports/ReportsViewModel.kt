package com.cdbl.leavemanager.ui.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.ScheduledReport
import com.cdbl.leavemanager.data.repository.ReportsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReportsUiState(
    val isLoading: Boolean = false,
    val reports: List<ScheduledReport> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val reportsRepository: ReportsRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(ReportsUiState())
    val uiState: StateFlow<ReportsUiState> = _uiState.asStateFlow()

    fun loadReports(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = reportsRepository.getReports(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, reports = result.getOrDefault(emptyList()))
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load reports")
                }
            }
        }
    }
}
