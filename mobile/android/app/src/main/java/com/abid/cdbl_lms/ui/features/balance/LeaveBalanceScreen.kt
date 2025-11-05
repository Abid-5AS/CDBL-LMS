package com.abid.cdbl_lms.ui.features.balance

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.abid.cdbl_lms.data.model.LeaveBalance
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.ui.navigation.Screen
import com.abid.cdbl_lms.ui.viewmodel.LeaveBalanceViewModel
import com.abid.cdbl_lms.ui.viewmodel.LeaveBalanceViewModelFactory
import com.abid.cdbl_lms.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveBalanceScreen(
    navController: NavController,
    balanceRepository: LeaveBalanceRepository,
    viewModel: LeaveBalanceViewModel = viewModel(
        factory = LeaveBalanceViewModelFactory(balanceRepository)
    )
) {
    val balances by viewModel.balances.collectAsState()
    val currentYear = DateUtils.getCurrentYear()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Leave Balance Breakdown") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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
            item {
                Text(
                    text = "Balance for $currentYear",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            // Balance Cards for each type
            item {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    balances.forEach { balance ->
                        BalanceDetailCard(balance = balance)
                    }

                    // Show default balances if none exist
                    if (balances.isEmpty()) {
                        listOf(LeaveType.EARNED, LeaveType.CASUAL, LeaveType.MEDICAL).forEach { type ->
                            BalanceDetailCard(
                                balance = LeaveBalance(
                                    type = type,
                                    year = currentYear,
                                    opening = when (type) {
                                        LeaveType.EARNED -> 24
                                        LeaveType.CASUAL -> 10
                                        LeaveType.MEDICAL -> 14
                                        else -> 0
                                    },
                                    accrued = 0,
                                    used = 0,
                                    closing = when (type) {
                                        LeaveType.EARNED -> 24
                                        LeaveType.CASUAL -> 10
                                        LeaveType.MEDICAL -> 14
                                        else -> 0
                                    }
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BalanceDetailCard(balance: LeaveBalance) {
    val typeName = when (balance.type) {
        LeaveType.EARNED -> "Earned Leave"
        LeaveType.CASUAL -> "Casual Leave"
        LeaveType.MEDICAL -> "Medical Leave"
        else -> balance.type.name
    }

    val total = balance.opening + balance.accrued
    val used = balance.used
    val available = balance.available
    val percentage = if (total > 0) ((available.toFloat() / total.toFloat()) * 100).toInt() else 0

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = typeName,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            // Progress Bar
            LinearProgressIndicator(
                progress = { (used.toFloat() / total.toFloat()).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            // Balance Details
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Opening",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${balance.opening} days",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column {
                    Text(
                        text = "Accrued",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${balance.accrued} days",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column {
                    Text(
                        text = "Used",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "$used days",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                Column {
                    Text(
                        text = "Available",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "$available days",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Summary
            HorizontalDivider()
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Total: $total days",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "$percentage% remaining",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
