package com.cdbl.leavemanager.ui.leaves

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DateRange
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material.icons.rounded.DoNotDisturb
import androidx.compose.material.icons.rounded.Undo
import androidx.compose.material.icons.automirrored.rounded.Forward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.res.stringResource
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.net.Uri
import com.cdbl.leavemanager.R
import com.cdbl.leavemanager.ui.theme.*
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveDetailScreen(
    token: String,
    leaveId: Int,
    isManagerView: Boolean = false,
    onBackClick: () -> Unit,
    onEditClick: (Int) -> Unit = {},
    viewModel: LeaveDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    // Action Dialog State
    var actionDialogType by remember { mutableStateOf<ActionType?>(null) }
    var actionComment by remember { mutableStateOf("") }
    var pendingUploadType by remember { mutableStateOf<String?>(null) }

    val fileLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        val type = pendingUploadType
        if (uri != null && type != null) {
            viewModel.uploadCertificate(token, leaveId, type, uri)
        }
        pendingUploadType = null
    }
    
    LaunchedEffect(leaveId) {
        viewModel.loadDetails(token, leaveId)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.leave_details), fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = stringResource(R.string.back))
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
        bottomBar = {
            val leave = uiState.leave
            // Check if leave can be cancelled
            val canCancel = !isManagerView && leave != null && 
                (leave.status == "PENDING" || leave.status == "SUBMITTED" || leave.status == "APPROVED")
            
            // Check if partial cancel is available (APPROVED + started but not ended)
            val canPartialCancel = canCancel && leave?.status == "APPROVED" && run {
                try {
                    val today = LocalDate.now()
                    val startDate = LocalDate.parse(leave.startDate.take(10))
                    val endDate = LocalDate.parse(leave.endDate.take(10))
                    today >= startDate && today <= endDate  // Leave has started but not ended
                } catch (e: Exception) {
                    false
                }
            }
            
            // Show Approve/Reject buttons if Manager View and Pending Status
            val canApprove = isManagerView && leave?.status == "PENDING"
            val canEdit = !isManagerView && leave?.status == "RETURNED"
            
            if (canCancel || canApprove || canEdit) {
                Column(
                    modifier = Modifier
                        .background(MaterialTheme.colorScheme.surface)
                        .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        .padding(16.dp)
                ) {
                    if (canEdit) {
                        Button(
                            onClick = { onEditClick(leaveId) },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Edit & Resubmit", fontWeight = FontWeight.Bold)
                        }
                    } else if (canApprove) {
                        // Primary Actions: Reject / Approve
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Button(
                                onClick = { actionDialogType = ActionType.REJECT },
                                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed.copy(alpha = 0.1f), contentColor = ErrorRed),
                                modifier = Modifier.weight(1f).height(48.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(stringResource(R.string.reject), fontWeight = FontWeight.Bold)
                            }
                            Button(
                                onClick = { actionDialogType = ActionType.APPROVE },
                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                modifier = Modifier.weight(1f).height(48.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(stringResource(R.string.approve), fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        // Secondary Actions: Return / Forward
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { actionDialogType = ActionType.RETURN },
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, WarningAmber.copy(alpha = 0.5f)),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = WarningAmber)
                            ) {
                                Icon(Icons.Rounded.Undo, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Return", fontWeight = FontWeight.Medium)
                            }
                            OutlinedButton(
                                onClick = { actionDialogType = ActionType.FORWARD },
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Icon(Icons.AutoMirrored.Rounded.Forward, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Forward", fontWeight = FontWeight.Medium)
                            }
                        }
                    } else if (canCancel) {
                        if (canPartialCancel) {
                            // Show both Full and Partial cancel options
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                OutlinedButton(
                                    onClick = { actionDialogType = ActionType.FULL_CANCEL },
                                    modifier = Modifier.weight(1f).height(50.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, ErrorRed),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed)
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Full Cancel", fontWeight = FontWeight.Bold)
                                        Text("Entire leave", style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                                Button(
                                    onClick = { actionDialogType = ActionType.PARTIAL_CANCEL },
                                    colors = ButtonDefaults.buttonColors(containerColor = WarningAmber),
                                    modifier = Modifier.weight(1f).height(50.dp),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Partial Cancel", fontWeight = FontWeight.Bold)
                                        Text("Future days only", style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                            }
                        } else {
                            // Only full cancel available
                            Button(
                                onClick = { actionDialogType = ActionType.FULL_CANCEL },
                                colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Rounded.DoNotDisturb, contentDescription = null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Cancel This Leave", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (uiState.leave != null) {
            val leave = uiState.leave!!
            
            // Generate timeline from LeaveRequest and Comments
            val timelineEvents = remember(leave, uiState.comments) {
                val events = mutableListOf<TimelineEvent>()
                // 1. Applied Event
                events.add(TimelineEvent(
                    titleId = R.string.applied_label,
                    descriptionId = R.string.applied_desc,
                    time = leave.createdAt.take(16).replace("T", " "),
                    completed = true
                ))
                // 2. Comments/Actions
                uiState.comments.forEach { comment ->
                    events.add(TimelineEvent(
                        titleText = comment.authorRole, // Using role as title part
                        descriptionText = comment.comment,
                        time = comment.createdAt.take(16).replace("T", " "),
                        completed = true,
                        isComment = true
                    ))
                }
                // 3. Current Status (if final)
                if (leave.status == "APPROVED" || leave.status == "REJECTED") {
                    events.add(TimelineEvent(
                        titleText = leave.status.lowercase().replaceFirstChar { it.uppercase() },
                        descriptionId = R.string.final_status,
                        time = leave.updatedAt.take(16).replace("T", " "),
                        completed = true
                    ))
                }
                events
            }

            Column(
                modifier = Modifier
                    .padding(paddingValues)
                    .fillMaxSize()
                    .padding(horizontal = 24.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Status Header
                Spacer(modifier = Modifier.height(16.dp))
                val statusColor = when(leave.status) {
                    "APPROVED" -> SuccessGreen
                    "REJECTED" -> ErrorRed
                    else -> WarningAmber
                }
                val statusIcon = when(leave.status) {
                    "APPROVED" -> Icons.Rounded.CheckCircle
                    "REJECTED" -> Icons.Rounded.DoNotDisturb
                    else -> Icons.Rounded.Timer
                }
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        statusIcon, 
                        contentDescription = null, 
                        tint = statusColor,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(stringResource(R.string.status_label), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(leave.status, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = statusColor)
                    }
                }
    
                Spacer(modifier = Modifier.height(32.dp))
    
                // Info Cards
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    InfoCard(
                        title = stringResource(R.string.type_label),
                        value = leave.type,
                        icon = Icons.Rounded.Timer,
                        modifier = Modifier.weight(1f)
                    )
                    InfoCard(
                        title = stringResource(R.string.duration_label),
                        value = stringResource(R.string.days_count, (leave.workingDays ?: 0).toString()),
                        icon = Icons.Rounded.Timer,
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))

                // Date Range and Approver
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Formatted Date Range
                    val dateRange = try {
                        val start = LocalDate.parse(leave.startDate.take(10)).format(java.time.format.DateTimeFormatter.ofPattern("MMM dd"))
                        val end = LocalDate.parse(leave.endDate.take(10)).format(java.time.format.DateTimeFormatter.ofPattern("MMM dd"))
                        if (start == end) start else "$start - $end"
                    } catch (e: Exception) {
                        leave.startDate.take(10)
                    }
                    
                    InfoCard(
                        title = "Date Range",
                        value = dateRange,
                        icon = Icons.Rounded.DateRange,
                        modifier = Modifier.weight(1f)
                    )
                    
                    if (leave.managerName != null) {
                        InfoCard(
                            title = "Approver",
                            value = leave.managerName,
                            icon = Icons.Rounded.CheckCircle, // Or person icon
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                         // Spacer to keep grid alignment if needed, or just standard flow
                         Spacer(modifier = Modifier.weight(1f))
                    }
                }
    
                Spacer(modifier = Modifier.height(24.dp))
    
                // Reason
                Text(stringResource(R.string.reason_label), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                if (leave.reason != null) {
                    Text(
                        leave.reason,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 20.sp
                    )
                } else {
                     Text(
                        stringResource(R.string.no_reason),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                    )
                }
    
                Spacer(modifier = Modifier.height(32.dp))

                // Certificates
                val days = leave.workingDays?.takeIf { it > 0 } ?: run {
                    try {
                        val start = LocalDate.parse(leave.startDate.take(10))
                        val end = LocalDate.parse(leave.endDate.take(10))
                        (ChronoUnit.DAYS.between(start, end) + 1).toInt()
                    } catch (e: Exception) {
                        1
                    }
                }
                val isMedical = leave.type.equals("MEDICAL", ignoreCase = true)
                val needsMedicalCert = isMedical && days > 3
                val needsFitnessCert = isMedical && days > 7
                if (needsMedicalCert || needsFitnessCert) {
                    Text("Certificates", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    if (needsMedicalCert) {
                        CertificateCard(
                            title = "Medical Certificate",
                            isUploaded = !leave.certificateUrl.isNullOrBlank(),
                            onUploadClick = {
                                pendingUploadType = "medical"
                                fileLauncher.launch("*/*")
                            }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                    if (needsFitnessCert) {
                        CertificateCard(
                            title = "Fitness Certificate",
                            isUploaded = !leave.fitnessCertificateUrl.isNullOrBlank(),
                            onUploadClick = {
                                pendingUploadType = "fitness"
                                fileLauncher.launch("*/*")
                            }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }

                // Timeline
                Text(stringResource(R.string.timeline), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))
                
                Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
                    timelineEvents.forEach { event ->
                        TimelineItem(event)
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        } else if (uiState.error != null) {
             Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                Text(stringResource(R.string.error_generic) + ": ${uiState.error}", color = MaterialTheme.colorScheme.error)
            }
        }
        
        // Action Dialog
        if (actionDialogType != null) {
            val isFullCancel = actionDialogType == ActionType.FULL_CANCEL
            val isPartialCancel = actionDialogType == ActionType.PARTIAL_CANCEL
            val isCancel = isFullCancel || isPartialCancel
            val isReturn = actionDialogType == ActionType.RETURN
            val isForward = actionDialogType == ActionType.FORWARD
            val isApprove = actionDialogType == ActionType.APPROVE
            val dialogTitle = when(actionDialogType) {
                ActionType.APPROVE -> stringResource(R.string.approve_leave_confirm)
                ActionType.REJECT -> stringResource(R.string.reject_leave_confirm)
                ActionType.CANCEL -> "Cancel Leave Request?"
                ActionType.FULL_CANCEL -> "Cancel Entire Leave?"
                ActionType.PARTIAL_CANCEL -> "Cancel Future Days?"
                ActionType.RETURN -> "Return for Modification?"
                ActionType.FORWARD -> "Forward to Next Approver?"
                else -> ""
            }
            val dialogColor = when(actionDialogType) {
                ActionType.APPROVE -> SuccessGreen
                ActionType.FORWARD -> MaterialTheme.colorScheme.primary
                ActionType.RETURN, ActionType.PARTIAL_CANCEL -> WarningAmber
                else -> ErrorRed
            }
            
            AlertDialog(
                onDismissRequest = { actionDialogType = null },
                title = { Text(dialogTitle) },
                text = {
                    Column {
                        when {
                            isPartialCancel -> {
                                Text("This will cancel only future days of your leave.", 
                                     style = MaterialTheme.typography.bodySmall,
                                     color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Days already taken will remain. Please provide a reason:")
                            }
                            isFullCancel -> Text("This will cancel your entire leave request. Please provide a reason:")
                            else -> Text(stringResource(R.string.comment_optional))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = actionComment,
                            onValueChange = { actionComment = it },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text(if (isCancel) "Reason for cancellation (min 10 chars)..." else "Add a comment...") },
                            minLines = 2
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            when (actionDialogType) {
                                ActionType.APPROVE -> viewModel.approveLeave(token, leaveId, actionComment)
                                ActionType.REJECT -> viewModel.rejectLeave(token, leaveId, actionComment)
                                ActionType.CANCEL, ActionType.FULL_CANCEL -> viewModel.fullCancelLeave(token, leaveId, actionComment)
                                ActionType.PARTIAL_CANCEL -> viewModel.partialCancelLeave(token, leaveId, actionComment)
                                ActionType.FORWARD -> viewModel.forwardLeave(token, leaveId, actionComment)
                                ActionType.RETURN -> viewModel.returnLeave(token, leaveId, actionComment)
                                else -> {}
                            }
                            actionDialogType = null
                            actionComment = ""
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = dialogColor),
                        enabled = !isCancel || actionComment.length >= 10 // Cancel requires 10+ char reason
                    ) {
                        Text(when(actionDialogType) {
                            ActionType.APPROVE -> stringResource(R.string.approve)
                            ActionType.REJECT -> stringResource(R.string.reject)
                            ActionType.CANCEL, ActionType.FULL_CANCEL -> "Cancel Leave"
                            ActionType.PARTIAL_CANCEL -> "Cancel Future Days"
                            ActionType.FORWARD -> "Forward"
                            ActionType.RETURN -> "Return"
                            else -> ""
                        })
                    }
                },
                dismissButton = {
                    TextButton(onClick = { actionDialogType = null }) {
                        Text(stringResource(R.string.cancel))
                    }
                }
            )
        }
    }
}

enum class ActionType { APPROVE, REJECT, CANCEL, FULL_CANCEL, PARTIAL_CANCEL, FORWARD, RETURN }

@Composable
fun InfoCard(title: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(12.dp))
            Text(title, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun TimelineItem(event: TimelineEvent) {
    Row(modifier = Modifier.height(IntrinsicSize.Min)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(if (event.completed) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
            )
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .fillMaxHeight()
                    .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.padding(bottom = 24.dp)) {
            val title = if (event.titleId != null) stringResource(event.titleId) 
                        else if (event.isComment) stringResource(R.string.comment_label, event.titleText ?: "")
                        else event.titleText ?: ""
            val description = if (event.descriptionId != null) stringResource(event.descriptionId) else event.descriptionText ?: ""

            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            Text(event.time, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
        }
    }
}

@Composable
fun CertificateCard(
    title: String,
    isUploaded: Boolean,
    onUploadClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                if (isUploaded) "Uploaded" else "Missing",
                style = MaterialTheme.typography.bodySmall,
                color = if (isUploaded) SuccessGreen else ErrorRed
            )
            if (!isUploaded) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onUploadClick,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Upload")
                }
            }
        }
    }
}

data class TimelineEvent(
    val titleId: Int? = null,
    val titleText: String? = null,
    val descriptionId: Int? = null,
    val descriptionText: String? = null,
    val time: String,
    val completed: Boolean,
    val isComment: Boolean = false
)
