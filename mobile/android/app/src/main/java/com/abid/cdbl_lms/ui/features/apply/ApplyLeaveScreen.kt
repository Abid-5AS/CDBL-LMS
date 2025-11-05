package com.abid.cdbl_lms.ui.features.apply

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.InsertDriveFile
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository
import com.abid.cdbl_lms.domain.policy.LeavePolicyValidator
import com.abid.cdbl_lms.ui.navigation.Screen
import com.abid.cdbl_lms.ui.viewmodel.ApplyLeaveViewModel
import com.abid.cdbl_lms.ui.viewmodel.ApplyLeaveViewModelFactory
import com.abid.cdbl_lms.util.DateUtils
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApplyLeaveScreen(
    navController: NavController,
    leaveRepository: LeaveRepository,
    balanceRepository: LeaveBalanceRepository,
    viewModel: ApplyLeaveViewModel = viewModel(
        factory = ApplyLeaveViewModelFactory(leaveRepository, balanceRepository)
    )
) {
    val selectedType by viewModel.selectedType.collectAsState()
    val startDate by viewModel.startDate.collectAsState()
    val endDate by viewModel.endDate.collectAsState()
    val reason by viewModel.reason.collectAsState()
    val errors by viewModel.errors.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val workingDays by viewModel.workingDays.collectAsState()
    val requiresCertificate by viewModel.requiresCertificate.collectAsState()
    val currentBalance by viewModel.currentBalance.collectAsState()
    val policyWarnings by viewModel.policyWarnings.collectAsState()

    var showTypeMenu by remember { mutableStateOf(false) }
    var showStartDatePicker by remember { mutableStateOf(false) }
    var showEndDatePicker by remember { mutableStateOf(false) }
    var showSuccessDialog by remember { mutableStateOf(false) }

    val dateFormatter = remember {
        SimpleDateFormat("dd MMM yyyy", Locale.ENGLISH).apply {
            timeZone = java.util.TimeZone.getTimeZone("Asia/Dhaka")
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Apply for Leave") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Info Banner
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = "Select leave type, duration, and add a short reason. Attach supporting documents when necessary.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            // Leave Type Selection
            Text(
                text = "Leave Type *",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            ExposedDropdownMenuBox(
                expanded = showTypeMenu,
                onExpandedChange = { showTypeMenu = !showTypeMenu }
            ) {
                OutlinedTextField(
                    value = selectedType?.name ?: "",
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showTypeMenu) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(), // TODO: Update when MenuAnchorType API is available
                    placeholder = { Text("Select leave type") },
                    isError = errors.containsKey("type"),
                    supportingText = {
                        if (errors.containsKey("type")) {
                            Text(errors["type"] ?: "")
                        } else if (currentBalance != null) {
                            Text("Available: $currentBalance days")
                        }
                    }
                )
                ExposedDropdownMenu(
                    expanded = showTypeMenu,
                    onDismissRequest = { showTypeMenu = false }
                ) {
                    LeaveType.values().forEach { type ->
                        DropdownMenuItem(
                            text = { Text(type.name) },
                            onClick = {
                                viewModel.selectedType.value = type
                                showTypeMenu = false
                            }
                        )
                    }
                }
            }

            // Date Range Selection
            Text(
                text = "Date Range *",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Start Date
                OutlinedTextField(
                    value = startDate?.let { dateFormatter.format(it) } ?: "",
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { showStartDatePicker = true },
                    placeholder = { Text("Start Date") },
                    leadingIcon = {
                        Icon(Icons.Default.Event, contentDescription = null)
                    },
                    isError = errors.containsKey("startDate"),
                    supportingText = {
                        if (errors.containsKey("startDate")) {
                            Text(errors["startDate"] ?: "")
                        }
                    }
                )

                // End Date
                OutlinedTextField(
                    value = endDate?.let { dateFormatter.format(it) } ?: "",
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { showEndDatePicker = true },
                    placeholder = { Text("End Date") },
                    leadingIcon = {
                        Icon(Icons.Default.Event, contentDescription = null)
                    },
                    isError = errors.containsKey("endDate"),
                    supportingText = {
                        if (errors.containsKey("endDate")) {
                            Text(errors["endDate"] ?: "")
                        }
                    }
                )
            }

            if (startDate != null && endDate != null) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Duration: $workingDays day${if (workingDays > 1) "s" else ""}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                        if (errors.containsKey("dates")) {
                            Text(
                                text = errors["dates"] ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                        if (errors.containsKey("balance")) {
                            Text(
                                text = errors["balance"] ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }

            // Policy Warnings
            if (policyWarnings.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Text(
                                text = "Policy Warnings",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                        policyWarnings.forEach { warning ->
                            Text(
                                text = "• $warning",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            }

            // Reason Input
            Text(
                text = "Reason *",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            OutlinedTextField(
                value = reason,
                onValueChange = { viewModel.reason.value = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Enter reason for leave (minimum 10 characters)") },
                minLines = 3,
                maxLines = 5,
                isError = errors.containsKey("reason"),
                supportingText = {
                    if (errors.containsKey("reason")) {
                        Text(errors["reason"] ?: "")
                    } else {
                        Text("${reason.trim().length} characters")
                    }
                }
            )

            // Certificate Upload
            if (requiresCertificate) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.InsertDriveFile,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                            Text(
                                text = "Medical Certificate Required",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                        Text(
                            text = "Medical Leave over 3 days requires a certificate attachment.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Button(
                            onClick = {
                                // TODO: Implement file picker
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.AutoMirrored.Filled.InsertDriveFile, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Attach Certificate")
                        }
                        if (errors.containsKey("certificate")) {
                            Text(
                                text = errors["certificate"] ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        viewModel.saveDraft {
                            // TODO: Show draft saved message
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Save Draft")
                }
                Button(
                    onClick = {
                        viewModel.submitLeaveRequest(
                            onSuccess = {
                                showSuccessDialog = true
                            },
                            onError = { error ->
                                // TODO: Show error snackbar
                            }
                        )
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !isSubmitting
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text("Submit Request")
                }
            }
        }
    }

    // Date Pickers (using Material 3 DatePicker)
    if (showStartDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = startDate?.time,
            initialDisplayedMonthMillis = System.currentTimeMillis()
        )
        CustomDatePickerDialog(
            onDismissRequest = { showStartDatePicker = false },
            onConfirm = {
                datePickerState.selectedDateMillis?.let { millis ->
                    viewModel.startDate.value = Date(millis)
                }
                showStartDatePicker = false
            },
            datePickerState = datePickerState
        )
    }

    if (showEndDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = endDate?.time,
            initialDisplayedMonthMillis = System.currentTimeMillis()
        )
        CustomDatePickerDialog(
            onDismissRequest = { showEndDatePicker = false },
            onConfirm = {
                datePickerState.selectedDateMillis?.let { millis ->
                    viewModel.endDate.value = Date(millis)
                }
                showEndDatePicker = false
            },
            datePickerState = datePickerState
        )
    }

    // Success Dialog
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { showSuccessDialog = false },
            title = { Text("Leave Request Submitted") },
            text = { Text("Your leave request has been submitted successfully.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showSuccessDialog = false
                        navController.navigate(Screen.LeaveHistory.route) {
                            popUpTo(Screen.Dashboard.route) { inclusive = false }
                        }
                    }
                ) {
                    Text("OK")
                }
            }
        )
    }
}

// Simple DatePickerDialog wrapper
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomDatePickerDialog(
    onDismissRequest: () -> Unit,
    onConfirm: () -> Unit,
    datePickerState: androidx.compose.material3.DatePickerState
) {
    DatePickerDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismissRequest) {
                Text("Cancel")
            }
        },
    ) {
        DatePicker(
            state = datePickerState,
            colors = DatePickerDefaults.colors()
        )
    }
}
