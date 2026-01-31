package com.cdbl.leavemanager.ui.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.DateRange
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.data.model.SystemStatsResponse
import com.cdbl.leavemanager.ui.components.TrendsChart

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    token: String,
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToUsers: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    var stats by remember { mutableStateOf<SystemStatsResponse?>(null) }
    var auditLogs by remember { mutableStateOf<List<com.cdbl.leavemanager.data.model.AuditLog>>(emptyList()) }
    var isLoadingStats by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.loadDashboard(token)
        // Fetch dual data
        val statsResult = viewModel.fetchSystemStats(token)
        val auditsResult = viewModel.fetchAuditLogs(token)
        
        if (statsResult.isSuccess) stats = statsResult.getOrNull()
        if (auditsResult.isSuccess) auditLogs = auditsResult.getOrDefault(emptyList())
        
        isLoadingStats = false
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.admin_console)) })
        }
    ) { padding ->
        if (uiState.isLoading || isLoadingStats) {
             Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(modifier = Modifier.padding(padding).padding(horizontal = 24.dp)) {
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onNavigateToUsers,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primaryContainer, contentColor = MaterialTheme.colorScheme.onPrimaryContainer)
                    ) {
                        Icon(Icons.Rounded.Person, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(stringResource(R.string.manage_users), fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // High Level Stats
                item {
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        AdminStatCard(stringResource(R.string.total_users), stats?.totalEmployees?.toString() ?: "0", Icons.Rounded.Person, Modifier.weight(1f))
                        AdminStatCard(stringResource(R.string.on_leave), stats?.onLeaveToday?.toString() ?: "0", Icons.Rounded.DateRange, Modifier.weight(1f))
                    }
                }

                // Analytics Chart
                item {
                    Text(
                        text = "System Usage Trends",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            if (uiState.analytics != null && uiState.analytics!!.monthlyTrend.isNotEmpty()) {
                                TrendsChart(
                                    data = uiState.analytics!!.monthlyTrend,
                                    modifier = Modifier.height(200.dp)
                                )
                            } else {
                                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                                    Text("Analytics data pending", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
                
                item {
                   Text("Department Overview", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 8.dp))
                   Card(
                       colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                       border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                       shape = RoundedCornerShape(20.dp)
                   ) {
                       Column {
                           stats?.departmentStats?.take(3)?.forEach { dept ->
                                ListItem(
                                    headlineContent = { Text(dept.department, fontWeight = FontWeight.SemiBold) },
                                    supportingContent = { Text("${dept.totalEmployees} Staff • ${dept.onLeave} Absent") },
                                    colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                                )
                                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outline.copy(alpha=0.1f))
                           }
                           if ((stats?.departmentStats?.size ?: 0) > 3) {
                               TextButton(onClick = {}, modifier = Modifier.fillMaxWidth()) { Text("View All Departments") }
                           }
                       }
                   }
                }

                item {
                    Text(stringResource(R.string.audit_logs), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 32.dp, bottom = 12.dp))
                }
                
                items(auditLogs) { log ->
                    Card(
                        modifier = Modifier.padding(bottom = 8.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.05f)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        ListItem(
                            headlineContent = { Text(log.action, fontWeight = FontWeight.Medium) },
                            supportingContent = { Text("${log.actorEmail} • ${log.createdAt}") },
                            leadingContent = { 
                                Icon(Icons.Rounded.Info, contentDescription = null, tint = MaterialTheme.colorScheme.primary) 
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                    }
                }
                
                if (auditLogs.isEmpty()) {
                    item {
                         Text("No recent activity found.", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(bottom = 32.dp))
                    }
                } else {
                    item { Spacer(modifier = Modifier.height(32.dp)) }
                }
            }
        }
    }
}

@Composable
fun AdminStatCard(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier, 
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f))
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f))
                Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondaryContainer)
            }
            Icon(icon, contentDescription = null, modifier = Modifier.size(32.dp).alpha(0.3f), tint = MaterialTheme.colorScheme.onSecondaryContainer)
        }
    }
}
