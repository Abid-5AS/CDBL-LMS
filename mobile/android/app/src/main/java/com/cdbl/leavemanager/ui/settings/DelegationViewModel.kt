package com.cdbl.leavemanager.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.DelegationEntry
import com.cdbl.leavemanager.data.repository.DelegationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DelegationUiState(
    val isLoading: Boolean = false,
    val delegations: List<DelegationEntry> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class DelegationViewModel @Inject constructor(
    private val delegationRepository: DelegationRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(DelegationUiState())
    val uiState: StateFlow<DelegationUiState> = _uiState.asStateFlow()

    fun loadDelegations(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = delegationRepository.getDelegations(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, delegations = result.getOrDefault(emptyList()))
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load delegations")
                }
            }
        }
    }
}
