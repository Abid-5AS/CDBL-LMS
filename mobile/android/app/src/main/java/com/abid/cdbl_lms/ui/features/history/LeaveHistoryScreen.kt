package com.abid.cdbl_lms.ui.features.history

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.abid.cdbl_lms.data.model.LeaveStatus
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository
import com.abid.cdbl_lms.ui.features.dashboard.components.StatusBadge
import com.abid.cdbl_lms.ui.navigation.Screen
import com.abid.cdbl_lms.ui.viewmodel.LeaveHistoryViewModel
import com.abid.cdbl_lms.ui.viewmodel.LeaveHistoryViewModelFactory
import com.abid.cdbl_lms.util.DateUtils
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveHistoryScreen(
    navController: NavController,
    leaveRepository: LeaveRepository,
    balanceRepository: LeaveBalanceRepository,
    viewModel: LeaveHistoryViewModel = viewModel(
        factory = LeaveHistoryViewModelFactory(leaveRepository)
    )
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf<LeaveType?>(null) }
    var selectedStatus by remember { mutableStateOf<LeaveStatus?>(null) }
    var showFilters by remember { mutableStateOf(false) }

    val allLeaves by viewModel.allLeaves.collectAsState()

    // Filter leaves
    val filteredLeaves = remember(allLeaves, searchQuery, selectedType, selectedStatus) {
        allLeaves.filter { leave ->
            val matchesSearch = searchQuery.isEmpty() || 
                leave.type.name.contains(searchQuery, ignoreCase = true) ||
                leave.reason.contains(searchQuery, ignoreCase = true) ||
                leave.status.name.contains(searchQuery, ignoreCase = true)
            
            val matchesType = selectedType == null || leave.type == selectedType
            val matchesStatus = selectedStatus == null || leave.status == selectedStatus
            
            matchesSearch && matchesType && matchesStatus
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Leave History") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showFilters = !showFilters }) {
                        Text("Filter")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Search by type, reason, or status...") },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Search")
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Text("Clear")
                        }
                    }
                },
                singleLine = true
            )

            // Filters
            if (showFilters) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Filter by Type",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = selectedType == null,
                                onClick = { selectedType = null },
                                label = { Text("All") }
                            )
                            LeaveType.values().take(3).forEach { type ->
                                FilterChip(
                                    selected = selectedType == type,
                                    onClick = { selectedType = type },
                                    label = { Text(type.name) }
                                )
                            }
                        }

                        Text(
                            text = "Filter by Status",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = selectedStatus == null,
                                onClick = { selectedStatus = null },
                                label = { Text("All") }
                            )
                            listOf(
                                LeaveStatus.APPROVED,
                                LeaveStatus.PENDING,
                                LeaveStatus.REJECTED
                            ).forEach { status ->
                                FilterChip(
                                    selected = selectedStatus == status,
                                    onClick = { selectedStatus = status },
                                    label = { Text(status.name) }
                                )
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Leave List
            if (filteredLeaves.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "No leave requests found",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = if (searchQuery.isNotEmpty() || selectedType != null || selectedStatus != null) {
                                "Try adjusting your filters"
                            } else {
                                "Start by applying for leave"
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredLeaves) { leave ->
                        LeaveHistoryCard(
                            leave = leave,
                            onClick = {
                                // TODO: Navigate to detail screen
                                navController.navigate(Screen.ApplyLeave.route)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun LeaveHistoryCard(
    leave: LeaveRequest,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = leave.type.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    StatusBadge(status = leave.status)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${DateUtils.formatDate(leave.startDate)} → ${DateUtils.formatDate(leave.endDate)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${leave.workingDays} day${if (leave.workingDays > 1) "s" else ""} • ${leave.reason.take(50)}${if (leave.reason.length > 50) "..." else ""}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (leave.needsCertificate) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            text = "Certificate Required",
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    }
                }
            }
        }
    }
}
