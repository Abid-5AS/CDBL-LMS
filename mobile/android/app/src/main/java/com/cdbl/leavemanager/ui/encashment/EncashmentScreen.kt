package com.cdbl.leavemanager.ui.encashment

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AccountBalanceWallet
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.EncashmentRequest
import com.cdbl.leavemanager.ui.theme.Indigo100
import com.cdbl.leavemanager.ui.theme.Indigo600
import com.cdbl.leavemanager.ui.theme.SuccessGreen
import com.cdbl.leavemanager.ui.theme.WarningAmber
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EncashmentScreen(
    token: String,
    onBackClick: () -> Unit,
    onRequestClick: () -> Unit,
    viewModel: EncashmentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadRequests(token) // Load mock or real data
    }
    
    // Mock Data if empty
    val displayRequests = if (uiState.requests.isEmpty()) {
        listOf(
            EncashmentRequest(
                id = 1, 
                userId = 99,
                year = 2024,
                daysRequested = 10,
                balanceAtRequest = 30,
                reason = "Family Emergency", 
                status = "APPROVED", 
                rejectionReason = null, 
                paymentStatus = "PAID", 
                createdAt = "2024-10-01T10:00:00Z"
            ),
            EncashmentRequest(
                id = 2,
                userId = 99,
                year = 2024, 
                daysRequested = 5,
                balanceAtRequest = 25,
                reason = "Personal", 
                status = "PENDING", 
                rejectionReason = null, 
                paymentStatus = null, 
                createdAt = "2024-10-20T10:00:00Z"
            )
        )
    } else {
        uiState.requests
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Leave Encashment", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                     IconButton(onClick = { }) {
                        Icon(Icons.Rounded.MoreVert, contentDescription = "Menu")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onRequestClick, 
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp),
                 modifier = Modifier.size(64.dp)
            ) {
                Icon(Icons.Rounded.Add, contentDescription = "Request Encashment", modifier = Modifier.size(32.dp))
            }
        }
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).padding(horizontal = 24.dp)) {
            Spacer(modifier = Modifier.height(16.dp))
            
            // Balance Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Indigo600, Color(0xFF4f46e5))
                        )
                    )
                    .padding(24.dp)
            ) {
                Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column {
                            Text("Encashable Balance", style = MaterialTheme.typography.labelMedium, color = Indigo100)
                            Row(verticalAlignment = Alignment.Bottom) {
                                Text("25", style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(" days", style = MaterialTheme.typography.titleMedium, color = Indigo100, modifier = Modifier.padding(bottom = 6.dp))
                            }
                        }
                        Box(
                            modifier = Modifier
                                .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                .padding(8.dp)
                        ) {
                            Icon(Icons.Rounded.AccountBalanceWallet, contentDescription = null, tint = Indigo100)
                        }
                    }
                     Text("Updated today", style = MaterialTheme.typography.labelSmall, color = Indigo100, modifier = Modifier.align(Alignment.End))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text("History", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(displayRequests) { request ->
                    EncashmentCard(request)
                }
            }
        }
    }
}

@Composable
fun EncashmentCard(request: EncashmentRequest) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                         Icon(Icons.Rounded.History, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                         Text(
                            text = "${request.daysRequested} Days",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = formatDate(request.createdAt),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                StatusBadge(request.status)
            }
            
            if (request.paymentStatus == "PAID") {
                 HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                 Row(verticalAlignment = Alignment.CenterVertically) {
                     Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(16.dp))
                     Spacer(modifier = Modifier.width(8.dp))
                     Text("Payment Processed", style = MaterialTheme.typography.labelSmall, color = SuccessGreen, fontWeight = FontWeight.Bold)
                 }
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val (bgColor, contentColor) = when (status) {
        "APPROVED", "PAID" -> Color(0xFFE8F5E9) to Color(0xFF2E7D32)
        "PENDING" -> WarningAmber.copy(0.1f) to WarningAmber
        "REJECTED" -> Color(0xFFFFEBEE) to Color(0xFFC62828)
        else -> Color.LightGray to Color.Black
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(8.dp),
    ) {
        Text(
            text = status,
            color = contentColor,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

private fun formatDate(dateString: String): String {
    return try {
        // Handle ISO8601 date string
        val zdt = ZonedDateTime.parse(dateString)
        zdt.format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.getDefault()))
    } catch (e: Exception) {
        dateString.take(10)
    }
}
