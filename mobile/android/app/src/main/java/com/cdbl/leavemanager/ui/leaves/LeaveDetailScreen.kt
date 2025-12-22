package com.cdbl.leavemanager.ui.leaves

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.LeaveComment
import com.cdbl.leavemanager.data.model.LeaveRequest
import com.cdbl.leavemanager.ui.theme.Indigo100
import com.cdbl.leavemanager.ui.theme.Indigo500
import com.cdbl.leavemanager.ui.theme.Zinc100
import com.cdbl.leavemanager.ui.theme.Zinc500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveDetailScreen(
    token: String,
    leaveId: Int,
    onBackClick: () -> Unit,
    viewModel: LeaveDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Details", "Activity")

    LaunchedEffect(leaveId) {
        viewModel.loadDetails(token, leaveId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Leave Details") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title) }
                    )
                }
            }

            Box(modifier = Modifier.fillMaxSize()) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                } else if (uiState.error != null) {
                    Text(
                        text = "Error: ${uiState.error}",
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else {
                    uiState.leave?.let { leave ->
                        when (selectedTab) {
                            0 -> OverviewTab(leave)
                            1 -> ActivityTab(uiState.comments)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OverviewTab(leave: LeaveRequest) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        StatusCard(leave.status)
        Spacer(modifier = Modifier.height(16.dp))
        
        Text("Type", style = MaterialTheme.typography.labelMedium, color = Zinc500)
        Text(leave.type, style = MaterialTheme.typography.bodyLarge)
        Spacer(modifier = Modifier.height(12.dp))

        Text("Duration", style = MaterialTheme.typography.labelMedium, color = Zinc500)
        Text("${leave.startDate} - ${leave.endDate}", style = MaterialTheme.typography.bodyLarge)
        Text("${leave.workingDays} Days", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(12.dp))

        Text("Reason", style = MaterialTheme.typography.labelMedium, color = Zinc500)
        Card(
            colors = CardDefaults.cardColors(containerColor = Zinc100),
            modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
        ) {
            Text(
                text = leave.reason ?: "No reason provided",
                modifier = Modifier.padding(12.dp),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
fun StatusCard(status: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha=0.2f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Current Status", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = status,
                color = when(status) {
                    "APPROVED" -> Color(0xFF10b981)
                    "REJECTED" -> Color(0xFFef4444)
                    else -> Color(0xFFf59e0b)
                },
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun ActivityTab(comments: List<LeaveComment>) {
    if (comments.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No activity recorded yet.", color = Zinc500)
        }
    } else {
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(comments) { comment ->
                ChatBubble(comment)
            }
        }
    }
}

@Composable
fun ChatBubble(comment: LeaveComment) {
    Row(verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Indigo100),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = comment.authorName.take(1).uppercase(),
                color = Indigo500,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(comment.authorName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.width(8.dp))
                Text(comment.authorRole, style = MaterialTheme.typography.labelSmall, color = Zinc500)
            }
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(0.dp, 12.dp, 12.dp, 12.dp),
                modifier = Modifier.padding(top = 4.dp)
            ) {
                Text(
                    text = comment.comment,
                    modifier = Modifier.padding(12.dp),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            Text(
                text = comment.createdAt.take(10), // Simple date truncate
                style = MaterialTheme.typography.labelSmall,
                color = Zinc500,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}
