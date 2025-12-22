package com.cdbl.leavemanager.ui.leaves

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.data.repository.LeaveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LeaveHistoryUiState(
    val isLoading: Boolean = false,
    val leaves: List<LeaveRequest> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class LeaveHistoryViewModel @Inject constructor(
    private val leaveRepository: LeaveRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LeaveHistoryUiState())
    val uiState: StateFlow<LeaveHistoryUiState> = _uiState.asStateFlow()

    fun loadLeaves(token: String) {
        viewModelScope.launch {
            _uiState.value = LeaveHistoryUiState(isLoading = true)
            val result = leaveRepository.getMyLeaves(token)
            result.onSuccess {
                _uiState.value = LeaveHistoryUiState(leaves = it)
            }.onFailure {
                _uiState.value = LeaveHistoryUiState(error = it.message)
            }
        }
    }
}
