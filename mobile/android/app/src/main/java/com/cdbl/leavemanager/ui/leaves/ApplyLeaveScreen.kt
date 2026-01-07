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
import androidx.compose.material.icons.rounded.*
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.ui.theme.*
import com.cdbl.leavemanager.ui.leaves.components.LeaveCalendar
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.net.Uri
import androidx.compose.ui.res.stringResource
import com.cdbl.leavemanager.R
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

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
    var selectedTypeCode by remember { mutableStateOf("CASUAL") }
    var selectedTypeName by remember { mutableStateOf("Casual Leave") }
    var reason by remember { mutableStateOf("") }
    var selectedFileUri by remember { mutableStateOf<Uri?>(null) }
    
    // Calendar State
    var currentMonth by remember { mutableStateOf(YearMonth.now()) }
    var selectedStartDate by remember { mutableStateOf<LocalDate?>(null) }
    var selectedEndDate by remember { mutableStateOf<LocalDate?>(null) }
    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedFileUri = uri
    }
    
    // Leave Types - map policy codes to backend enum values
    val leaveTypes = remember(uiState.leavePolicies) {
        uiState.leavePolicies.map { policy ->
            val normalizedCode = policy.code.uppercase()
            val (icon, color, apiCode) = when (normalizedCode) {
                "6.21", "AL", "EL", "EARNED" -> Triple(Icons.Rounded.FlightTakeoff, Indigo600, "EARNED")
                "6.14", "SL", "MEDICAL" -> Triple(Icons.Rounded.Sick, ErrorRed, "MEDICAL")
                "6.20", "CL", "CASUAL" -> Triple(Icons.Rounded.Weekend, WarningAmber, "CASUAL")
                "LWP", "EXTRAWITHOUTPAY" -> Triple(Icons.Rounded.WorkOff, Color(0xFF14b8a6), "EXTRAWITHOUTPAY")
                "EXTRAWITHPAY" -> Triple(Icons.Rounded.Paid, Color(0xFF10b981), "EXTRAWITHPAY")
                "6.15", "MATERNITY" -> Triple(Icons.Rounded.ChildCare, Color(0xFFec4899), "MATERNITY")
                "6.16", "PATERNITY" -> Triple(Icons.Rounded.ChildFriendly, Color(0xFF3b82f6), "PATERNITY")
                "STUDY" -> Triple(Icons.Rounded.School, Color(0xFF8b5cf6), "STUDY")
                "SPECIAL" -> Triple(Icons.Rounded.Star, Color(0xFFf59e0b), "SPECIAL")
                else -> Triple(Icons.Rounded.Event, Color.Gray, normalizedCode)
            }
            LeaveTypeItem(name = policy.title, apiCode = apiCode, icon = icon, color = color)
        }
    }
    
    // Calculate days
    val daysDiff = if (selectedStartDate != null && selectedEndDate != null) {
        ChronoUnit.DAYS.between(selectedStartDate, selectedEndDate) + 1
    } else if (selectedStartDate != null) {
        1L
    } else {
        0L
    }

    // Get existing leaves map for calendar
    val existingLeavesMap = remember(uiState.existingLeaves) {
        viewModel.getExistingLeavesMap()
    }

    LaunchedEffect(uiState.success) {
        if (uiState.success) {
            onSuccess()
            viewModel.resetState()
        }
    }
    
    LaunchedEffect(Unit) {
        viewModel.loadBalance(token)
        viewModel.loadPolicies(token)
        viewModel.loadHolidays(token)
        viewModel.loadExistingLeaves(token)
    }

    // Handle date selection
    val onDateSelected: (LocalDate) -> Unit = { date ->
        when {
            selectedStartDate == null -> {
                selectedStartDate = date
                selectedEndDate = null
            }
            selectedEndDate == null -> {
                if (date.isBefore(selectedStartDate)) {
                    selectedEndDate = selectedStartDate
                    selectedStartDate = date
                } else {
                    selectedEndDate = date
                }
            }
            else -> {
                selectedStartDate = date
                selectedEndDate = null
            }
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp, bottom = 8.dp, start = 8.dp, end = 8.dp),
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
                Spacer(modifier = Modifier.width(48.dp))
            }
        },
        bottomBar = {
            // Request Summary & Submit
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    // Summary Row
                    if (selectedStartDate != null) {
                        Text(
                            "Request Summary",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    selectedTypeName,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    if (selectedEndDate != null) {
                                        "${selectedStartDate!!.format(DateTimeFormatter.ofPattern("MMM dd"))} - ${selectedEndDate!!.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))}"
                                    } else {
                                        selectedStartDate!!.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    "$daysDiff ${if (daysDiff == 1L) "day" else "days"}",
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                    
                    Button(
                        onClick = { 
                            if (!uiState.isLoading && selectedStartDate != null) {
                                val formatter = DateTimeFormatter.ISO_LOCAL_DATE
                                val start = selectedStartDate!!.format(formatter)
                                val end = (selectedEndDate ?: selectedStartDate!!).format(formatter)
                                viewModel.submitLeave(token, selectedTypeCode, start, end, reason, selectedFileUri) 
                            }
                        },
                        enabled = !uiState.isLoading && selectedStartDate != null && reason.isNotBlank(),
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text(stringResource(R.string.submit_application), fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.Rounded.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                        }
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
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Balance Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Indigo600),
                shape = RoundedCornerShape(20.dp)
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            stringResource(R.string.available_balance),
                            style = MaterialTheme.typography.labelMedium,
                            color = Indigo100
                        )
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                text = uiState.balance?.EARNED?.toInt()?.toString() ?: "--", 
                                style = MaterialTheme.typography.displaySmall, 
                                fontWeight = FontWeight.Bold, 
                                color = Color.White
                            )
                            Text(
                                " days",
                                style = MaterialTheme.typography.bodyLarge,
                                color = Indigo100,
                                modifier = Modifier.padding(bottom = 4.dp)
                            )
                        }
                    }
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color.White.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Rounded.AccountBalanceWallet,
                            contentDescription = null,
                            tint = Indigo100,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }

            // Leave Type Selection
            Column {
                Text(
                    stringResource(R.string.select_leave_type), 
                    style = MaterialTheme.typography.labelLarge, 
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (leaveTypes.isEmpty()) {
                        items(3) {
                            Box(
                                modifier = Modifier
                                    .size(width = 100.dp, height = 44.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            )
                        }
                    } else {
                        items(leaveTypes) { item ->
                            val isSelected = selectedTypeCode == item.apiCode
                            val bgColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
                            val contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            val borderColor = if (isSelected) Color.Transparent else MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(bgColor)
                                    .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                                    .clickable { 
                                        selectedTypeCode = item.apiCode
                                        selectedTypeName = item.name 
                                    }
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            ) {
                                Icon(
                                    item.icon,
                                    contentDescription = null,
                                    tint = if (isSelected) Color.White else item.color,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    item.name,
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = contentColor
                                )
                            }
                        }
                    }
                }
            }

            // Visual Calendar
            Column {
                Text(
                    "Select Dates",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                LeaveCalendar(
                    currentMonth = currentMonth,
                    onMonthChange = { currentMonth = it },
                    selectedStartDate = selectedStartDate,
                    selectedEndDate = selectedEndDate,
                    onDateSelected = onDateSelected,
                    holidays = uiState.holidays,
                    existingLeaves = existingLeavesMap,
                    weekendsBlocked = false
                )
            }

            // Reason Input
            Column {
                Text(
                    stringResource(R.string.reason), 
                    style = MaterialTheme.typography.labelLarge, 
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = reason,
                    onValueChange = { if (it.length <= 200) reason = it },
                    placeholder = { Text(stringResource(R.string.reason_hint)) },
                    modifier = Modifier.fillMaxWidth().height(120.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f),
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                    )
                )
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    horizontalArrangement = Arrangement.End
                ) {
                    Text(
                        "${reason.length}/200",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Attachment Button
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { launcher.launch("*/*") }
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Rounded.AttachFile,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (selectedFileUri != null) stringResource(R.string.file_attached) else stringResource(R.string.add_document),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = selectedFileUri?.path?.split("/")?.lastOrNull()?.take(30) ?: stringResource(R.string.tap_to_select),
                            style = MaterialTheme.typography.bodySmall,
                            color = if (selectedFileUri != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (selectedFileUri != null) {
                        IconButton(onClick = { selectedFileUri = null }) {
                            Icon(Icons.Rounded.Close, contentDescription = "Clear", tint = ErrorRed)
                        }
                    }
                }
            }

            // Error Message
            if (uiState.error != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = ErrorRed.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Rounded.Error, contentDescription = null, tint = ErrorRed)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(uiState.error!!, color = ErrorRed, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

data class LeaveTypeItem(val name: String, val apiCode: String, val icon: ImageVector, val color: Color)