package com.cdbl.leavemanager.ui.reports

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.TrendingDown
import androidx.compose.material.icons.automirrored.rounded.TrendingUp
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.theme.*
import com.cdbl.leavemanager.ui.designsystem.component.CDBLLoadingWheel

enum class ReportTab(val title: String, val icon: ImageVector) {
    OVERVIEW("Overview", Icons.Rounded.Dashboard),
    LEAVE_SUMMARY("Leave Summary", Icons.Rounded.FlightTakeoff),
    TEAM_ANALYTICS("Team Analytics", Icons.Rounded.Groups),
    SCHEDULED("Scheduled", Icons.Rounded.Schedule)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    token: String,
    onBackClick: () -> Unit,
    viewModel: ReportsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(ReportTab.OVERVIEW) }

    LaunchedEffect(Unit) {
        viewModel.loadReports(token)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.reports)) },
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Tab Row
            ScrollableTabRow(
                selectedTabIndex = ReportTab.entries.indexOf(selectedTab),
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary,
                edgePadding = 16.dp,
                divider = {}
            ) {
                ReportTab.entries.forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        text = { Text(tab.title) },
                        icon = { Icon(tab.icon, contentDescription = null, modifier = Modifier.size(18.dp)) }
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

            // Content
            AnimatedVisibility(
                visible = true,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                when (selectedTab) {
                    ReportTab.OVERVIEW -> OverviewContent(uiState)
                    ReportTab.LEAVE_SUMMARY -> LeaveSummaryContent(uiState)
                    ReportTab.TEAM_ANALYTICS -> TeamAnalyticsContent(uiState)
                    ReportTab.SCHEDULED -> ScheduledReportsContent(uiState)
                }
            }
        }
    }
}

@Composable
private fun OverviewContent(uiState: ReportsUiState) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Quick Stats Cards
        item {
            Text(
                "Quick Stats",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Total Leaves",
                    value = "247",
                    trend = "+12%",
                    isPositive = true,
                    icon = Icons.Rounded.FlightTakeoff,
                    color = Indigo600,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Approval Rate",
                    value = "94%",
                    trend = "+3%",
                    isPositive = true,
                    icon = Icons.Rounded.CheckCircle,
                    color = SuccessGreen,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Pending",
                    value = "12",
                    trend = "-5",
                    isPositive = false,
                    icon = Icons.Rounded.Pending,
                    color = WarningAmber,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Avg Duration",
                    value = "3.2",
                    trend = "days",
                    isPositive = true,
                    icon = Icons.Rounded.AccessTime,
                    color = Blue500,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Leave Type Breakdown
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Leave Type Breakdown",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            LeaveTypeBreakdownCard()
        }

        // Recent Activity
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Recent Activity",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        items(3) { index ->
            ActivityItem(
                name = listOf("John Doe", "Jane Smith", "Mike Johnson")[index],
                action = listOf("Leave Approved", "Leave Applied", "Leave Returned")[index],
                time = listOf("2 hours ago", "5 hours ago", "1 day ago")[index],
                color = listOf(SuccessGreen, Indigo600, WarningAmber)[index]
            )
        }
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    trend: String,
    isPositive: Boolean,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(color.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        icon,
                        contentDescription = null,
                        tint = color,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (isPositive) Icons.AutoMirrored.Rounded.TrendingUp
                        else Icons.AutoMirrored.Rounded.TrendingDown,
                        contentDescription = null,
                        tint = if (isPositive) SuccessGreen else ErrorRed,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        trend,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isPositive) SuccessGreen else ErrorRed
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                title,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun LeaveTypeBreakdownCard() {
    val leaveTypes = listOf(
        Triple("Earned Leave", 45, Indigo600),
        Triple("Casual Leave", 30, WarningAmber),
        Triple("Medical Leave", 25, ErrorRed)
    )

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            leaveTypes.forEach { (name, percentage, color) ->
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(color, CircleShape)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(name, style = MaterialTheme.typography.bodyMedium)
                        }
                        Text(
                            "${percentage}%",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { percentage / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = color,
                        trackColor = color.copy(alpha = 0.1f),
                        strokeCap = StrokeCap.Round
                    )
                }
            }
        }
    }
}

