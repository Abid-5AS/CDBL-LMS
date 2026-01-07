package com.cdbl.leavemanager.ui.approvals

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.data.model.ApprovalItem
import com.cdbl.leavemanager.ui.theme.*
import com.cdbl.leavemanager.ui.designsystem.component.CDBLLoadingWheel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

enum class ApprovalFilter(val label: String) {
    PENDING("Pending"),
    ALL("All"),
    URGENT("Urgent")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApprovalScreen(
    token: String,
    onBackClick: (() -> Unit)? = null,
    viewModel: ApprovalViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    var selectedFilter by remember { mutableStateOf(ApprovalFilter.PENDING) }
    
    // State for the decision dialog
    var showDialog by remember { mutableStateOf(false) }
    var selectedAction by remember { mutableStateOf<Pair<String, ApprovalItem>?>(null) }
    var comment by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadApprovals(token)
    }

    LaunchedEffect(uiState.actionSuccess) {
        uiState.actionSuccess?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearActionSuccess()
        }
    }

    // Filter items
    val filteredItems = remember(uiState.items, selectedFilter) {
        when (selectedFilter) {
            ApprovalFilter.PENDING -> uiState.items.filter { it.status == "PENDING_AT_USER" || it.status.contains("PENDING") }
            ApprovalFilter.URGENT -> uiState.items.filter { isUrgent(it) }
            ApprovalFilter.ALL -> uiState.items
        }
    }

    // Pending Count
    val pendingCount = uiState.items.count { it.status == "PENDING_AT_USER" || it.status.contains("PENDING") }

    if (showDialog) {
        val currentAction = selectedAction
        if (currentAction != null) {
            val (action, item) = currentAction
            val isApprove = action == "approve"
            
            AlertDialog(
                onDismissRequest = { showDialog = false },
                icon = {
                    Icon(
                        if (isApprove) Icons.Rounded.CheckCircle else Icons.Rounded.Cancel,
                        contentDescription = null,
                        tint = if (isApprove) SuccessGreen else ErrorRed,
                        modifier = Modifier.size(48.dp)
                    )
                },
                title = { Text(if (isApprove) "Approve Request" else "Reject Request") },
                text = {
                    Column {
                        Text(
                            "You are about to ${if (isApprove) "approve" else "reject"} leave request from ${item.requestedByName}.",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(
                            value = comment,
                            onValueChange = { comment = it },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text(if (isApprove) "Comment (optional)" else "Reason (required)") },
                            placeholder = { Text("Enter your comment...") },
                            minLines = 3,
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.submitDecision(token, item.id, action, comment.takeIf { it.isNotBlank() })
                            showDialog = false
                            comment = ""
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isApprove) SuccessGreen else ErrorRed
                        ),
                        enabled = isApprove || comment.isNotBlank()
                    ) {
                        Text(if (isApprove) "Approve" else "Reject")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDialog = false; comment = "" }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Approvals")
                        if (pendingCount > 0) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Badge(
                                containerColor = MaterialTheme.colorScheme.error,
                                contentColor = MaterialTheme.colorScheme.onError
                            ) {
                                Text("$pendingCount")
                            }
                        }
                    }
                },
                navigationIcon = {
                    if (onBackClick != null) {
                        IconButton(onClick = onBackClick) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Filter Chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(ApprovalFilter.entries) { filter ->
                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { selectedFilter = filter },
                        label = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(filter.label)
                                if (filter == ApprovalFilter.PENDING && pendingCount > 0) {
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        "($pendingCount)",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                        },
                        leadingIcon = if (selectedFilter == filter) {
                            {
                                Icon(
                                    Icons.Rounded.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        } else null,
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

            when {
                uiState.isLoading && uiState.items.isEmpty() -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CDBLLoadingWheel(contentDesc = "Loading approvals")
                }
                uiState.error != null -> Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Rounded.ErrorOutline,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Error: ${uiState.error}",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(onClick = { viewModel.loadApprovals(token) }) {
                            Text("Retry")
                        }
                    }
                }
                filteredItems.isEmpty() -> EmptyApprovalsView(filter = selectedFilter)
                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredItems, key = { it.id }) { item ->
                        AnimatedVisibility(
                            visible = true,
                            enter = fadeIn() + slideInVertically(),
                            exit = fadeOut()
                        ) {
                            EnhancedApprovalCard(
                                item = item,
                                onApprove = { 
                                    selectedAction = "approve" to item
                                    showDialog = true 
                                },
                                onReject = { 
                                    selectedAction = "reject" to item
                                    showDialog = true 
                                }
                            )
                        }
                    }
                }
            }
            
            // Overlay loading when submitting action
            if (uiState.isLoading && uiState.items.isNotEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CDBLLoadingWheel(contentDesc = "Processing...")
                }
            }
        }
    }
}

