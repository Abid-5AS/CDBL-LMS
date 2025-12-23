package com.cdbl.leavemanager.ui.leaves

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.AttachFile
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.rounded.AccountBalanceWallet
import androidx.compose.material.icons.rounded.AttachFile
import androidx.compose.material.icons.rounded.CalendarToday
import androidx.compose.material.icons.rounded.Event
import androidx.compose.material.icons.rounded.FlightTakeoff
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material.icons.rounded.Sick
import androidx.compose.material.icons.rounded.Weekend
import androidx.compose.material.icons.rounded.WorkOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.ui.theme.*
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.net.Uri
import androidx.compose.ui.res.stringResource
import com.cdbl.leavemanager.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApplyLeaveScreen(
    token: String,
    onBackClick: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: ApplyLeaveViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    // UI State
    var selectedType by remember { mutableStateOf("Annual") }
    var reason by remember { mutableStateOf("") }
    var selectedFileUri by remember { mutableStateOf<Uri?>(null) }
    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedFileUri = uri
    }
    
    // Mock Data
    // Dynamic Leave Types
    val leaveTypes = remember(uiState.leavePolicies) {
        uiState.leavePolicies.map { policy ->
            val (icon, color) = when (policy.code) {
                "AL" -> Icons.Rounded.FlightTakeoff to Indigo600
                "SL" -> Icons.Rounded.Sick to ErrorRed
                "CL" -> Icons.Rounded.Weekend to WarningAmber
                "LWP" -> Icons.Rounded.WorkOff to Color(0xFF14b8a6) // Teal
                else -> Icons.Rounded.Event to Color.Gray
            }
            LeaveTypeItem(name = policy.title, icon = icon, color = color)
        }
    }

    // Date State
    var showStartDatePicker by remember { mutableStateOf(false) }
    var showEndDatePicker by remember { mutableStateOf(false) }
    var startDateMillis by remember { mutableStateOf(System.currentTimeMillis()) }
    var endDateMillis by remember { mutableStateOf(System.currentTimeMillis() + 86400000) } // +1 day

    // Format dates for display and calculation
    val dateFormatter = java.time.format.DateTimeFormatter.ofPattern("MMM dd")
    val dayFormatter = java.time.format.DateTimeFormatter.ofPattern("EEEE, yyyy")
    
    val startLocalDate = java.time.Instant.ofEpochMilli(startDateMillis).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
    val endLocalDate = java.time.Instant.ofEpochMilli(endDateMillis).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
    
    // Calculate days
    val daysDiff = java.time.temporal.ChronoUnit.DAYS.between(startLocalDate, endLocalDate) + 1

    LaunchedEffect(uiState.success) {
        if (uiState.success) {
            onSuccess()
            viewModel.resetState()
        }
    }
    
    LaunchedEffect(Unit) {
        viewModel.loadBalance(token)
        viewModel.loadPolicies(token)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp, bottom = 16.dp, start = 16.dp, end = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackClick) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = stringResource(R.string.back))
                }
                Text(
                    text = stringResource(R.string.apply_leave_title),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                IconButton(onClick = { }) {
                    Icon(Icons.Rounded.MoreVert, contentDescription = "Menu")
                }
            }
        },
        bottomBar = {
            Column(
                modifier = Modifier
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.05f))
                    .padding(24.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(stringResource(R.string.total_days), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$daysDiff " + stringResource(R.string.total), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { 
                        // Submit with selected dates
                        if (!uiState.isLoading) {
                            val formatter = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE
                            viewModel.submitLeave(
                                token, 
                                selectedType, 
                                startLocalDate.format(formatter), 
                                endLocalDate.format(formatter), 
                                reason,
                                selectedFileUri
                            ) 
                        }
                    },
                    enabled = !uiState.isLoading,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text(stringResource(R.string.submit_application), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(Icons.Rounded.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Gradient Available Balance Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Indigo600, Color(0xFF4f46e5)) // Indigo to lighter indigo
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
                            Text(stringResource(R.string.available_balance), style = MaterialTheme.typography.labelMedium, color = Indigo100)
                            Row(verticalAlignment = Alignment.Bottom) {
                                Text(
                                    text = uiState.balance?.EARNED?.toInt()?.toString() ?: "--", 
                                    style = MaterialTheme.typography.displayMedium, 
                                    fontWeight = FontWeight.Bold, 
                                    color = Color.White
                                )
                                Text(" " + stringResource(R.string.days_left), style = MaterialTheme.typography.titleMedium, color = Indigo100, modifier = Modifier.padding(bottom = 6.dp))
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
                    Column {
                        // Progress Bar
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.2f))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(0.7f)
                                    .fillMaxHeight()
                                    .clip(CircleShape)
                                    .background(Color.White)
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(stringResource(R.string.updated_today), style = MaterialTheme.typography.labelSmall, color = Indigo100, modifier = Modifier.align(Alignment.End))
                    }
                }
            }

            // Leave Type Selection
            Column {
                Text(
                    stringResource(R.string.select_leave_type), 
                    style = MaterialTheme.typography.labelLarge, 
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (leaveTypes.isEmpty()) {
                        // Skeleton/Loading State
                        items(3) {
                            Box(
                                modifier = Modifier
                                    .size(width = 100.dp, height = 50.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            )
                        }
                    } else {
                        items(leaveTypes) { item ->
                        val isSelected = selectedType == item.name
                        val bgColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
                        val contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        val borderColor = if (isSelected) Color.Transparent else MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(bgColor)
                                .border(1.dp, borderColor, RoundedCornerShape(16.dp))
                                .clickable { selectedType = item.name }
                                .padding(horizontal = 16.dp, vertical = 12.dp)
                        ) {
                            Icon(item.icon, contentDescription = null, tint = if (isSelected) Color.White else item.color, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(item.name, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = contentColor)
                        }
                    }
                    }
                }
            }

            // Date Selection
            if (showStartDatePicker) {
               val datePickerState = rememberDatePickerState(initialSelectedDateMillis = startDateMillis)
                DatePickerDialog(
                    onDismissRequest = { showStartDatePicker = false },
                    confirmButton = {
                        TextButton(onClick = {
                            datePickerState.selectedDateMillis?.let { startDateMillis = it }
                            showStartDatePicker = false
                        }) { Text("OK") }
                    },
                    dismissButton = {
                        TextButton(onClick = { showStartDatePicker = false }) { Text("Cancel") }
                    }
                ) {
                    DatePicker(state = datePickerState)
                }
            }

            if (showEndDatePicker) {
                val datePickerState = rememberDatePickerState(initialSelectedDateMillis = endDateMillis)
                DatePickerDialog(
                    onDismissRequest = { showEndDatePicker = false },
                    confirmButton = {
                        TextButton(onClick = {
                            datePickerState.selectedDateMillis?.let { endDateMillis = it }
                            showEndDatePicker = false
                        }) { Text("OK") }
                    },
                    dismissButton = {
                        TextButton(onClick = { showEndDatePicker = false }) { Text("Cancel") }
                    }
                ) {
                    DatePicker(state = datePickerState)
                }
            }

            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        stringResource(R.string.select_dates), 
                        style = MaterialTheme.typography.labelLarge, 
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        stringResource(R.string.days_selected, daysDiff.toInt()), 
                        style = MaterialTheme.typography.labelSmall, 
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Start Date
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { showStartDatePicker = true }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                             Icon(Icons.Rounded.CalendarToday, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.align(Alignment.End))
                             Spacer(modifier = Modifier.height(8.dp))
                             Text(stringResource(R.string.start_date), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                             Text(startLocalDate.format(dateFormatter), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                             Text(startLocalDate.format(dayFormatter), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    // End Date
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                         border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { showEndDatePicker = true }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                             Icon(Icons.Rounded.Event, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.align(Alignment.End))
                             Spacer(modifier = Modifier.height(8.dp))
                             Text(stringResource(R.string.end_date), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                             Text(endLocalDate.format(dateFormatter), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                             Text(endLocalDate.format(dayFormatter), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            // Reason
            Column {
                Text(
                    stringResource(R.string.reason), 
                    style = MaterialTheme.typography.labelLarge, 
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    placeholder = { Text(stringResource(R.string.reason_hint)) },
                    modifier = Modifier.fillMaxWidth().height(140.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f),
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                    )
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Text("${reason.length}/150", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            
            // Supporting Document Button
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
                    .clickable { launcher.launch("*/*") }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                   Box(
                       modifier = Modifier
                           .size(40.dp)
                           .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                       contentAlignment = Alignment.Center
                   ) {
                       Icon(Icons.Rounded.AttachFile, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                   }
                   Spacer(modifier = Modifier.width(16.dp))
                   Column(modifier = Modifier.weight(1f)) {
                       Text(
                           text = if (selectedFileUri != null) stringResource(R.string.file_attached) else stringResource(R.string.add_document),
                           style = MaterialTheme.typography.titleMedium,
                           fontWeight = FontWeight.SemiBold
                       )
                       Text(
                           text = selectedFileUri?.path?.let { 
                               val name = it.split("/").last() 
                               if (name.length > 20) "..." + name.takeLast(20) else name
                           } ?: stringResource(R.string.tap_to_select),
                           style = MaterialTheme.typography.bodySmall,
                           color = if (selectedFileUri != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                       )
                   }
                   if (selectedFileUri != null) {
                       IconButton(onClick = { selectedFileUri = null }) {
                           Icon(Icons.Rounded.WorkOff, contentDescription = "Clear", tint = ErrorRed) // Using WorkOff as a close icon replacement if Close not avail
                       }
                   }
                }
            }
        }
    }
}

data class LeaveTypeItem(val name: String, val icon: ImageVector, val color: Color)