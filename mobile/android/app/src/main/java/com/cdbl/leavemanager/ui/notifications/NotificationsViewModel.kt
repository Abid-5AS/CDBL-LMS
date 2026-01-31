package com.cdbl.leavemanager.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.NotificationItem
import com.cdbl.leavemanager.data.repository.NotificationsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationsUiState(
    val isLoading: Boolean = false,
    val items: List<NotificationItem> = emptyList(),
    val unreadCount: Int = 0,
    val error: String? = null
)

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val notificationsRepository: NotificationsRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    fun loadNotifications(token: String, unreadOnly: Boolean = false) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = notificationsRepository.getNotifications(token, unreadOnly)
            _uiState.update { state ->
                if (result.isSuccess) {
                    val response = result.getOrNull()
                    state.copy(
                        isLoading = false,
                        items = response?.notifications ?: emptyList(),
                        unreadCount = response?.unreadCount ?: 0
                    )
                } else {
                    state.copy(isLoading = false, error = result.exceptionOrNull()?.message ?: "Failed to load notifications")
                }
            }
        }
    }

    fun markAsRead(token: String, id: Int) {
        viewModelScope.launch {
            notificationsRepository.markRead(token, id)
            loadNotifications(token)
        }
    }

    fun markAllAsRead(token: String) {
        viewModelScope.launch {
            notificationsRepository.markAllRead(token)
            loadNotifications(token)
        }
    }
}
