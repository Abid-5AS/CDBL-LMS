package com.cdbl.leavemanager.ui.leaves

import android.app.DatePickerDialog
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AttachFile
import androidx.compose.material.icons.rounded.Error
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.io.File
import java.io.FileOutputStream
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditLeaveScreen(
    token: String,
    leaveId: Int,
    onBackClick: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: EditLeaveViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var startDate by remember { mutableStateOf<LocalDate?>(null) }
    var endDate by remember { mutableStateOf<LocalDate?>(null) }
    var reason by remember { mutableStateOf("") }
    var initialStartDate by remember { mutableStateOf<LocalDate?>(null) }
    var initialEndDate by remember { mutableStateOf<LocalDate?>(null) }
    var initialReason by remember { mutableStateOf("") }
    var selectedFileUri by remember { mutableStateOf<Uri?>(null) }

    val formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy")
    val isoFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    LaunchedEffect(leaveId) {
        viewModel.loadLeave(token, leaveId)
    }

    LaunchedEffect(uiState.leave) {
        uiState.leave?.let { leave ->
            startDate = LocalDate.parse(leave.startDate.take(10))
            endDate = LocalDate.parse(leave.endDate.take(10))
            reason = leave.reason ?: ""
            initialStartDate = startDate
            initialEndDate = endDate
            initialReason = reason
        }
    }

    LaunchedEffect(uiState.success) {
        if (uiState.success) {
            onSuccess()
        }
    }

    val days = if (startDate != null && endDate != null) {
        ChronoUnit.DAYS.between(startDate, endDate).toInt() + 1
    } else {
        0
    }

    val leave = uiState.leave
    val isMedical = leave?.type?.uppercase() == "MEDICAL"
    val isReturned = leave?.status?.uppercase() == "RETURNED"
    val requiresCertificate = isMedical && days > 3
    val hasExistingCertificate = leave?.certificateUrl?.isNotBlank() == true
    val needsCertificateUpload = requiresCertificate && !hasExistingCertificate && selectedFileUri == null
    val hasChanges = (startDate != initialStartDate) ||
        (endDate != initialEndDate) ||
        (reason.trim() != initialReason.trim()) ||
        (selectedFileUri != null)

    val startPicker = DatePickerDialog(
        context,
        { _, year, month, day ->
            startDate = LocalDate.of(year, month + 1, day)
            if (endDate != null && startDate != null && endDate!!.isBefore(startDate)) {
                endDate = startDate
            }
        },
        startDate?.year ?: LocalDate.now().year,
        (startDate?.monthValue ?: LocalDate.now().monthValue) - 1,
        startDate?.dayOfMonth ?: LocalDate.now().dayOfMonth
    )

    val endPicker = DatePickerDialog(
        context,
        { _, year, month, day ->
            endDate = LocalDate.of(year, month + 1, day)
        },
        endDate?.year ?: LocalDate.now().year,
        (endDate?.monthValue ?: LocalDate.now().monthValue) - 1,
        endDate?.dayOfMonth ?: LocalDate.now().dayOfMonth
    )

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedFileUri = uri
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Edit & Resubmit", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            uiState.error != null && uiState.leave == null -> Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(uiState.error ?: "Failed to load leave", color = MaterialTheme.colorScheme.error)
            }
            else -> Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (leave != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Leave Type", style = MaterialTheme.typography.labelMedium)
                            Text(leave.type, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                if (leave != null && !isReturned) {
                    Text(
                        "Only returned requests can be resubmitted.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Dates", style = MaterialTheme.typography.labelMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Button(onClick = {
                                startPicker.datePicker.minDate = System.currentTimeMillis()
                                startPicker.show()
                            }, modifier = Modifier.weight(1f)) {
                                Text(startDate?.format(formatter) ?: "Start Date")
                            }
                            Button(onClick = {
                                val minDate = startDate?.toEpochDay()?.let { it * 86_400_000L } ?: System.currentTimeMillis()
                                endPicker.datePicker.minDate = minDate
                                endPicker.show()
                            }, modifier = Modifier.weight(1f)) {
                                Text(endDate?.format(formatter) ?: "End Date")
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Total: $days day(s)", style = MaterialTheme.typography.bodySmall)
                    }
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Reason", style = MaterialTheme.typography.labelMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = reason,
                            onValueChange = { if (it.length <= 500) reason = it },
                            modifier = Modifier.fillMaxWidth().height(120.dp),
                            placeholder = { Text("Update the reason for your leave request...") }
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("${reason.length}/500", style = MaterialTheme.typography.labelSmall)
                    }
                }

                if (isMedical) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Medical Certificate", style = MaterialTheme.typography.labelMedium)
                            Spacer(modifier = Modifier.height(8.dp))
                            if (hasExistingCertificate && selectedFileUri == null) {
                                Text("Existing certificate on file", style = MaterialTheme.typography.bodySmall)
                            }
                            Button(onClick = { launcher.launch("*/*") }) {
                                Icon(Icons.Rounded.AttachFile, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(if (selectedFileUri != null) "Change File" else "Upload File")
                            }
                            if (needsCertificateUpload) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "Medical certificate is required for sick leave over 3 days",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }

                if (uiState.error != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.error.copy(alpha = 0.1f))
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Rounded.Error, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(uiState.error ?: "Error", color = MaterialTheme.colorScheme.error)
                        }
                    }
                }

                Button(
                    onClick = {
                        val start = startDate?.format(isoFormatter)
                        val end = endDate?.format(isoFormatter)
                        if (leave != null && start != null && end != null) {
                            val file = selectedFileUri?.let { uri -> getFileFromUri(context, uri) }
                            viewModel.resubmitLeave(
                                token = token,
                                leaveId = leaveId,
                                type = leave.type,
                                startDate = start,
                                endDate = end,
                                reason = reason.trim(),
                                needsCertificate = requiresCertificate,
                                file = file
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isSubmitting && isReturned && hasChanges && reason.trim().length >= 10 && startDate != null && endDate != null && !needsCertificateUpload
                ) {
                    Text(if (uiState.isSubmitting) "Resubmitting..." else "Resubmit Request")
                }
            }
        }
    }
}

private fun getFileFromUri(context: android.content.Context, uri: Uri): File? {
    return try {
        val fileName = "leave_resubmit_${System.currentTimeMillis()}"
        val tempFile = File(context.cacheDir, fileName)
        context.contentResolver.openInputStream(uri)?.use { inputStream ->
            FileOutputStream(tempFile).use { outputStream ->
                inputStream.copyTo(outputStream)
            }
        }
        tempFile
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}
