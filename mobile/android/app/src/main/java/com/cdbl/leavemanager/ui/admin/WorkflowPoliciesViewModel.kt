package com.cdbl.leavemanager.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.WorkflowPoliciesResponse
import com.cdbl.leavemanager.data.repository.AdminToolsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WorkflowPoliciesUiState(
    val isLoading: Boolean = false,
    val policies: WorkflowPoliciesResponse? = null,
    val error: String? = null
)

@HiltViewModel
class WorkflowPoliciesViewModel @Inject constructor(
    private val adminToolsRepository: AdminToolsRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(WorkflowPoliciesUiState())
    val uiState: StateFlow<WorkflowPoliciesUiState> = _uiState.asStateFlow()

    fun loadPolicies(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = adminToolsRepository.getWorkflowPolicies(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, policies = result.getOrNull())
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load policies")
                }
            }
        }
    }
}
