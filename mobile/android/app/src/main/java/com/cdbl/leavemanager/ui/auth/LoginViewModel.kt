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
import com.cdbl.leavemanager.data.local.TokenManager

data class LoginUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val token: String? = null,
    val error: String? = null,
    val requiresOtp: Boolean = false,
    val email: String? = null,
    val hasSavedToken: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(hasSavedToken = tokenManager.getToken() != null)
    }

    fun loginWithSavedToken() {
        val token = tokenManager.getToken()
        if (token != null) {
            _uiState.value = _uiState.value.copy(token = token)
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState(isLoading = true)
            val result = authRepository.login(email, password)
            result.onSuccess { response ->
                if (response.success && response.data != null) {
                    if (response.data.requiresOtp) {
                        // In debug builds, automatically verify with default OTP
                        if (com.cdbl.leavemanager.BuildConfig.DEBUG) {
                            _uiState.value = LoginUiState(
                                isLoading = true,
                                email = email
                            )
                            // Auto-verify with default OTP code "000000"
                            verifyOtp("000000")
                        } else {
                            _uiState.value = LoginUiState(
                                requiresOtp = true,
                                email = email,
                                error = response.data.message // Optional: Show "OTP Sent" as message? No, keep error for errors.
                            )
                        }
                    } else {
                        response.data.token?.let { tokenManager.saveToken(it) }
                        _uiState.value = LoginUiState(
                            user = response.data.user,
                            token = response.data.token
                        )
                    }
                } else {
                    _uiState.value = LoginUiState(error = response.error ?: "Unknown error")
                }
            }.onFailure { 
                _uiState.value = LoginUiState(error = it.message)
            }
        }
    }

    fun verifyOtp(code: String) {
        val currentEmail = _uiState.value.email ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = authRepository.verifyOtp(currentEmail, code)
            result.onSuccess { response ->
                if (response.success && response.data != null) {
                    response.data.token?.let { tokenManager.saveToken(it) }
                     _uiState.value = LoginUiState(
                        user = response.data.user,
                        token = response.data.token
                    )
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = response.error ?: "Invalid OTP")
                }
            }.onFailure { 
                 _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
            }
        }
    }
}
