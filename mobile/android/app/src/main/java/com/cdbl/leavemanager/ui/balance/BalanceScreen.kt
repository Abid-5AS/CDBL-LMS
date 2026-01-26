package com.cdbl.leavemanager.ui.balance

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.FlightTakeoff
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

import com.cdbl.leavemanager.ui.components.KpiCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BalanceScreen(
    token: String,
    onBackClick: () -> Unit,
    onNavigateToPolicies: () -> Unit,
    onNavigateToApply: () -> Unit,
    viewModel: BalanceViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadBalance(token)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Leave Balances", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    androidx.compose.material3.IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    androidx.compose.material3.TextButton(onClick = onNavigateToPolicies) {
                        Text("Policies")
                    }
                    androidx.compose.material3.TextButton(onClick = onNavigateToApply) {
                        Text("Apply")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        }
    ) { paddingValues ->
        if (uiState.isLoading) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CircularProgressIndicator()
            }
        } else {
            val balances = uiState.balance?.balances.orEmpty()
            val totalAvailable = balances.sumOf { it.closing }
            val totalUsed = balances.sumOf { it.used }
            val totalAccrued = balances.sumOf { it.accrued }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 32.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))

                }

                item {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        KpiCard(
                            title = "Total Available",
                            value = "${totalAvailable.toInt()} d",
                            subtitle = "Remaining balance",
                            modifier = Modifier.weight(1f),
                            bg = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        KpiCard(
                            title = "Under Review",
                            value = "${uiState.pendingDays} d",
                            subtitle = "Pending requests",
                            modifier = Modifier.weight(1f),
                            bg = MaterialTheme.colorScheme.tertiaryContainer,
                            contentColor = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                    }
                }

                item {
                    KpiCard(
                        title = "Accrued YTD",
                        value = "+${totalAccrued.toInt()} d",
                        subtitle = "Earned this year",
                        modifier = Modifier.fillMaxWidth(),
                        bg = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }

                items(balances) { balance ->
                    BalanceDetailCard(
                        balanceType = balance.type,
                        opening = balance.opening,
                        accrued = balance.accrued,
                        used = balance.used,
                        closing = balance.closing
                    )
                }
            }
        }
    }
}

@Composable
private fun BalanceDetailCard(
    balanceType: String,
    opening: Double,
    accrued: Double,
    used: Double,
    closing: Double
) {
    val (label, icon, accent) = when (balanceType.uppercase()) {
        "EARNED" -> Triple("Earned Leave", Icons.Rounded.FlightTakeoff, MaterialTheme.colorScheme.primary)
        "CASUAL" -> Triple("Casual Leave", Icons.Rounded.Timer, MaterialTheme.colorScheme.tertiary)
        "MEDICAL" -> Triple("Medical Leave", Icons.Rounded.LocalHospital, MaterialTheme.colorScheme.secondary)
        else -> Triple(balanceType, Icons.Rounded.CalendarMonth, MaterialTheme.colorScheme.primary)
    }
    val total = opening + accrued
    val progress = if (total > 0) (used / total).toFloat() else 0f

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    androidx.compose.foundation.layout.Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(accent.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(icon, contentDescription = null, tint = accent)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(label, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("${closing.toInt()} days available", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

            }

            Spacer(modifier = Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = progress,
                color = accent,
                trackColor = accent.copy(alpha = 0.15f),
                modifier = Modifier.fillMaxWidth().height(8.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                BalanceStat(label = "Opening", value = opening)
                BalanceStat(label = "Accrued", value = accrued, prefix = "+")
                BalanceStat(label = "Used", value = used, prefix = "-")
                BalanceStat(label = "Closing", value = closing)
            }
        }
    }
}

@Composable
private fun BalanceStat(label: String, value: Double, prefix: String = "") {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            text = "$prefix${value.toInt()}",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold
        )
    }
}
