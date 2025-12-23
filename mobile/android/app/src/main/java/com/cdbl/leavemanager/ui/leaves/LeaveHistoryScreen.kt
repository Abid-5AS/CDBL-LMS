package com.cdbl.leavemanager.ui.leaves

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.CloudUpload
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.res.stringResource
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.theme.*
import androidx.compose.ui.platform.LocalContext
import com.cdbl.leavemanager.util.PdfGenerator
import androidx.compose.material.icons.rounded.Download

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveHistoryScreen(
    token: String,
    onBackClick: (() -> Unit)? = null,
    onApplyClick: () -> Unit,
    onEncashmentClick: () -> Unit,
    onLeaveClick: (Int) -> Unit,
    viewModel: LeaveHistoryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadLeaves(token)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        floatingActionButton = {
            FloatingActionButton(
                onClick = onApplyClick,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp),
                 modifier = Modifier.size(64.dp)
            ) {
                Icon(Icons.Rounded.Add, contentDescription = stringResource(R.string.apply_leave), modifier = Modifier.size(32.dp))
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Header
            Column(
                modifier = Modifier
                    .background(MaterialTheme.colorScheme.background)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(R.string.my_leaves),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )

                    val context = LocalContext.current
                    IconButton(onClick = { 
                         if (uiState.leaves.isNotEmpty()) {
                            PdfGenerator.generateLeaveHistoryPdf(context, uiState.leaves)
                         }
                    }) {
                        Icon(Icons.Rounded.Download, contentDescription = "Export PDF")
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                // Search Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = "",
                        onValueChange = {},
                        placeholder = { Text(stringResource(R.string.search_leaves)) },
                        leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = { /*TODO*/ },
                        modifier = Modifier
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            .size(56.dp)
                    ) {
                        Icon(Icons.Outlined.FilterList, contentDescription = "Filter")
                    }
                }
            }

            // Tabs
            val tabs = listOf(
                stringResource(R.string.tab_all) to "All",
                stringResource(R.string.tab_pending) to "Pending",
                stringResource(R.string.tab_approved) to "Approved",
                stringResource(R.string.tab_rejected) to "Rejected",
                stringResource(R.string.tab_casual) to "Casual"
            )
            var selectedTab by remember { mutableStateOf("All") }

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                items(tabs) { (label, value) ->
                    val isSelected = value == selectedTab
                    val bgColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
                    val contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                    val borderColor = if (isSelected) Color.Transparent else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(bgColor)
                            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
                            .clickable {
                                selectedTab = value
                                when(value) {
                                    "All" -> viewModel.loadLeaves(token)
                                    "Pending" -> viewModel.loadLeaves(token, status = "PENDING")
                                    "Approved" -> viewModel.loadLeaves(token, status = "APPROVED")
                                    "Rejected" -> viewModel.loadLeaves(token, status = "REJECTED")
                                    "Casual" -> viewModel.loadLeaves(token, type = "CASUAL")
                                    else -> viewModel.loadLeaves(token)
                                }
                            }
                            .padding(horizontal = 20.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = contentColor
                        )
                    }
                }
            }

            // List
            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (uiState.leaves.isEmpty()) {
                 Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(stringResource(R.string.no_history), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                   items(uiState.leaves) { leave ->
                        LeaveHistoryCardNew(leave, onClick = { onLeaveClick(leave.id) })
                    }
                }
            }
        }
    }
}



@Composable
fun LeaveHistoryCardNew(leave: com.cdbl.leavemanager.data.model.LeaveRequest, onClick: () -> Unit) {
    val statusBg = when(leave.status) {
        "PENDING" -> StatusYellowBg
        "APPROVED" -> StatusGreenBg
        "REJECTED" -> StatusRedBg
        "SYNC_PENDING" -> MaterialTheme.colorScheme.surfaceVariant
        "SYNC_FAILED" -> MaterialTheme.colorScheme.errorContainer
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    val statusText = when(leave.status) {
        "PENDING" -> StatusYellowText
        "APPROVED" -> StatusGreenText
        "REJECTED" -> StatusRedText
        "SYNC_PENDING" -> MaterialTheme.colorScheme.onSurfaceVariant
        "SYNC_FAILED" -> MaterialTheme.colorScheme.onErrorContainer
        else -> MaterialTheme.colorScheme.onSurface
    }
    val statusIcon = when(leave.status) {
        "SYNC_PENDING" -> Icons.Rounded.CloudUpload
        "SYNC_FAILED" -> Icons.Rounded.CloudOff
        else -> null
    }

    // Parse date safely
    val startDateObj = try {
         java.time.LocalDate.parse(leave.startDate.take(10))
    } catch (e: Exception) {
         java.time.LocalDate.now()
    }
    val startMonth = startDateObj.month.name.take(3)
    val startDay = startDateObj.dayOfMonth.toString()

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
         border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Date Box
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier
                    .size(width = 56.dp, height = 64.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            ) {
                Text(
                    text = startMonth,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = startDay,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        text = leave.type,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Surface(
                        color = statusBg,
                        shape = RoundedCornerShape(12.dp) // Pill shape
                    ) {
                        Text(
                            text = leave.status,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = statusText
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                if (leave.reason != null) {
                    Text(
                        text = leave.reason,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Outlined.CalendarToday,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${leave.startDate.take(10)} - ${leave.endDate.take(10)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (leave.workingDays != null) {
                        Text(
                            text = " • " + stringResource(R.string.days_count, leave.workingDays.toString()),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}