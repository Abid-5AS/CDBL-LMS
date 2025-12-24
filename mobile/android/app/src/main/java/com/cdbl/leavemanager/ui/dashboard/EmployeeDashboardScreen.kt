package com.cdbl.leavemanager.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.FlightTakeoff
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.BeachAccess
import androidx.compose.material.icons.rounded.Bed
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.Flight
import androidx.compose.material.icons.rounded.FlightTakeoff
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Medication
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.NotificationsNone
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Sick
import androidx.compose.material.icons.rounded.Weekend
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.theme.*
import com.cdbl.leavemanager.ui.components.FullScreenLoading
import com.cdbl.leavemanager.ui.components.ErrorView
import com.cdbl.leavemanager.ui.components.KpiCard
import androidx.compose.animation.*
import androidx.compose.animation.core.tween


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeDashboardScreen(
    token: String,
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToApply: () -> Unit = {},
    onNavigateToEncashment: () -> Unit = {},
    onNavigateToApprovals: () -> Unit = {},
    onNavigateToLeaveDetails: (Int) -> Unit = {}
) {
    // Collect UI State
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadDashboard(token)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToApply,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.size(64.dp)
            ) {
                Icon(Icons.Rounded.Add, contentDescription = stringResource(R.string.apply_leave), modifier = Modifier.size(32.dp))
            }
        }
    ) { paddingValues ->
            if (state.isLoading) {
                 FullScreenLoading()
            } else if (state.error != null) {
                 ErrorView(message = state.error!!, onRetry = { viewModel.loadDashboard(token) })
            } else {
                AnimatedVisibility(
                    visible = true,
                    enter = fadeIn(animationSpec = tween(500)) + slideInVertically(initialOffsetY = { 50 }, animationSpec = tween(500))
                ) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 24.dp),
                        verticalArrangement = Arrangement.spacedBy(32.dp),
                        contentPadding = PaddingValues(bottom = 80.dp) // Add padding for FAB space
                    ) {
                        // Header
                        item {
                            Spacer(modifier = Modifier.height(24.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Thursday, Oct 26", // TODO: Use real date
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = stringResource(R.string.good_morning),
                                            style = MaterialTheme.typography.headlineMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onBackground
                                        )
                                    }
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    IconButton(
                                        onClick = { /*TODO*/ },
                                        modifier = Modifier
                                            .background(MaterialTheme.colorScheme.surface, CircleShape)
                                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f), CircleShape)
                                    ) {
                                        Icon(
                                            Icons.Rounded.NotificationsNone,
                                            contentDescription = stringResource(R.string.notifications),
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    // Profile Placeholder
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.primaryContainer)
                                            .border(2.dp, MaterialTheme.colorScheme.surface, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Outlined.Person, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer)
                                    }
                                }
                            }
                        }
                        
                        // Action Center (Conditional) - Moved to top for priority
                         if (state.needsAttentionCount > 0) {
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = ErrorRed.copy(alpha = 0.1f)),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.fillMaxWidth().clickable { onNavigateToApprovals() }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Rounded.Notifications, contentDescription = null, tint = ErrorRed)
                                        Spacer(modifier = Modifier.width(16.dp))
                                        Column {
                                            Text(stringResource(R.string.action_required), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = ErrorRed)
                                            Text(stringResource(R.string.returned_requests, state.needsAttentionCount), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                                        }
                                    }
                                }
                            }
                        }

                        // KPI Grid
                        item {
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    // Needs Attention
                                     KpiCard(
                                         title = stringResource(R.string.needs_action),
                                         value = state.needsAttentionCount.toString(),
                                         subtitle = "Returned/Rejected",
                                         modifier = Modifier.weight(1f),
                                         bg = if (state.needsAttentionCount > 0) ErrorRed.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant,
                                         contentColor = if (state.needsAttentionCount > 0) ErrorRed else MaterialTheme.colorScheme.onSurfaceVariant
                                     )
                                     // Under Review
                                     KpiCard(
                                         title = stringResource(R.string.under_review),
                                         value = state.underReviewCount.toString(),
                                         subtitle = stringResource(R.string.pending_requests),
                                         modifier = Modifier.weight(1f),
                                         bg = if (state.underReviewCount > 0) WarningAmber.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant,
                                         contentColor = if (state.underReviewCount > 0) WarningAmber else MaterialTheme.colorScheme.onSurfaceVariant
                                     )
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    // Total Balance
                                    KpiCard(
                                         title = stringResource(R.string.total_balance),
                                         value = "${state.balance?.EARNED?.toInt() ?: 0}",
                                         subtitle = "Earned Leave",
                                         modifier = Modifier.weight(1f),
                                         bg = Indigo600.copy(alpha = 0.1f),
                                         contentColor = Indigo600
                                     )
                                     // Next Leave
                                     KpiCard(
                                         title = stringResource(R.string.next_leave),
                                         value = state.nextApprovedLeave?.let { "${it.startDate.take(10)}" } ?: "-",
                                         subtitle = state.nextApprovedLeave?.type ?: "None booked",
                                         modifier = Modifier.weight(1f),
                                         bg = SuccessGreen.copy(alpha = 0.1f),
                                         contentColor = SuccessGreen
                                     )
                                }
                            }
                        }

                        // Leave Balance Carousel
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                Text(
                                    text = stringResource(R.string.leave_balance),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = stringResource(R.string.view_all),
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            if (state.balance != null) {
                                val realBalances = listOf(
                                    BalanceItem("Earned Leave", state.balance!!.EARNED.toInt(), 33, Indigo600, Icons.Rounded.FlightTakeoff),
                                    BalanceItem("Casual Leave", state.balance!!.CASUAL.toInt(), 10, WarningAmber, Icons.Rounded.BeachAccess),
                                    BalanceItem("Medical Leave", state.balance!!.MEDICAL.toInt(), 14, ErrorRed, Icons.Rounded.Medication)
                                )
                                
                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    items(realBalances) { item ->
                                        BalanceCardNew(item)
                                    }
                                }
                            }
                        }

                        // Who's Out Today
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = stringResource(R.string.whos_out),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                IconButton(
                                    onClick = { /*TODO*/ },
                                    modifier = Modifier.size(32.dp).background(MaterialTheme.colorScheme.surfaceVariant, CircleShape)
                                ) {
                                    Icon(Icons.Rounded.CalendarMonth, contentDescription = null, modifier = Modifier.size(16.dp))
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                                shape = RoundedCornerShape(20.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(20.dp)) {
                                    if (state.whosOutToday.isNotEmpty()) {
                                         Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                                            state.whosOutToday.take(4).forEach { member ->
                                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(56.dp)
                                                            .clip(CircleShape)
                                                            .background(MaterialTheme.colorScheme.primaryContainer),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                         Icon(Icons.Outlined.Person, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer)
                                                    }
                                                    Spacer(modifier = Modifier.height(8.dp))
                                                    Text(
                                                        member.employeeName.split(" ").firstOrNull() ?: member.employeeName, 
                                                        style = MaterialTheme.typography.labelMedium
                                                    )
                                                }
                                            }
                                        }
                                    } else {
                                        Text(
                                            stringResource(R.string.everyone_present),
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.padding(vertical = 12.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
    }
}

data class BalanceItem(val title: String, val left: Int, val total: Int, val color: Color, val icon: ImageVector)

@Composable
fun BalanceCardNew(item: BalanceItem) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.05f)),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.width(280.dp) // Fixed width for carousel
    ) {
        Box(modifier = Modifier.padding(20.dp)) {
            // Icon Background
            Icon(
                item.icon,
                contentDescription = null,
                tint = item.color.copy(alpha = 0.1f),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(64.dp)
                    .offset(x = 10.dp, y = (-10).dp)
            )

            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(item.title, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text("${item.left}", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold, color = item.color)
                            Text(" " + stringResource(R.string.days_left), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(bottom = 6.dp))
                        }
                    }
                    // Circular Progress
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(64.dp)) {
                        CircularProgressIndicator(
                            progress = 1f,
                            modifier = Modifier.fillMaxSize(),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            strokeWidth = 6.dp,
                             trackColor =  MaterialTheme.colorScheme.surfaceVariant,
                        )
                        CircularProgressIndicator(
                            progress = item.left.toFloat() / item.total,
                            modifier = Modifier.fillMaxSize(),
                            color = item.color,
                            strokeWidth = 6.dp,
                            strokeCap = StrokeCap.Round
                        )
                        Text(
                            "${(item.left.toFloat() / item.total * 100).toInt()}%",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Spacer(modifier = Modifier.height(20.dp))
                // Footer
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(item.color, CircleShape))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(stringResource(R.string.used) + ": ${item.total - item.left}", style = MaterialTheme.typography.labelSmall)
                    }
                    Text(stringResource(R.string.total) + ": ${item.total}", style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}