package com.cdbl.leavemanager.ui.employees

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.EmployeeDashboardData
import com.cdbl.leavemanager.data.repository.EmployeeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EmployeeDetailUiState(
    val isLoading: Boolean = false,
    val employee: EmployeeDashboardData? = null,
    val error: String? = null
)

@HiltViewModel
class EmployeeDetailViewModel @Inject constructor(
    private val employeeRepository: EmployeeRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(EmployeeDetailUiState())
    val uiState: StateFlow<EmployeeDetailUiState> = _uiState.asStateFlow()

    fun loadEmployee(token: String, employeeId: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = employeeRepository.getEmployeeDetail(token, employeeId)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, employee = result.getOrNull())
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load employee")
                }
            }
        }
    }
}
