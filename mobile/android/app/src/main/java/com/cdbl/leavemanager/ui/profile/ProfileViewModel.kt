package com.cdbl.leavemanager.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.User
import com.cdbl.leavemanager.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val userDetails: com.cdbl.leavemanager.data.model.UserDetailsResponse? = null,
    val error: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun loadProfile(token: String? = null) {
        val currentToken = token ?: _uiState.value.user?.let { return } // Already loaded or need token
        if (currentToken == null) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = repository.getProfile(currentToken)
            result.onSuccess { user ->
                _uiState.update { it.copy(isLoading = false, user = user, error = null) }
            }.onFailure { error ->
                _uiState.update { it.copy(isLoading = false, error = error.message) }
            }
        }
    }



    fun loadProfileDetails(token: String) {
        viewModelScope.launch {
            // Don't set global loading true to avoid full screen flicker if just refreshing details
            // or maybe we do want it. Let's keep it subtle or use a separate loading flag if needed.
            // For now, reusing isLoading is fine for simplicity.
            _uiState.update { it.copy(isLoading = true) }
            val result = repository.getProfileDetails(token)
            result.onSuccess { details ->
                _uiState.update { it.copy(isLoading = false, userDetails = details, error = null) }
            }.onFailure {
                _uiState.update { it.copy(isLoading = false) } // Silent fail or show snackbar handled by UI
            }
        }
    }

    fun updatePersonalProfile(token: String, data: Map<String, Any?>, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = repository.updatePersonalProfile(token, data)
            result.onSuccess {
                // Reload details to reflect changes
                loadProfileDetails(token)
                 // Wait for reload? or just call onSuccess. calling onSuccess immediately
                onSuccess()
            }.onFailure { error ->
                _uiState.update { it.copy(isLoading = false) }
                onError(error.message ?: "Unknown error")
            }
        }
    }

    fun changePassword(token: String, request: com.cdbl.leavemanager.data.model.ChangePasswordRequest, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = repository.changePassword(token, request)
            result.onSuccess {
                _uiState.update { it.copy(isLoading = false) }
                onSuccess()
            }.onFailure { error ->
                _uiState.update { it.copy(isLoading = false) }
                onError(error.message ?: "Unknown error")
            }
        }
    }
}
