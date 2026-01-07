package com.cdbl.leavemanager.ui.settings

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.data.local.DarkThemeConfig
import com.cdbl.leavemanager.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateToDelegation: () -> Unit,
    onNavigateToCalendarIntegration: () -> Unit,
    onNavigateToChangePassword: (() -> Unit)? = null,
    onLogout: (() -> Unit)? = null,
    onBackClick: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val userPreferences by viewModel.userPreferences.collectAsState()
    var showThemeDialog by remember { mutableStateOf(false) }

    if (showThemeDialog) {
        ThemeSelectionDialog(
            currentTheme = userPreferences.darkThemeConfig,
            onDismiss = { showThemeDialog = false },
            onThemeSelected = { theme ->
                viewModel.setDarkThemeConfig(theme)
                showThemeDialog = false
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings)) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Appearance Section
            item {
                SettingsSectionHeader(title = "Appearance")
            }

            item {
                SettingsCard {
                    SettingsClickableItem(
                        icon = Icons.Rounded.DarkMode,
                        iconColor = Indigo600,
                        title = "Theme",
                        subtitle = when (userPreferences.darkThemeConfig) {
                            DarkThemeConfig.FOLLOW_SYSTEM -> "Follow system"
                            DarkThemeConfig.LIGHT -> "Light"
                            DarkThemeConfig.DARK -> "Dark"
                        },
                        onClick = { showThemeDialog = true }
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(start = 56.dp),
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
                    )

                    SettingsSwitchItem(
                        icon = Icons.Rounded.Palette,
                        iconColor = Purple600,
                        title = "Dynamic colors",
                        subtitle = "Use colors from your wallpaper",
                        checked = userPreferences.useDynamicColor,
                        onCheckedChange = { viewModel.setUseDynamicColor(it) }
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(start = 56.dp),
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
                    )

                    SettingsSwitchItem(
                        icon = Icons.Rounded.ViewCompact,
                        iconColor = Blue500,
                        title = "Compact view",
                        subtitle = "Show more content on screen",
                        checked = userPreferences.compactViewEnabled,
                        onCheckedChange = { viewModel.setCompactViewEnabled(it) }
                    )
                }
            }

            // Notifications Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader(title = "Notifications")
            }

            item {
                SettingsCard {
                    SettingsSwitchItem(
                        icon = Icons.Rounded.Notifications,
                        iconColor = WarningAmber,
                        title = "Push notifications",
                        subtitle = "Receive notifications on this device",
                        checked = userPreferences.notificationsEnabled,
                        onCheckedChange = { viewModel.setNotificationsEnabled(it) }
                    )

                    AnimatedVisibility(visible = userPreferences.notificationsEnabled) {
                        Column {
                            HorizontalDivider(
                                modifier = Modifier.padding(start = 56.dp),
                                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
                            )

                            SettingsSwitchItem(
                                icon = Icons.Rounded.FlightTakeoff,
                                iconColor = SuccessGreen,
                                title = "Leave reminders",
                                subtitle = "Upcoming leave notifications",
                                checked = userPreferences.leaveRemindersEnabled,
                                onCheckedChange = { viewModel.setLeaveRemindersEnabled(it) }
                            )

                            HorizontalDivider(
                                modifier = Modifier.padding(start = 56.dp),
                                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
                            )

                            SettingsSwitchItem(
                                icon = Icons.Rounded.Approval,
                                iconColor = ErrorRed,
                                title = "Approval reminders",
                                subtitle = "Pending approval alerts",
                                checked = userPreferences.approvalRemindersEnabled,
                                onCheckedChange = { viewModel.setApprovalRemindersEnabled(it) }
                            )
                        }
                    }
                }
            }

            // Security Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader(title = "Security")
            }

            item {
                SettingsCard {
                    SettingsSwitchItem(
                        icon = Icons.Rounded.Fingerprint,
                        iconColor = Indigo600,
                        title = "Biometric unlock",
                        subtitle = "Use fingerprint or face to unlock",
                        checked = userPreferences.biometricEnabled,
                        onCheckedChange = { viewModel.setBiometricEnabled(it) }
                    )

                    if (onNavigateToChangePassword != null) {
                        HorizontalDivider(
                            modifier = Modifier.padding(start = 56.dp),
                            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
                        )

                        SettingsClickableItem(
                            icon = Icons.Rounded.Lock,
                            iconColor = Blue500,
                            title = "Change password",
                            subtitle = "Update your account password",
                            onClick = onNavigateToChangePassword
                        )
                    }
                }
            }

            // Integrations Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader(title = "Integrations")
            }

            item {
                SettingsCard {
                    SettingsClickableItem(
                        icon = Icons.Rounded.People,
                        iconColor = SuccessGreen,
                        title = stringResource(R.string.delegation),
                        subtitle = "Manage approval delegation",
                        onClick = onNavigateToDelegation
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(start = 56.dp),
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
                    )

                    SettingsClickableItem(
                        icon = Icons.Rounded.CalendarMonth,
                        iconColor = Purple600,
                        title = stringResource(R.string.calendar_integration),
                        subtitle = "Sync with Google or Outlook",
                        onClick = onNavigateToCalendarIntegration
                    )
                }
            }

            // About & Account Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SettingsSectionHeader(title = "About")
            }

            item {
                SettingsCard {
                    SettingsInfoItem(
                        icon = Icons.Rounded.Info,
                        iconColor = Blue500,
                        title = "App version",
                        value = "1.0.0"
                    )
                }
            }

            if (onLogout != null) {
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedButton(
                        onClick = onLogout,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = ErrorRed
                        ),
                        border = ButtonDefaults.outlinedButtonBorder(enabled = true).copy(
                            brush = androidx.compose.ui.graphics.SolidColor(ErrorRed.copy(alpha = 0.5f))
                        )
                    ) {
                        Icon(Icons.AutoMirrored.Rounded.Logout, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Sign out")
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
    )
}

