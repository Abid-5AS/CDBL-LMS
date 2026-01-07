package com.cdbl.leavemanager.ui.profile

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.theme.*
import com.cdbl.leavemanager.ui.designsystem.component.CDBLLoadingWheel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    token: String,
    onLogout: () -> Unit,
    onNavigateToHolidays: () -> Unit,
    onNavigateToChangePassword: () -> Unit,
    onNavigateToEditProfile: () -> Unit,
    onNavigateToPolicies: () -> Unit,
    onNavigateToHelp: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToSettings: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadProfile(token)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        when {
            uiState.isLoading -> Box(
                Modifier.fillMaxSize().padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CDBLLoadingWheel(contentDesc = "Loading profile")
            }
            uiState.error != null -> Box(
                Modifier.fillMaxSize().padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Rounded.ErrorOutline,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        stringResource(R.string.error_load_profile),
                        color = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { viewModel.loadProfile(token) }) {
                        Text(stringResource(R.string.retry))
                    }
                }
            }
            uiState.user != null -> {
                val user = uiState.user!!
                
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(bottom = 32.dp)
                ) {
                    // Profile Header Card
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    brush = Brush.verticalGradient(
                                        colors = listOf(
                                            Indigo600,
                                            Indigo700
                                        )
                                    )
                                )
                                .padding(24.dp)
                        ) {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                // Avatar
                                Box(
                                    modifier = Modifier
                                        .size(88.dp)
                                        .clip(CircleShape)
                                        .background(Color.White),
                                    contentAlignment = Alignment.Center
                                ) {
                                    val initials = user.name?.split(" ")
                                        ?.take(2)
                                        ?.mapNotNull { it.firstOrNull() }
                                        ?.joinToString("") ?: "U"
                                    Text(
                                        initials.uppercase(),
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Indigo600
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                // Name
                                Text(
                                    text = user.name ?: "User",
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                
                                // Role & Department
                                Text(
                                    text = "${user.role.replace("_", " ")} • ${user.department}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color.White.copy(alpha = 0.8f)
                                )
                                
                                Spacer(modifier = Modifier.height(4.dp))
                                
                                // Email
                                Row(
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Rounded.Email,
                                        contentDescription = null,
                                        tint = Color.White.copy(alpha = 0.7f),
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = user.email,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color.White.copy(alpha = 0.7f)
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                // Edit Profile Button
                                OutlinedButton(
                                    onClick = onNavigateToEditProfile,
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        contentColor = Color.White
                                    ),
                                    border = ButtonDefaults.outlinedButtonBorder(enabled = true).copy(
                                        brush = androidx.compose.ui.graphics.SolidColor(Color.White.copy(alpha = 0.5f))
                                    ),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Icon(
                                        Icons.Rounded.Edit,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Edit Profile")
                                }
                            }
                        }
                    }

                    // Quick Actions Section
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        SectionHeader("Quick Actions", modifier = Modifier.padding(horizontal = 16.dp))
                    }

                    item {
                        ProfileMenuCard(
                            modifier = Modifier.padding(horizontal = 16.dp)
                        ) {
                            ProfileMenuItem(
                                icon = Icons.Rounded.Notifications,
                                iconColor = WarningAmber,
                                title = stringResource(R.string.notifications),
                                onClick = onNavigateToNotifications
                            )
                            MenuDivider()
                            ProfileMenuItem(
                                icon = Icons.Rounded.Settings,
                                iconColor = Slate500,
                                title = stringResource(R.string.settings),
                                subtitle = "Theme, notifications, preferences",
                                onClick = onNavigateToSettings
                            )
                        }
                    }

                    // Information Section
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        SectionHeader("Information", modifier = Modifier.padding(horizontal = 16.dp))
                    }

                    item {
                        ProfileMenuCard(
                            modifier = Modifier.padding(horizontal = 16.dp)
                        ) {
                            ProfileMenuItem(
                                icon = Icons.Rounded.Event,
                                iconColor = SuccessGreen,
                                title = stringResource(R.string.holidays),
                                subtitle = "View upcoming holidays",
                                onClick = onNavigateToHolidays
                            )
                            MenuDivider()
                            ProfileMenuItem(
                                icon = Icons.Rounded.Description,
                                iconColor = Blue500,
                                title = stringResource(R.string.policies),
                                subtitle = "Leave policies & guidelines",
                                onClick = onNavigateToPolicies
                            )
                            MenuDivider()
                            ProfileMenuItem(
                                icon = Icons.Rounded.Help,
                                iconColor = Purple600,
                                title = stringResource(R.string.help_support),
                                subtitle = "FAQs & contact support",
                                onClick = onNavigateToHelp
                            )
                        }
                    }

                    // Security Section
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        SectionHeader("Security", modifier = Modifier.padding(horizontal = 16.dp))
                    }

                    item {
                        ProfileMenuCard(
                            modifier = Modifier.padding(horizontal = 16.dp)
                        ) {
                            ProfileMenuItem(
                                icon = Icons.Rounded.Lock,
                                iconColor = Indigo600,
                                title = stringResource(R.string.change_password),
                                onClick = onNavigateToChangePassword
                            )
                        }
                    }

                    // Logout Button
                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                        OutlinedButton(
                            onClick = onLogout,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                                .height(52.dp),
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
                            Text(
                                stringResource(R.string.logout),
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    // App Version
                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            "CDBL Leave Manager v1.0.0",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, modifier: Modifier = Modifier) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        fontWeight = FontWeight.SemiBold,
        modifier = modifier.padding(bottom = 8.dp)
    )
}

@Composable
private fun ProfileMenuCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
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
private fun MenuDivider() {
    HorizontalDivider(
        modifier = Modifier.padding(start = 72.dp),
        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
    )
}

@Composable
private fun ProfileMenuItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String? = null,
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
                if (subtitle != null) {
                    Text(
                        subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Icon(
                Icons.AutoMirrored.Rounded.KeyboardArrowRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
