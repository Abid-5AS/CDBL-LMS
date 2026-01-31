package com.cdbl.leavemanager.ui.leaves

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.data.repository.LeaveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
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

    private var currentToken: String = ""
    private var currentStatus: String? = null
    private var currentType: String? = null

    fun loadLeaves(token: String, status: String? = null, type: String? = null) {
        currentToken = token
        currentStatus = status
        currentType = type
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            // Start observing the DB Flow
            leaveRepository.getMyLeavesFlow(token).collect { leaves ->
                val filteredLeaves = leaves.filter { leave ->
                    (status == null || status == "All" || leave.status == status) &&
                    (type == null || type == "All" || leave.type == type)
                }
                _uiState.update { it.copy(isLoading = false, leaves = filteredLeaves) }
            }
        }
        
        // Trigger a background sync/refresh
        viewModelScope.launch {
            leaveRepository.syncLeaves(token)
        }
    }
}
