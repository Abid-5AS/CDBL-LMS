package com.cdbl.leavemanager.ui.leaves

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.LeaveComment
import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.data.repository.LeaveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import com.cdbl.leavemanager.data.repository.ApprovalRepository

data class LeaveDetailUiState(
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val leave: LeaveRequest? = null,
    val comments: List<LeaveComment> = emptyList(),
    val error: String? = null,
    val actionSuccess: Boolean = false
)

@HiltViewModel
class LeaveDetailViewModel @Inject constructor(
    private val repository: LeaveRepository,
    private val approvalRepository: ApprovalRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LeaveDetailUiState())
    val uiState: StateFlow<LeaveDetailUiState> = _uiState.asStateFlow()

    fun loadDetails(token: String, leaveId: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, actionSuccess = false) }
            
            val leaveResult = repository.getLeaveDetails(token, leaveId)
            val commentsResult = repository.getComments(token, leaveId)

            if (leaveResult.isSuccess) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        leave = leaveResult.getOrNull(),
                        comments = commentsResult.getOrDefault(emptyList())
                    )
                }
            } else {
                _uiState.update {
                    val errorMsg = leaveResult.exceptionOrNull()?.message
                    it.copy(isLoading = false, error = errorMsg)
                }
            }
        }
    }

    fun approveLeave(token: String, leaveId: Int, comment: String?) {
        submitDecision(token, leaveId, "APPROVE", comment)
    }

    fun rejectLeave(token: String, leaveId: Int, comment: String?) {
        submitDecision(token, leaveId, "REJECT", comment)
    }

    private fun submitDecision(token: String, leaveId: Int, decision: String, comment: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            val result = approvalRepository.submitDecision(token, leaveId.toString(), decision, comment)
            
            result.onSuccess {
                _uiState.update { it.copy(isSubmitting = false, actionSuccess = true) }
                // Reload details to show updated status
                loadDetails(token, leaveId)
            }.onFailure { e ->
                _uiState.update { it.copy(isSubmitting = false, error = e.message) }
            }
        }
    }
}
