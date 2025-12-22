package com.cdbl.leavemanager.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.User
import com.cdbl.leavemanager.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val token: String? = null,
    val error: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState(isLoading = true)
            val result = authRepository.login(email, password)
            result.onSuccess { response ->
                if (response.success && response.data != null) {
                    _uiState.value = LoginUiState(
                        user = response.data.user,
                        token = response.data.token
                    )
                } else {
                    _uiState.value = LoginUiState(error = response.error ?: "Unknown error")
                }
            }.onFailure {
                _uiState.value = LoginUiState(error = it.message)
            }
        }
    }
}
