package com.cdbl.leavemanager.ui.encashment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.EncashmentRequest
import com.cdbl.leavemanager.data.repository.EncashmentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class EncashmentUiState(
    val isLoading: Boolean = false,
    val requests: List<EncashmentRequest> = emptyList(),
    val error: String? = null,
    val requestSuccess: String? = null
)

@HiltViewModel
class EncashmentViewModel @Inject constructor(
    private val encashmentRepository: EncashmentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(EncashmentUiState())
    val uiState: StateFlow<EncashmentUiState> = _uiState.asStateFlow()

    fun loadRequests(token: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = encashmentRepository.getEncashmentRequests(token)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(isLoading = false, requests = it)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
            }
        }
    }

    fun submitRequest(token: String, days: Int, reason: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = encashmentRepository.requestEncashment(token, days, reason)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    requestSuccess = "Encashment requested successfully!",
                    requests = _uiState.value.requests + it // Optimistic update or refetch? adding for now
                )
                // Optionally reload to get server-sorted list
                loadRequests(token) 
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
            }
        }
    }
    
    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(requestSuccess = null)
    }
}