@Composable
private fun SettingsCard(content: @Composable () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
        )
    ) {
        Column {
            content()
        }
    }
}

@Composable
private fun SettingsClickableItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconColor.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(
                Icons.Rounded.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun SettingsSwitchItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(iconColor.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(22.dp)
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = MaterialTheme.colorScheme.onPrimary,
                checkedTrackColor = MaterialTheme.colorScheme.primary
            )
        )
    }
}

@Composable
private fun SettingsInfoItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(iconColor.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(22.dp)
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Text(
            title,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1f)
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ThemeSelectionDialog(
    currentTheme: DarkThemeConfig,
    onDismiss: () -> Unit,
    onThemeSelected: (DarkThemeConfig) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Rounded.DarkMode,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
        },
        title = {
            Text("Choose theme")
        },
        text = {
            Column(
                modifier = Modifier.selectableGroup()
            ) {
                ThemeOption(
                    title = "System default",
                    subtitle = "Follow device settings",
                    selected = currentTheme == DarkThemeConfig.FOLLOW_SYSTEM,
                    onClick = { onThemeSelected(DarkThemeConfig.FOLLOW_SYSTEM) }
                )
                ThemeOption(
                    title = "Light",
                    subtitle = "Always use light theme",
                    selected = currentTheme == DarkThemeConfig.LIGHT,
                    onClick = { onThemeSelected(DarkThemeConfig.LIGHT) }
                )
                ThemeOption(
                    title = "Dark",
                    subtitle = "Always use dark theme",
                    selected = currentTheme == DarkThemeConfig.DARK,
                    onClick = { onThemeSelected(DarkThemeConfig.DARK) }
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun ThemeOption(
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .selectable(
                selected = selected,
                onClick = onClick,
                role = Role.RadioButton
            )
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(
            selected = selected,
            onClick = null
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
