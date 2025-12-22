package com.cdbl.leavemanager.ui.encashment

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.EncashmentRequest
import java.time.format.DateTimeFormatter
import java.time.ZonedDateTime
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
        viewModel.loadRequests(token)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Encashment") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onRequestClick, containerColor = MaterialTheme.colorScheme.primary) {
                Icon(Icons.Default.Add, contentDescription = "Request Encashment")
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues).fillMaxSize()) {
            if (uiState.isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else if (uiState.error != null) {
                Text(
                    text = "Error: ${uiState.error}",
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.align(Alignment.Center)
                )
            } else if (uiState.requests.isEmpty()) {
                Text(
                    text = "No encashment requests found",
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(uiState.requests) { request ->
                        EncashmentCard(request)
                    }
                }
            }
        }
    }
}

@Composable
fun EncashmentCard(request: EncashmentRequest) {
    Card(
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${request.daysRequested} Days (EL ${request.year})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusBadge(request.status)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Requested: ${formatDate(request.createdAt)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (request.paymentStatus != null) {
                 Spacer(modifier = Modifier.height(4.dp))
                 Text(
                    text = "Payment: ${request.paymentStatus}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
             if (request.reason != null) {
                 Spacer(modifier = Modifier.height(8.dp))
                 Text(
                    text = request.reason,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
             if (request.rejectionReason != null) {
                 Spacer(modifier = Modifier.height(8.dp))
                 Text(
                    text = "Rejection Reason: ${request.rejectionReason}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val (bgColor, contentColor) = when (status) {
        "APPROVED", "PAID" -> Color(0xFFE8F5E9) to Color(0xFF2E7D32)
        "PENDING" -> Color(0xFFFFF8E1) to Color(0xFFF57C00)
        "REJECTED" -> Color(0xFFFFEBEE) to Color(0xFFC62828)
        else -> Color.LightGray to Color.Black
    }

    Surface(
        color = bgColor,
        shape = MaterialTheme.shapes.small,
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
