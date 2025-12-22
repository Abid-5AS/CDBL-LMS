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
import javax.inject.Inject

data class LeaveDetailUiState(
    val isLoading: Boolean = false,
    val leave: LeaveRequest? = null,
    val comments: List<LeaveComment> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class LeaveDetailViewModel @Inject constructor(
    private val repository: LeaveRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LeaveDetailUiState())
    val uiState: StateFlow<LeaveDetailUiState> = _uiState.asStateFlow()

    fun loadDetails(token: String, leaveId: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            // Parallel fetch using async/await pattern ideally, but sequential is fine for now
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
                    println("LeaveDetailViewModel error: $errorMsg")
                    it.copy(isLoading = false, error = errorMsg)
                }
            }
        }
    }
}
