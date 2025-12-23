package com.cdbl.leavemanager.ui.policy

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.cdbl.leavemanager.data.model.PolicyData
import com.cdbl.leavemanager.data.model.PolicyRule
import com.cdbl.leavemanager.data.model.PolicySection

import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PolicyScreen(
    onBackClick: () -> Unit,
    viewModel: PolicyViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Leave Policies") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            if (uiState.isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else if (uiState.error != null) {
                Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Rounded.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(uiState.error!!, color = MaterialTheme.colorScheme.error)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.fetchPolicies() }) {
                        Text("Retry")
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.Info, contentDescription = null, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.width(16.dp))
                                Text("Policies follow CDBL Manual Ch. 6. Approval Chain: HR -> Dept Head -> CEO.", style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }

                    items(uiState.policies) { policy ->
                        PolicyCardItem(policy)
                    }
                }
            }
        }
    }
}


@Composable
fun PolicyCardItem(policy: PolicySection) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(MaterialTheme.colorScheme.secondaryContainer, RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Rounded.Description, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(policy.title, style = MaterialTheme.typography.titleMedium)
                    Text("Code: ${policy.code}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(policy.summary, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Badge { Text(policy.availability) }
            }

            AnimatedVisibility(visible = expanded) {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Rules", style = MaterialTheme.typography.labelMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    policy.rules.forEach { rule ->
                        PolicyRuleItem(rule)
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    if (policy.examples.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Examples", style = MaterialTheme.typography.labelMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        policy.examples.forEach { ex ->
                             Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    if (ex.valid) Icons.Rounded.CheckCircle else Icons.Rounded.Cancel,
                                    contentDescription = null, 
                                    tint = if (ex.valid) Color(0xFF4CAF50) else Color(0xFFE53935),
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("${ex.scenario} -> ${ex.result}", style = MaterialTheme.typography.bodySmall)
                             }
                             Spacer(modifier = Modifier.height(4.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PolicyRuleItem(rule: PolicyRule) {
    val (color, icon) = when (rule.type) {
        "critical" -> MaterialTheme.colorScheme.errorContainer to Icons.Rounded.Block
        "warning" -> MaterialTheme.colorScheme.tertiaryContainer to Icons.Rounded.Warning
        else -> MaterialTheme.colorScheme.secondaryContainer to Icons.Rounded.Info
    }
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(color.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
            .padding(8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(rule.title, style = MaterialTheme.typography.labelSmall, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
            Text(rule.description, style = MaterialTheme.typography.bodySmall)
        }
    }
}
