package com.cdbl.leavemanager.ui.dashboard

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Assignment
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.RotateLeft
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.ManagerLeaveResponse
import com.cdbl.leavemanager.ui.theme.ErrorRed
import com.cdbl.leavemanager.ui.theme.Indigo600
import com.cdbl.leavemanager.ui.theme.SuccessGreen
import com.cdbl.leavemanager.ui.theme.WarningAmber

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManagerDashboardScreen(
    token: String,
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToApprovals: () -> Unit,
    onNavigateToDetail: (Int) -> Unit
) {
    var managerData by remember { mutableStateOf<ManagerLeaveResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.fetchManagerPendingLeaves(token).onSuccess {
            managerData = it
            isLoading = false
        }.onFailure {
            isLoading = false
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Manager Dashboard") }) }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            // KPI Grid
            if (managerData != null) {
                val counts = managerData!!.counts
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        ManagerKPICard(
                            title = "Pending", 
                            value = counts.pending.toString(), 
                            icon = Icons.Rounded.Assignment, 
                            color = WarningAmber, 
                            modifier = Modifier.weight(1f), 
                            onClick = onNavigateToApprovals
                        )
                        ManagerKPICard(
                            title = "Forwarded", 
                            value = counts.forwarded.toString(), 
                            icon = Icons.Rounded.CheckCircle, 
                            color = SuccessGreen, 
                            modifier = Modifier.weight(1f), 
                            onClick = {}
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        ManagerKPICard(
                            title = "Returned", 
                            value = counts.returned.toString(), 
                            icon = Icons.Rounded.RotateLeft, 
                            color = Indigo600, 
                            modifier = Modifier.weight(1f), 
                            onClick = {}
                        )
                        ManagerKPICard(
                            title = "Cancelled", 
                            value = counts.cancelled.toString(), 
                            icon = Icons.Rounded.Close, 
                            color = ErrorRed, 
                            modifier = Modifier.weight(1f), 
                            onClick = {}
                        )
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            } else if (isLoading) {
                 Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = androidx.compose.ui.Alignment.Center) {
                     CircularProgressIndicator()
                 }
            }

            Text("Pending Requests", style = MaterialTheme.typography.titleMedium)
            LazyColumn {
                val rows = managerData?.rows ?: emptyList()
                if (rows.isEmpty() && !isLoading) {
                    item { Text("No pending requests", modifier = Modifier.padding(top = 16.dp)) }
                }
                items(rows.take(5)) { leave ->
                    ListItem(
                        headlineContent = { Text(leave.type) },
                        supportingContent = { Text("${leave.startDate} to ${leave.endDate}") },
                        trailingContent = { Text(leave.status) },
                        modifier = Modifier.clickable { onNavigateToDetail(leave.id) }
                    )
                    Divider()
                }
            }
        }
    }
}

@Composable
fun ManagerKPICard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        modifier = modifier.clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(icon, contentDescription = null, tint = color)
            Spacer(modifier = Modifier.height(8.dp))
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(title, style = MaterialTheme.typography.bodySmall)
        }
    }
}
