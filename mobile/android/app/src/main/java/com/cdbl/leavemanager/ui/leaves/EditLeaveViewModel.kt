package com.cdbl.leavemanager.ui.leaves

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.ApplyLeaveRequest
import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.data.repository.LeaveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class EditLeaveUiState(
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val leave: LeaveRequest? = null,
    val error: String? = null,
    val success: Boolean = false
)

@HiltViewModel
class EditLeaveViewModel @Inject constructor(
    private val leaveRepository: LeaveRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(EditLeaveUiState())
    val uiState: StateFlow<EditLeaveUiState> = _uiState.asStateFlow()

    fun loadLeave(token: String, leaveId: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, success = false) }
            val result = leaveRepository.getLeaveDetails(token, leaveId)
            result.onSuccess { leave ->
                _uiState.update { it.copy(isLoading = false, leave = leave) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun resubmitLeave(
        token: String,
        leaveId: Int,
        type: String,
        startDate: String,
        endDate: String,
        reason: String,
        needsCertificate: Boolean,
        file: File?
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            val request = ApplyLeaveRequest(
                type = type,
                startDate = startDate,
                endDate = endDate,
                reason = reason,
                needsCertificate = if (needsCertificate) true else null
            )
            val result = leaveRepository.resubmitLeave(token, leaveId, request, file)
            result.onSuccess {
                _uiState.update { it.copy(isSubmitting = false, success = true) }
            }.onFailure { e ->
                _uiState.update { it.copy(isSubmitting = false, error = e.message) }
            }
        }
    }
}
