package com.abid.cdbl_lms.ui.features.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository
import com.abid.cdbl_lms.ui.navigation.Screen
import com.abid.cdbl_lms.ui.viewmodel.DashboardViewModel
import com.abid.cdbl_lms.ui.viewmodel.DashboardViewModelFactory
import com.abid.cdbl_lms.ui.features.dashboard.components.*
import com.abid.cdbl_lms.ui.components.BottomNavigationBar
import com.abid.cdbl_lms.util.DateUtils
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    navController: NavController,
    leaveRepository: LeaveRepository,
    balanceRepository: LeaveBalanceRepository,
    viewModel: DashboardViewModel = viewModel(
        factory = DashboardViewModelFactory(
            leaveRepository,
            balanceRepository
        )
    )
) {
    val balances by viewModel.balances.collectAsState()
    val recentLeaves by viewModel.recentLeaves.collectAsState()
    val upcomingLeaves by viewModel.upcomingLeaves.collectAsState()
    val pendingLeaves by viewModel.pendingLeaves.collectAsState()
    val approvedLeaves by viewModel.approvedLeaves.collectAsState()
    val unsyncedCount by viewModel.unsyncedCount.collectAsState()

    val today = DateUtils.today()
    val medicalLeavesOver7Days = getMedicalLeavesOver7Days(approvedLeaves, today)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CDBL Leave Management") },
                actions = {
                    IconButton(onClick = { navController.navigate(Screen.Settings.route) }) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Welcome Hero
            item {
                WelcomeHero(
                    username = "Abid",
                    greeting = viewModel.getGreeting(),
                    pendingLeaves = pendingLeaves,
                    approvedUpcomingLeaves = upcomingLeaves,
                    onClick = if (pendingLeaves.isNotEmpty()) {
                        { navController.navigate(Screen.LeaveHistory.route) }
                    } else null
                )
            }

            // 2. Quick Actions Bar
            item {
                QuickActions(
                    pendingLeaves = pendingLeaves,
                    approvedLeaves = approvedLeaves,
                    medicalLeavesOver7Days = medicalLeavesOver7Days,
                    onApplyLeave = { navController.navigate(Screen.ApplyLeave.route) },
                    onCancelPending = { leave ->
                        // TODO: Navigate to cancel leave screen
                        navController.navigate(Screen.LeaveHistory.route)
                    },
                    onRequestCancellation = { leave ->
                        // TODO: Navigate to cancellation screen
                        navController.navigate(Screen.LeaveHistory.route)
                    },
                    onReturnToDuty = { leave ->
                        // TODO: Navigate to return to duty screen
                        navController.navigate(Screen.LeaveHistory.route)
                    }
                )
            }

            // Unsynced indicator
            if (unsyncedCount > 0) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = "$unsyncedCount request(s) pending sync",
                            modifier = Modifier.padding(16.dp),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

            // 3. Leave Balance Cards
            item {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        LeaveBalanceCard(
                            leaveType = LeaveType.CASUAL,
                            balance = balances.find { it.type == LeaveType.CASUAL },
                            onClick = { navController.navigate(Screen.LeaveBalance.route) },
                            modifier = Modifier.weight(1f)
                        )
                        LeaveBalanceCard(
                            leaveType = LeaveType.MEDICAL,
                            balance = balances.find { it.type == LeaveType.MEDICAL },
                            onClick = { navController.navigate(Screen.LeaveBalance.route) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    LeaveBalanceCard(
                        leaveType = LeaveType.EARNED,
                        balance = balances.find { it.type == LeaveType.EARNED },
                        onClick = { navController.navigate(Screen.LeaveBalance.route) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // 4. Upcoming Leaves (Active Timeline)
            if (upcomingLeaves.isNotEmpty()) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Active Timeline",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        TextButton(onClick = { navController.navigate(Screen.LeaveHistory.route) }) {
                            Text("View All")
                        }
                    }
                }
                items(upcomingLeaves) { leave ->
                    UpcomingLeaveCard(
                        leave = leave,
                        onClick = { navController.navigate(Screen.LeaveHistory.route) }
                    )
                }
            }

            // 5. Recent Applications
            if (recentLeaves.isNotEmpty()) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Recent Requests",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        TextButton(onClick = { navController.navigate(Screen.LeaveHistory.route) }) {
                            Text("View All")
                        }
                    }
                }
                items(recentLeaves) { leave ->
                    RecentLeaveCard(
                        leave = leave,
                        onClick = { navController.navigate(Screen.LeaveHistory.route) }
                    )
                }
            }
        }
    }
}

