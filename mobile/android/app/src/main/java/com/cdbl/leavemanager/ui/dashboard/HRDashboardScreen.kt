package com.cdbl.leavemanager.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.components.TrendsChart

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HRDashboardScreen(
    token: String,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var stats by remember { mutableStateOf<com.cdbl.leavemanager.data.model.HRAdminStats?>(null) }
    var isLoadingStats by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.loadDashboard(token) // Loads balance, analytics, etc.
        viewModel.fetchHRStats(token).onSuccess {
            stats = it
            isLoadingStats = false
        }.onFailure {
            isLoadingStats = false
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text(stringResource(R.string.admin_console)) }) }
    ) { padding ->
        if (uiState.isLoading || isLoadingStats) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .padding(padding)
                    .padding(horizontal = 24.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
                contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp)
            ) {
                // Section 1: Workload
                item {
                    Text(
                        text = "Operations Overview",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        KpiCard(
                            "Pending Queue",
                            stats?.pendingRequests?.toString() ?: "0",
                            "Awaiting review",
                            Modifier.weight(1f),
                            Color(0xFFE3F2FD),
                            Color(0xFF1565C0)
                        )
                         KpiCard(
                            "Avg. Time",
                            "${stats?.avgApprovalTime ?: 0}d",
                            "Processing speed",
                            Modifier.weight(1f),
                            Color(0xFFE8F5E9),
                            Color(0xFF2E7D32)
                        )
                    }
                }

                // Section 2: Trends Chart
                item {
                    Column {
                        Text(
                            text = "Leave Usage Trends",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                if (uiState.analytics != null && uiState.analytics!!.monthlyTrend.isNotEmpty()) {
                                    TrendsChart(
                                        data = uiState.analytics!!.monthlyTrend,
                                        modifier = Modifier.height(220.dp)
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(220.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            "Insufficient trend data available",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Section 3: Organization Metrics
                item {
                    Text(
                        text = "Organization Health",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        CompactStatCard("On Leave", stats?.employeesOnLeave?.toString() ?: "0", Modifier.weight(1f))
                        CompactStatCard("Utilization", "${stats?.teamUtilization ?: 0}%", Modifier.weight(1f))
                        CompactStatCard("Compliance", "${stats?.complianceScore ?: 0}%", Modifier.weight(1f))
                    }
                }

                // Section 4: Quick Actions
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Pending Actions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = if ((stats?.pendingRequests ?: 0) > 0) {
                                    "There are ${stats?.pendingRequests} requests waiting for your review."
                                } else {
                                    "Great job! Your queue is currently empty."
                                },
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { /* Navigate to approvals */ },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Open Review Panel")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KpiCard(title: String, value: String, subtitle: String, modifier: Modifier = Modifier, bg: Color, contentColor: Color) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = bg),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, color = contentColor.copy(alpha = 0.8f))
            Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = contentColor)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = contentColor.copy(alpha = 0.8f))
        }
    }
}

@Composable
fun CompactStatCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
         colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha=0.3f)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
             Text(title, style = MaterialTheme.typography.labelSmall, textAlign = androidx.compose.ui.text.style.TextAlign.Center, maxLines = 1)
        }
    }
}