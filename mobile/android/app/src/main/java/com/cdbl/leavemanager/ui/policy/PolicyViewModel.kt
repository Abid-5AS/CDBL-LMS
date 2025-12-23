package com.cdbl.leavemanager.ui.policy

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.PolicySection
import com.cdbl.leavemanager.data.repository.PolicyRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PolicyUiState(
    val isLoading: Boolean = false,
    val policies: List<PolicySection> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class PolicyViewModel @Inject constructor(
    private val policyRepository: PolicyRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PolicyUiState())
    val uiState: StateFlow<PolicyUiState> = _uiState.asStateFlow()

    init {
        fetchPolicies()
    }

    fun fetchPolicies() {
        viewModelScope.launch {
            _uiState.value = PolicyUiState(isLoading = true)
            
            // Artificial delay to show loading state (optional, remove in prod if fast)
            // kotlinx.coroutines.delay(500)

            val result = policyRepository.fetchPolicies()
            result.onSuccess { policies ->
                _uiState.value = PolicyUiState(policies = policies)
            }.onFailure { e ->
                _uiState.value = PolicyUiState(error = e.message ?: "Failed to load policies. Please check your connection.")
            }
        }
    }
}
