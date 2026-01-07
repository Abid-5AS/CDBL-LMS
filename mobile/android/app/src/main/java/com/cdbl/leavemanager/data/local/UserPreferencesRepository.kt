package com.cdbl.leavemanager.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

enum class DarkThemeConfig {
    FOLLOW_SYSTEM,
    LIGHT,
    DARK
}

data class UserPreferences(
    val darkThemeConfig: DarkThemeConfig = DarkThemeConfig.FOLLOW_SYSTEM,
    val useDynamicColor: Boolean = true,
    val notificationsEnabled: Boolean = true,
    val leaveRemindersEnabled: Boolean = true,
    val approvalRemindersEnabled: Boolean = true,
    val biometricEnabled: Boolean = false,
    val compactViewEnabled: Boolean = false
)

@Singleton
class UserPreferencesRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    private object PreferencesKeys {
        val DARK_THEME_CONFIG = stringPreferencesKey("dark_theme_config")
        val USE_DYNAMIC_COLOR = booleanPreferencesKey("use_dynamic_color")
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val LEAVE_REMINDERS_ENABLED = booleanPreferencesKey("leave_reminders_enabled")
        val APPROVAL_REMINDERS_ENABLED = booleanPreferencesKey("approval_reminders_enabled")
        val BIOMETRIC_ENABLED = booleanPreferencesKey("biometric_enabled")
        val COMPACT_VIEW_ENABLED = booleanPreferencesKey("compact_view_enabled")
    }

    val userPreferencesFlow: Flow<UserPreferences> = dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            val darkThemeConfig = try {
                DarkThemeConfig.valueOf(
                    preferences[PreferencesKeys.DARK_THEME_CONFIG] ?: DarkThemeConfig.FOLLOW_SYSTEM.name
                )
            } catch (e: Exception) {
                DarkThemeConfig.FOLLOW_SYSTEM
            }
            
            UserPreferences(
                darkThemeConfig = darkThemeConfig,
                useDynamicColor = preferences[PreferencesKeys.USE_DYNAMIC_COLOR] ?: true,
                notificationsEnabled = preferences[PreferencesKeys.NOTIFICATIONS_ENABLED] ?: true,
                leaveRemindersEnabled = preferences[PreferencesKeys.LEAVE_REMINDERS_ENABLED] ?: true,
                approvalRemindersEnabled = preferences[PreferencesKeys.APPROVAL_REMINDERS_ENABLED] ?: true,
                biometricEnabled = preferences[PreferencesKeys.BIOMETRIC_ENABLED] ?: false,
                compactViewEnabled = preferences[PreferencesKeys.COMPACT_VIEW_ENABLED] ?: false
            )
        }

    suspend fun setDarkThemeConfig(darkThemeConfig: DarkThemeConfig) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.DARK_THEME_CONFIG] = darkThemeConfig.name
        }
    }

    suspend fun setUseDynamicColor(useDynamicColor: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.USE_DYNAMIC_COLOR] = useDynamicColor
        }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.NOTIFICATIONS_ENABLED] = enabled
        }
    }

    suspend fun setLeaveRemindersEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.LEAVE_REMINDERS_ENABLED] = enabled
        }
    }

    suspend fun setApprovalRemindersEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.APPROVAL_REMINDERS_ENABLED] = enabled
        }
    }

    suspend fun setBiometricEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.BIOMETRIC_ENABLED] = enabled
        }
    }

    suspend fun setCompactViewEnabled(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferencesKeys.COMPACT_VIEW_ENABLED] = enabled
        }
    }
}