@Composable
private fun ActivityItem(
    name: String,
    action: String,
    time: String,
    color: Color
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    name.first().toString(),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    action,
                    style = MaterialTheme.typography.bodySmall,
                    color = color
                )
            }
            Text(
                time,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun LeaveSummaryContent(uiState: ReportsUiState) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Leave Summary Report",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Filter by date range, department, or employee",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Filters
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(listOf("This Month", "Last 3 Months", "This Year", "Custom")) { filter ->
                    FilterChip(
                        selected = filter == "This Month",
                        onClick = {},
                        label = { Text(filter) }
                    )
                }
            }
        }

        // Summary Cards
        item {
            Spacer(modifier = Modifier.height(8.dp))
            LeaveSummaryCard("Earned Leave", 20, 5, 15, Indigo600)
        }
        item { LeaveSummaryCard("Casual Leave", 10, 3, 7, WarningAmber) }
        item { LeaveSummaryCard("Medical Leave", 14, 2, 12, ErrorRed) }
    }
}

@Composable
private fun LeaveSummaryCard(
    title: String,
    total: Int,
    used: Int,
    remaining: Int,
    color: Color
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(color.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "${remaining}",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = color
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$total", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("Total", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$used", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = ErrorRed)
                    Text("Used", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$remaining", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = SuccessGreen)
                    Text("Remaining", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = { used.toFloat() / total },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = color,
                trackColor = color.copy(alpha = 0.1f),
                strokeCap = StrokeCap.Round
            )
        }
    }
}

@Composable
private fun TeamAnalyticsContent(uiState: ReportsUiState) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                "Team Analytics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        // Team Stats
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Team Availability", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Medium)
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                "23",
                                style = MaterialTheme.typography.displaySmall,
                                fontWeight = FontWeight.Bold,
                                color = SuccessGreen
                            )
                            Text("Present Today", style = MaterialTheme.typography.labelSmall)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                "2",
                                style = MaterialTheme.typography.displaySmall,
                                fontWeight = FontWeight.Bold,
                                color = WarningAmber
                            )
                            Text("On Leave", style = MaterialTheme.typography.labelSmall)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                "25",
                                style = MaterialTheme.typography.displaySmall,
                                fontWeight = FontWeight.Bold,
                                color = Indigo600
                            )
                            Text("Total", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
        }

        // Top Leave Takers
        item {
            Text(
                "Top Leave Utilization",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        items(5) { index ->
            TeamMemberLeaveCard(
                rank = index + 1,
                name = listOf("John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson", "Tom Brown")[index],
                department = listOf("Engineering", "Marketing", "Engineering", "HR", "Finance")[index],
                daysUsed = listOf(18, 15, 12, 10, 8)[index],
                total = 44
            )
        }
    }
}

@Composable
private fun TeamMemberLeaveCard(
    rank: Int,
    name: String,
    department: String,
    daysUsed: Int,
    total: Int
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "#$rank",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.width(32.dp)
            )
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    name.first().toString(),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                Text(department, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    "$daysUsed days",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "${(daysUsed * 100 / total)}% used",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ScheduledReportsContent(uiState: ReportsUiState) {
    when {
        uiState.isLoading -> Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CDBLLoadingWheel(contentDesc = "Loading reports")
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
                    uiState.error ?: "Failed to load reports",
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
        uiState.reports.isEmpty() -> Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Rounded.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    stringResource(R.string.reports_empty),
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    "Scheduled reports will appear here",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        else -> LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(uiState.reports) { report ->
                ScheduledReportCard(
                    name = report.name,
                    type = report.reportType,
                    frequency = report.frequency,
                    isActive = report.isActive
                )
            }
        }
    }
}

@Composable
private fun ScheduledReportCard(
    name: String,
    type: String,
    frequency: String,
    isActive: Boolean
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Rounded.Description,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    "$type • $frequency",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (isActive) SuccessGreen.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant
            ) {
                Text(
                    if (isActive) "Active" else "Paused",
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Medium,
                    color = if (isActive) SuccessGreen else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
