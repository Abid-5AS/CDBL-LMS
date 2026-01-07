package com.cdbl.leavemanager.ui.admin

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
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkflowPoliciesScreen(
    token: String,
    onBackClick: () -> Unit,
    viewModel: WorkflowPoliciesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadPolicies(token)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.workflow_policies)) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            uiState.error != null -> Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(uiState.error ?: "Failed to load policies", color = MaterialTheme.colorScheme.error)
            }
            uiState.policies != null -> {
                val policies = uiState.policies!!
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(policies.defaults) { policy ->
                        PolicyCard(
                            title = policy.requesterRole,
                            chain = policy.chain,
                            subtitle = "Default"
                        )
                    }
                    items(policies.policies) { policy ->
                        PolicyCard(
                            title = policy.requesterRole,
                            chain = policy.chain,
                            subtitle = policy.updatedByUser?.name ?: "Custom"
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PolicyCard(title: String, chain: List<String>, subtitle: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(8.dp))
            Text(chain.joinToString(" → "), style = MaterialTheme.typography.bodyMedium)
        }
    }
}