@Composable
private fun EmptyApprovalsView(filter: ApprovalFilter) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                when (filter) {
                    ApprovalFilter.PENDING -> Icons.Rounded.CheckCircleOutline
                    ApprovalFilter.URGENT -> Icons.Rounded.PriorityHigh
                    ApprovalFilter.ALL -> Icons.Rounded.Inbox
                },
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                when (filter) {
                    ApprovalFilter.PENDING -> "All caught up!"
                    ApprovalFilter.URGENT -> "No urgent requests"
                    ApprovalFilter.ALL -> "No approval requests"
                },
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                when (filter) {
                    ApprovalFilter.PENDING -> "You have no pending approvals"
                    ApprovalFilter.URGENT -> "No requests require immediate attention"
                    ApprovalFilter.ALL -> "Approval requests will appear here"
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
fun EnhancedApprovalCard(
    item: ApprovalItem,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    val isUrgent = isUrgent(item)
    val leaveTypeColor = getLeaveTypeColor(item.type)

    Card(
        elevation = CardDefaults.cardElevation(defaultElevation = if (isUrgent) 2.dp else 1.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isUrgent) 
                ErrorRed.copy(alpha = 0.05f) 
            else 
                MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(
            1.dp,
            if (isUrgent) ErrorRed.copy(alpha = 0.3f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Avatar
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            item.requestedByName.firstOrNull()?.uppercase() ?: "?",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = item.requestedByName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = item.requestedByEmail,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Leave Type Badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = leaveTypeColor.copy(alpha = 0.1f)
                ) {
                    Text(
                        item.type.replace("_", " "),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = leaveTypeColor,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Date and Duration Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Rounded.CalendarToday,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            "${formatDate(item.startDate)} - ${formatDate(item.endDate)}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    if (isUrgent) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Rounded.Warning,
                                contentDescription = null,
                                tint = ErrorRed,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                "Starts soon!",
                                style = MaterialTheme.typography.labelSmall,
                                color = ErrorRed,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
                
                // Duration Badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        "${item.workingDays ?: 1} day${if ((item.workingDays ?: 1) > 1) "s" else ""}",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Reason
            item.reason?.takeIf { it.isNotBlank() }?.let { reason ->
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ) {
                    Text(
                        reason,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onReject,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed),
                    border = BorderStroke(1.dp, ErrorRed.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Rounded.Close, contentDescription = "Reject", modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Reject")
                }
                
                Button(
                    onClick = onApprove,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Rounded.Check, contentDescription = "Approve", modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Approve")
                }
            }
        }
    }
}

private fun isUrgent(item: ApprovalItem): Boolean {
    return try {
        val startDate = LocalDate.parse(item.startDate.take(10))
        val daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), startDate)
        daysUntil in 0..2
    } catch (e: Exception) {
        false
    }
}

private fun getLeaveTypeColor(type: String): Color {
    return when (type.uppercase()) {
        "EARNED", "EARNED_LEAVE" -> Indigo600
        "CASUAL", "CASUAL_LEAVE" -> WarningAmber
        "MEDICAL", "MEDICAL_LEAVE", "SICK" -> ErrorRed
        else -> Blue500
    }
}

private fun formatDate(dateString: String): String {
    return try {
        val date = LocalDate.parse(dateString.take(10))
        date.format(DateTimeFormatter.ofPattern("dd MMM"))
    } catch (e: Exception) {
        dateString.take(10)
    }
}
