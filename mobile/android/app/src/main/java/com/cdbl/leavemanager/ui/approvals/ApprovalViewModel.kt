package com.cdbl.leavemanager.ui.approvals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.ApprovalItem
import com.cdbl.leavemanager.data.api.ApprovalHistoryItem
import com.cdbl.leavemanager.data.repository.ApprovalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ApprovalUiState(
    val isLoading: Boolean = false,
    val items: List<ApprovalItem> = emptyList(),
    val historyItems: List<ApprovalHistoryItem> = emptyList(),
    val historyLoading: Boolean = false,
    val error: String? = null,
    val actionSuccess: String? = null
)

@HiltViewModel
class ApprovalViewModel @Inject constructor(
    private val approvalRepository: ApprovalRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ApprovalUiState())
    val uiState: StateFlow<ApprovalUiState> = _uiState.asStateFlow()

    fun loadApprovals(token: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = approvalRepository.getPendingApprovals(token)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(isLoading = false, items = it)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
            }
        }
    }

    fun loadHistory(token: String, decision: String = "ALL") {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(historyLoading = true)
            val result = approvalRepository.getApprovalHistory(token, decision)
            result.onSuccess { response ->
                _uiState.value = _uiState.value.copy(historyLoading = false, historyItems = response.items)
            }.onFailure {
                _uiState.value = _uiState.value.copy(historyLoading = false, error = it.message)
            }
        }
    }

    fun submitDecision(token: String, id: String, action: String, comment: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = approvalRepository.submitDecision(token, id, action, comment)
            result.onSuccess {
                if (it.ok) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false, 
                        actionSuccess = "Request ${action}ed",
                        items = _uiState.value.items.filter { item -> item.id != id }
                    )
                } else {
                     _uiState.value = _uiState.value.copy(isLoading = false, error = it.error ?: "Action failed")
                }
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
            }
        }
    }
    
    fun clearActionSuccess() {
        _uiState.value = _uiState.value.copy(actionSuccess = null)
    }
}

