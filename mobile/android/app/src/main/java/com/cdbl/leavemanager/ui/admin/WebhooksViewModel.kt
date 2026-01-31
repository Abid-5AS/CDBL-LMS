package com.cdbl.leavemanager.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.WebhookEntry
import com.cdbl.leavemanager.data.repository.AdminToolsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WebhooksUiState(
    val isLoading: Boolean = false,
    val webhooks: List<WebhookEntry> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class WebhooksViewModel @Inject constructor(
    private val adminToolsRepository: AdminToolsRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(WebhooksUiState())
    val uiState: StateFlow<WebhooksUiState> = _uiState.asStateFlow()

    fun loadWebhooks(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = adminToolsRepository.getWebhooks(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, webhooks = result.getOrDefault(emptyList()))
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load webhooks")
                }
            }
        }
    }
}
