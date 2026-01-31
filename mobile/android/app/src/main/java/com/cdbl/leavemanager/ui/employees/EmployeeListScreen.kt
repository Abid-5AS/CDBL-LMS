package com.cdbl.leavemanager.ui.employees

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.ui.designsystem.component.CDBLTopAppBar
import com.cdbl.leavemanager.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeListScreen(
    token: String,
    onEmployeeClick: (Int) -> Unit,
    viewModel: EmployeesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var query by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadEmployees(token)
    }

    Scaffold(
        topBar = {
            CDBLTopAppBar(title = stringResource(R.string.nav_employees))
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth(),
                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                placeholder = { Text(stringResource(R.string.employee_directory)) }
            )

            Spacer(modifier = Modifier.height(16.dp))

            when {
                uiState.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                uiState.error != null -> {
                    Text(uiState.error ?: "Failed to load employees", color = MaterialTheme.colorScheme.error)
                }
                else -> {
                    val filtered = uiState.employees.filter {
                        it.name.contains(query, ignoreCase = true) || it.email.contains(query, ignoreCase = true)
                    }
                    if (filtered.isEmpty()) {
                        Text("No employees found", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(filtered) { employee ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    shape = MaterialTheme.shapes.large,
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                                    onClick = { onEmployeeClick(employee.id) }
                                ) {
                                    ListItem(
                                        headlineContent = { Text(employee.name) },
                                        supportingContent = {
                                            Text("${employee.role} • ${employee.department ?: "No department"}")
                                        },
                                        trailingContent = {
                                            if (employee.leaves.isNotEmpty()) {
                                                AssistChip(
                                                    onClick = {},
                                                    label = { Text("On Leave") }
                                                )
                                            }
                                        }
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
