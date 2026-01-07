package com.cdbl.leavemanager.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.CalendarIntegrationStatus
import com.cdbl.leavemanager.data.repository.IntegrationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CalendarIntegrationUiState(
    val isLoading: Boolean = false,
    val providers: List<CalendarIntegrationStatus> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class CalendarIntegrationViewModel @Inject constructor(
    private val integrationRepository: IntegrationRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(CalendarIntegrationUiState())
    val uiState: StateFlow<CalendarIntegrationUiState> = _uiState.asStateFlow()

    fun loadStatus(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = integrationRepository.getCalendarStatus(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, providers = result.getOrDefault(emptyList()))
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load calendar status")
                }
            }
        }
    }
}
