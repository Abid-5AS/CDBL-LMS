package com.cdbl.leavemanager.ui.leaves

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.ApplyLeaveRequest
import com.cdbl.leavemanager.data.repository.LeaveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ApplyLeaveUiState(
    val isLoading: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ApplyLeaveViewModel @Inject constructor(
    private val leaveRepository: LeaveRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ApplyLeaveUiState())
    val uiState: StateFlow<ApplyLeaveUiState> = _uiState.asStateFlow()

    fun submitLeave(token: String, type: String, startDate: String, endDate: String, reason: String) {
        viewModelScope.launch {
            _uiState.value = ApplyLeaveUiState(isLoading = true)
            val request = ApplyLeaveRequest(type, startDate, endDate, reason)
            val result = leaveRepository.applyLeave(token, request)
            
            result.onSuccess {
                if (it.ok) {
                    _uiState.value = ApplyLeaveUiState(success = true)
                } else {
                    _uiState.value = ApplyLeaveUiState(error = "Request failed")
                }
            }.onFailure {
                _uiState.value = ApplyLeaveUiState(error = it.message)
            }
        }
    }
    
    fun resetState() {
        _uiState.value = ApplyLeaveUiState()
    }
}
