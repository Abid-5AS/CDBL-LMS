package com.cdbl.leavemanager.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.AdminUser
import com.cdbl.leavemanager.data.model.CreateUserRequest
import com.cdbl.leavemanager.data.model.UpdateUserRequest
import com.cdbl.leavemanager.data.repository.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminUsersUiState(
    val isLoading: Boolean = false,
    val users: List<AdminUser> = emptyList(),
    val error: String? = null,
    val message: String? = null
)

@HiltViewModel
class AdminUsersViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(AdminUsersUiState())
    val uiState: StateFlow<AdminUsersUiState> = _uiState.asStateFlow()

    fun loadUsers(token: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = dashboardRepository.getUsers(token)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, users = result.getOrDefault(emptyList()))
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load users")
                }
            }
        }
    }

    fun createUser(token: String, request: CreateUserRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null, error = null) }
            val result = dashboardRepository.createUser(token, request)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, message = result.getOrNull())
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to create user")
                }
            }
        }
    }

    fun updateUser(token: String, userId: String, request: UpdateUserRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null, error = null) }
            val result = dashboardRepository.updateUser(token, userId, request)
            _uiState.update { state ->
                if (result.isSuccess) {
                    state.copy(isLoading = false, message = result.getOrNull())
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to update user")
                }
            }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }
}
