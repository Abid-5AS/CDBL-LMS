package com.cdbl.leavemanager.ui.notifications

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.data.model.NotificationItem
import com.cdbl.leavemanager.ui.theme.*
import com.cdbl.leavemanager.ui.designsystem.component.CDBLLoadingWheel
import java.time.Duration
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

enum class NotificationFilter(val label: String) {
    ALL("All"),
    UNREAD("Unread"),
    LEAVE("Leave"),
    APPROVAL("Approval"),
    SYSTEM("System")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    token: String,
    onBackClick: () -> Unit,
    viewModel: NotificationsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedFilter by remember { mutableStateOf(NotificationFilter.ALL) }

    LaunchedEffect(Unit) {
        viewModel.loadNotifications(token)
    }

    val filteredItems = remember(uiState.items, selectedFilter) {
        when (selectedFilter) {
            NotificationFilter.ALL -> uiState.items
            NotificationFilter.UNREAD -> uiState.items.filter { !it.read }
            NotificationFilter.LEAVE -> uiState.items.filter { it.type == "leave_applied" || it.type == "leave_approved" || it.type == "leave_rejected" }
            NotificationFilter.APPROVAL -> uiState.items.filter { it.type == "approval_required" || it.type == "approval_pending" }
            NotificationFilter.SYSTEM -> uiState.items.filter { it.type == "system" || it.type == "announcement" }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.nav_notifications))
                        if (uiState.unreadCount > 0) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Badge(
                                containerColor = MaterialTheme.colorScheme.error,
                                contentColor = MaterialTheme.colorScheme.onError
                            ) {
                                Text("${uiState.unreadCount}")
                            }
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (uiState.unreadCount > 0) {
                        TextButton(
                            onClick = { viewModel.markAllAsRead(token) }
                        ) {
                            Text("Mark all read")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Filter Chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(NotificationFilter.entries) { filter ->
                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { selectedFilter = filter },
                        label = {
                            Text(filter.label)
                        },
                        leadingIcon = if (selectedFilter == filter) {
                            {
                                Icon(
                                    Icons.Rounded.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        } else null,
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

            when {
                uiState.isLoading -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CDBLLoadingWheel(contentDesc = "Loading notifications")
                }
                uiState.error != null -> Box(
                    modifier = Modifier.fillMaxSize(),
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
                            uiState.error ?: "Failed to load notifications",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(onClick = { viewModel.loadNotifications(token) }) {
                            Text("Retry")
                        }
                    }
                }
                filteredItems.isEmpty() -> EmptyNotificationsView(filter = selectedFilter)
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Group by date
                    val grouped = filteredItems.groupBy { item ->
                        try {
                            val date = LocalDateTime.parse(item.createdAt.replace("Z", ""))
                            val now = LocalDateTime.now()
                            when {
                                date.toLocalDate() == now.toLocalDate() -> "Today"
                                date.toLocalDate() == now.minusDays(1).toLocalDate() -> "Yesterday"
                                date.toLocalDate().isAfter(now.minusDays(7).toLocalDate()) -> "This Week"
                                else -> "Earlier"
                            }
                        } catch (e: Exception) {
                            "Earlier"
                        }
                    }

                    grouped.forEach { (dateGroup, notifications) ->
                        item {
                            Text(
                                dateGroup,
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }

                        items(notifications, key = { it.id }) { item ->
                            AnimatedVisibility(
                                visible = true,
                                enter = fadeIn() + slideInHorizontally(),
                                exit = fadeOut()
                            ) {
                                NotificationCard(
                                    item = item,
                                    onClick = {
                                        if (!item.read) viewModel.markAsRead(token, item.id)
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationCard(
    item: NotificationItem,
    onClick: () -> Unit
) {
    val (icon, color) = getNotificationIconAndColor(item.type)

    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = if (item.read)
                MaterialTheme.colorScheme.surface
            else
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.1f)
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (item.read) 0.dp else 1.dp
        ),
        border = BorderStroke(
            1.dp,
            if (item.read) MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
            else MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        item.title,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (item.read) FontWeight.Normal else FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    if (!item.read) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(MaterialTheme.colorScheme.primary, CircleShape)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    item.message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    formatTimeAgo(item.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
private fun EmptyNotificationsView(filter: NotificationFilter) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                when (filter) {
                    NotificationFilter.UNREAD -> Icons.Rounded.MarkEmailRead
                    NotificationFilter.LEAVE -> Icons.Rounded.FlightTakeoff
                    NotificationFilter.APPROVAL -> Icons.Rounded.Gavel
                    NotificationFilter.SYSTEM -> Icons.Rounded.Settings
                    else -> Icons.Rounded.Notifications
                },
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                when (filter) {
                    NotificationFilter.UNREAD -> "All caught up!"
                    NotificationFilter.LEAVE -> "No leave notifications"
                    NotificationFilter.APPROVAL -> "No approval notifications"
                    NotificationFilter.SYSTEM -> "No system notifications"
                    else -> stringResource(R.string.notifications_empty)
                },
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                when (filter) {
                    NotificationFilter.UNREAD -> "You have no unread notifications"
                    else -> "Notifications will appear here"
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }
    }
}

private fun getNotificationIconAndColor(type: String): Pair<ImageVector, Color> {
    return when (type) {
        "leave_applied" -> Icons.Rounded.FlightTakeoff to Indigo600
        "leave_approved" -> Icons.Rounded.CheckCircle to SuccessGreen
        "leave_rejected" -> Icons.Rounded.Cancel to ErrorRed
        "leave_returned" -> Icons.Rounded.Replay to WarningAmber
        "approval_required", "approval_pending" -> Icons.Rounded.Gavel to Blue500
        "system", "announcement" -> Icons.Rounded.Campaign to Purple600
        "reminder" -> Icons.Rounded.Alarm to WarningAmber
        else -> Icons.Rounded.Notifications to Indigo600
    }
}

private fun formatTimeAgo(dateString: String): String {
    return try {
        val date = LocalDateTime.parse(dateString.replace("Z", ""))
        val now = LocalDateTime.now()
        val duration = Duration.between(date, now)

        when {
            duration.toMinutes() < 1 -> "Just now"
            duration.toHours() < 1 -> "${duration.toMinutes()}m ago"
            duration.toDays() < 1 -> "${duration.toHours()}h ago"
            duration.toDays() < 7 -> "${duration.toDays()}d ago"
            else -> date.format(DateTimeFormatter.ofPattern("MMM d"))
        }
    } catch (e: Exception) {
        dateString.take(10)
    }
}
