package com.cdbl.leavemanager.ui.employees

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeDetailScreen(
    token: String,
    employeeId: Int,
    onBackClick: () -> Unit,
    viewModel: EmployeeDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(employeeId) {
        viewModel.loadEmployee(token, employeeId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Employee Overview") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> {
                Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            uiState.error != null -> {
                Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text(uiState.error ?: "Failed to load employee", color = MaterialTheme.colorScheme.error)
                }
            }
            uiState.employee != null -> {
                val employee = uiState.employee!!
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(employee.name, style = MaterialTheme.typography.titleLarge)
                                Text("${employee.role} • ${employee.department ?: "No department"}", style = MaterialTheme.typography.bodyMedium)
                                if (employee.manager != null) {
                                    Text("Manager: ${employee.manager}", style = MaterialTheme.typography.bodySmall)
                                }
                                Text(employee.email, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }

                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatCard("Pending", employee.stats.pendingRequests.toString(), Modifier.weight(1f))
                            StatCard("On Leave", employee.stats.employeesOnLeave.toString(), Modifier.weight(1f))
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatCard("Avg Time", "${employee.stats.avgApprovalTime}d", Modifier.weight(1f))
                            StatCard("Leaves YTD", employee.stats.totalLeavesThisYear.toString(), Modifier.weight(1f))
                        }
                    }

                    item {
                        Text("Balances", style = MaterialTheme.typography.titleMedium)
                    }

                    items(employee.balances) { balance ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(balance.type, style = MaterialTheme.typography.titleSmall)
                                Text("Used ${balance.used} of ${balance.total}", style = MaterialTheme.typography.bodySmall)
                                LinearProgressIndicator(
                                    progress = if (balance.total == 0) 0f else balance.used.toFloat() / balance.total.toFloat(),
                                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                                )
                            }
                        }
                    }

                    item {
                        Text("Recent History", style = MaterialTheme.typography.titleMedium)
                    }

                    items(employee.history) { entry ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        ) {
                            ListItem(
                                headlineContent = { Text(entry.type) },
                                supportingContent = { Text("${entry.start} → ${entry.end}") },
                                trailingContent = { Text(entry.status) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium)
            Text(value, style = MaterialTheme.typography.titleLarge)
        }
    }
}
