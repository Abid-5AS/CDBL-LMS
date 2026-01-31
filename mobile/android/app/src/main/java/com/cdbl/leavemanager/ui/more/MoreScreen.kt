package com.cdbl.leavemanager.ui.more

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoreScreen(
    onNavigateToProfile: () -> Unit,
    onNavigateToLeaves: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToHolidays: () -> Unit,
    onNavigateToCalendar: () -> Unit,
    onNavigateToPolicies: () -> Unit,
    onNavigateToHelp: () -> Unit,
    onNavigateToFeedback: () -> Unit,
    onNavigateToTerms: () -> Unit,
    onNavigateToPrivacy: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.more_title)) },
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
            // Account Section
            item {
                SectionHeader("Account")
            }
            item {
                GroupedCard {
                    MoreMenuItem(
                        icon = Icons.Rounded.Person,
                        iconColor = Indigo600,
                        title = stringResource(R.string.profile_title),
                        onClick = onNavigateToProfile
                    )
                    MenuDivider()
                    MoreMenuItem(
                        icon = Icons.Rounded.Notifications,
                        iconColor = ErrorRed,
                        title = stringResource(R.string.notifications),
                        onClick = onNavigateToNotifications
                    )
                    MenuDivider()
                    MoreMenuItem(
                        icon = Icons.Rounded.Settings,
                        iconColor = Slate500,
                        title = stringResource(R.string.settings),
                        onClick = onNavigateToSettings
                    )
                }
            }

            // Leave Management Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SectionHeader("Leave Management")
            }
            item {
                GroupedCard {
                    MoreMenuItem(
                        icon = Icons.Rounded.History,
                        iconColor = Blue500,
                        title = stringResource(R.string.nav_leaves),
                        subtitle = "View your leave history",
                        onClick = onNavigateToLeaves
                    )
                    MenuDivider()
                    MoreMenuItem(
                        icon = Icons.Rounded.CalendarMonth,
                        iconColor = SuccessGreen,
                        title = stringResource(R.string.holidays),
                        subtitle = "Upcoming holidays",
                        onClick = onNavigateToHolidays
                    )
                    MenuDivider()
                    MoreMenuItem(
                        icon = Icons.Rounded.Event,
                        iconColor = Purple600,
                        title = stringResource(R.string.calendar_integration),
                        subtitle = "Sync with your calendar",
                        onClick = onNavigateToCalendar
                    )
                }
            }

            // Resources Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SectionHeader("Resources")
            }
            item {
                GroupedCard {
                    MoreMenuItem(
                        icon = Icons.Rounded.Description,
                        iconColor = WarningAmber,
                        title = stringResource(R.string.policies),
                        subtitle = "Leave policies & guidelines",
                        onClick = onNavigateToPolicies
                    )
                    MenuDivider()
                    MoreMenuItem(
                        icon = Icons.Rounded.Help,
                        iconColor = Blue500,
                        title = stringResource(R.string.help_support),
                        subtitle = "FAQs & support",
                        onClick = onNavigateToHelp
                    )
                    MenuDivider()
                    MoreMenuItem(
                        icon = Icons.Rounded.Email,
                        iconColor = Indigo600,
                        title = stringResource(R.string.feedback),
                        subtitle = "Send us your thoughts",
                        onClick = onNavigateToFeedback
                    )
                }
            }

            // Legal Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SectionHeader("Legal")
            }
            item {
                GroupedCard {
                    MoreMenuItem(
                        icon = Icons.Rounded.Article,
                        iconColor = Slate500,
                        title = stringResource(R.string.terms),
                        onClick = onNavigateToTerms
                    )
                    MenuDivider()
                    MoreMenuItem(
                        icon = Icons.Rounded.Lock,
                        iconColor = Slate500,
                        title = stringResource(R.string.privacy),
                        onClick = onNavigateToPrivacy
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "CDBL Leave Manager v1.0.0",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
    )
}

@Composable
private fun GroupedCard(content: @Composable () -> Unit) {
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
private fun MenuDivider() {
    HorizontalDivider(
        modifier = Modifier.padding(start = 72.dp),
        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MoreMenuItem(
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
                Icons.Rounded.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
