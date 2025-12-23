package com.cdbl.leavemanager.ui.holidays

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.Holiday
import com.cdbl.leavemanager.data.repository.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HolidaysUiState(
    val isLoading: Boolean = false,
    val holidays: List<Holiday> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class HolidaysViewModel @Inject constructor(
    private val repository: DashboardRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HolidaysUiState())
    val uiState: StateFlow<HolidaysUiState> = _uiState.asStateFlow()

    fun loadHolidays(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = repository.getHolidays(token)
            
            result.onSuccess { holidays ->
                _uiState.update { it.copy(isLoading = false, holidays = holidays) }
            }.onFailure { error ->
                _uiState.update { it.copy(isLoading = false, error = error.message) }
            }
        }
    }
}
