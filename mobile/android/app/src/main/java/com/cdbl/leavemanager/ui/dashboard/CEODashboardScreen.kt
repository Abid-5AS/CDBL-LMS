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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.CEOStats

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CEODashboardScreen(
    token: String,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    var stats by remember { mutableStateOf<CEOStats?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.fetchCEOStats(token).onSuccess {
            stats = it
            isLoading = false
        }.onFailure {
            isLoading = false
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Executive Dashboard") }) }
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (stats != null) {
            LazyColumn(modifier = Modifier.padding(padding).padding(16.dp)) {
                // Section 1: Executive Overview
                item {
                    Text("Executive Overview", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CompactStatCard("Workforce", stats!!.totalEmployees.toString(), Modifier.weight(1f))
                        CompactStatCard("Utilization", "${stats!!.utilizationRate}%", Modifier.weight(1f))
                    }
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CompactStatCard("Compliance", "${stats!!.complianceScore}%", Modifier.weight(1f))
                         CompactStatCard("Pending", stats!!.pendingApprovals.toString(), Modifier.weight(1f))
                    }
                }

                // Section 2: Financial Summary
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                                Icon(Icons.Rounded.ShoppingCart, contentDescription = null, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Financial Summary", style = MaterialTheme.typography.titleMedium)
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("$${(stats!!.estimatedCost / 1000).toInt()}K", style = MaterialTheme.typography.displayMedium, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                            Text("Estimated YTD Leave Cost", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha=0.7f))
                            Divider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha=0.1f))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Total Leave Days")
                                Text("${stats!!.totalLeaveDays}")
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("YoY Growth")
                                Text("${stats!!.yoyGrowth}%", color = if (stats!!.yoyGrowth > 0) Color(0xFFC62828) else Color(0xFF2E7D32))
                            }
                        }
                    }
                }

                // Section 3: Department Scorecard
                item {
                    Text("Department Scorecard", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 8.dp))
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                        Column {
                            stats!!.departmentStats.take(5).forEach { dept ->
                                ListItem(
                                    headlineContent = { Text(dept.department) },
                                    supportingContent = { 
                                         // Calculated utilization
                                        val utilization = if(dept.totalEmployees > 0) ((dept.totalEmployees - dept.onLeave).toFloat() / dept.totalEmployees * 100).toInt() else 100
                                        Text("${dept.totalEmployees} Emp • $utilization% Utilization")
                                    },
                                    colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                                )
                                Divider(modifier = Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outline.copy(alpha=0.1f))
                            }
                        }
                    }
                }
            }
        }
    }
}
