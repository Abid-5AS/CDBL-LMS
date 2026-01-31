package com.cdbl.leavemanager.ui.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.HRHeadStats

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HRHeadDashboardScreen(
    token: String,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    var stats by remember { mutableStateOf<HRHeadStats?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.fetchHRHeadStats(token).onSuccess {
            stats = it
            isLoading = false
        }.onFailure {
            isLoading = false
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("HR Head Dashboard") }) }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (stats != null) {
            LazyColumn(modifier = Modifier.padding(padding).padding(16.dp)) {
                
                // Section 1: Operations Overview
                item {
                    Text("Operations Overview", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        KpiCard("Pending", stats!!.pending.toString(), "Your queue", Modifier.weight(1f), Color(0xFFFFF3E0), Color(0xFFE65100))
                        KpiCard("On Leave", stats!!.onLeave.toString(), "Active now", Modifier.weight(1f), Color(0xFFE3F2FD), Color(0xFF1565C0))
                    }
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        KpiCard("Returned", stats!!.returned.toString(), "Needs fixes", Modifier.weight(1f), Color(0xFFFFEBEE), Color(0xFFC62828))
                        KpiCard("Upcoming", stats!!.upcoming.toString(), "Next 7 days", Modifier.weight(1f), Color(0xFFE8F5E9), Color(0xFF2E7D32))
                    }
                }

                // Section 2: Escalated Cases
                if (stats!!.escalatedCases.isNotEmpty()) {
                    item {
                         Text("Escalated Cases", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
                    }
                    items(stats!!.escalatedCases) { case ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                    Text(case.employeeName, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                                    Text("${case.days} days", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                }
                                Text("${case.leaveType} • ${case.department}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(case.reason, style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                            }
                        }
                    }
                } else {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha=0.3f)),
                            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
                        ) {
                             Box(modifier = Modifier.padding(16.dp).fillMaxWidth(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                                 Text("No escalated cases pending.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                             }
                        }
                    }
                }

                // Section 3: Performance
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Performance & Compliance", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
                     Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CompactStatCard("Compliance", "${stats!!.complianceScore}%", Modifier.weight(1f))
                        CompactStatCard("New Hires", stats!!.newHires.toString(), Modifier.weight(1f))
                        CompactStatCard("Processed", stats!!.monthlyRequests.toString(), Modifier.weight(1f))
                    }
                }
            }
        }
    }
}
