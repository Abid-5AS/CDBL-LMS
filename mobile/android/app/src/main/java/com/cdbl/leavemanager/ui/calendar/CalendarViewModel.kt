package com.cdbl.leavemanager.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.data.repository.CalendarRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.YearMonth
import javax.inject.Inject

data class CalendarUiState(
    val isLoading: Boolean = false,
    val events: List<CalendarEvent> = emptyList(),
    val error: String? = null
)

data class CalendarEvent(
    val id: Int,
    val employeeName: String,
    val type: String,
    val startDate: String,
    val endDate: String,
    val status: String
)

@HiltViewModel
class CalendarViewModel @Inject constructor(
    private val repository: CalendarRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CalendarUiState())
    val uiState: StateFlow<CalendarUiState> = _uiState.asStateFlow()

    private var currentLoadedMonth: YearMonth? = null

    fun loadCalendarEvents(token: String, month: YearMonth) {
        // Prevent redundant reloads if desired, but for calendar nav usually we reload
        if (currentLoadedMonth == month && _uiState.value.events.isNotEmpty()) return
        
        currentLoadedMonth = month
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            val result = repository.getTeamCalendarEvents(token, month)
            result.onSuccess { leaves ->
                val events = leaves.map { leave ->
                    CalendarEvent(
                        id = leave.id,
                        employeeName = leave.employeeName ?: "Unknown",
                        type = leave.type,
                        startDate = leave.startDate,
                        endDate = leave.endDate,
                        status = leave.status
                    )
                }
                _uiState.update { it.copy(isLoading = false, events = events) }
            }.onFailure { error ->
                _uiState.update { it.copy(isLoading = false, error = error.message) }
            }
        }
    }
}
