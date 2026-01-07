package com.cdbl.leavemanager.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.local.DarkThemeConfig
import com.cdbl.leavemanager.data.local.UserPreferences
import com.cdbl.leavemanager.data.local.UserPreferencesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val userPreferencesRepository: UserPreferencesRepository
) : ViewModel() {

    val userPreferences: StateFlow<UserPreferences> = userPreferencesRepository.userPreferencesFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = UserPreferences()
        )

    fun setDarkThemeConfig(darkThemeConfig: DarkThemeConfig) {
        viewModelScope.launch {
            userPreferencesRepository.setDarkThemeConfig(darkThemeConfig)
        }
    }

    fun setUseDynamicColor(useDynamicColor: Boolean) {
        viewModelScope.launch {
            userPreferencesRepository.setUseDynamicColor(useDynamicColor)
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesRepository.setNotificationsEnabled(enabled)
        }
    }

    fun setLeaveRemindersEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesRepository.setLeaveRemindersEnabled(enabled)
        }
    }

    fun setApprovalRemindersEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesRepository.setApprovalRemindersEnabled(enabled)
        }
    }

    fun setBiometricEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesRepository.setBiometricEnabled(enabled)
        }
    }

    fun setCompactViewEnabled(enabled: Boolean) {
        viewModelScope.launch {
            userPreferencesRepository.setCompactViewEnabled(enabled)
        }
    }
}
