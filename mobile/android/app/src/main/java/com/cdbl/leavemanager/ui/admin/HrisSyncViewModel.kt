package com.cdbl.leavemanager.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.HrisSyncEntry
import com.cdbl.leavemanager.data.repository.AdminToolsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HrisSyncUiState(
    val isLoading: Boolean = false,
    val syncs: List<HrisSyncEntry> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class HrisSyncViewModel @Inject constructor(
    private val adminToolsRepository: AdminToolsRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(HrisSyncUiState())
    val uiState: StateFlow<HrisSyncUiState> = _uiState.asStateFlow()

    fun loadSyncs(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = adminToolsRepository.getHrisSyncs(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, syncs = result.getOrDefault(emptyList()))
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load syncs")
                }
            }
        }
    }
}
