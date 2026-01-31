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
import androidx.compose.ui.platform.LocalContext
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
    var incidentDate by remember { mutableStateOf<LocalDate?>(null) }
    
    // Calendar State
    var currentMonth by remember { mutableStateOf(YearMonth.now()) }
    var selectedStartDate by remember { mutableStateOf<LocalDate?>(null) }
    var selectedEndDate by remember { mutableStateOf<LocalDate?>(null) }
    
    // Half-day state
    var isHalfDay by remember { mutableStateOf(false) }
    var halfDayPeriod by remember { mutableStateOf("AM") }
    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedFileUri = uri
    }

    val context = LocalContext.current
    
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
                "SPECIAL_DISABILITY" -> Triple(Icons.Rounded.Accessible, Color(0xFF5b21b6), "SPECIAL_DISABILITY")
                "QUARANTINE" -> Triple(Icons.Rounded.Masks, Color(0xFF0ea5e9), "QUARANTINE")
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

    // Helper for checking weekends/holidays
    val isWeekendOrHoliday = remember(uiState.holidays) {
        { checkDate: LocalDate ->
            val isFriSat = checkDate.dayOfWeek.value == 5 || checkDate.dayOfWeek.value == 6
            val isHoliday = uiState.holidays.any { h -> h == checkDate }
            isFriSat || isHoliday
        }
    }

    // Handle date selection
    val onDateSelected: (LocalDate) -> Unit = { date ->
        val today = LocalDate.now()
        val minAllowedDate = if (selectedTypeCode in listOf("MEDICAL", "EARNED", "QUARANTINE")) {
            today.minusDays(30)
        } else {
            today
        }

        if (date.isBefore(minAllowedDate)) {
            // TODO: Show toast/error that past dates are not allowed for this type
        } else {
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
                    if (selectedStartDate != null && selectedEndDate != null && selectedStartDate != selectedEndDate) {
                        isHalfDay = false
                    }
                }
                else -> {
                    selectedStartDate = date
                    selectedEndDate = null
                    isHalfDay = false
                }
            }
        }
    }

    fun workingDaysUntil(start: LocalDate): Int {
        val today = LocalDate.now()
        if (!start.isAfter(today)) return 0
        var count = 0
        var cursor = today
        while (cursor.isBefore(start)) {
            cursor = cursor.plusDays(1)
            if (!isWeekendOrHoliday(cursor)) {
                count++
            }
        }
        return count
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
                            val isMedical = selectedTypeCode == "MEDICAL"
                            val requiresDoc = isMedical && daysDiff > 3
                            
                            val isCasual = selectedTypeCode == "CASUAL"
                            val isWeekendStart = selectedStartDate?.let { isWeekendOrHoliday(it) } == true
                            val isWeekendEnd = selectedEndDate?.let { isWeekendOrHoliday(it) } == true || (selectedEndDate == null && isWeekendStart)
                            
                            val casualViolation = isCasual && (daysDiff > 3 || isWeekendStart || isWeekendEnd)
                            
                            val extraLeaveViolation = (selectedTypeCode == "EXTRAWITHPAY" || selectedTypeCode == "EXTRAWITHOUTPAY") &&
                                run {
                                    val balance = uiState.balance
                                    val casual = balance?.CASUAL ?: 0.0
                                    val earned = balance?.EARNED ?: 0.0
                                    val medical = balance?.MEDICAL ?: 0.0
                                    casual > 2 || earned > 0 || medical > 5
                                }

                            val earnedNoticeViolation = selectedTypeCode == "EARNED" &&
                                selectedStartDate != null &&
                                workingDaysUntil(selectedStartDate!!) in 0..4

                            val incidentViolation = selectedTypeCode == "SPECIAL_DISABILITY" && run {
                                val start = selectedStartDate
                                val incident = incidentDate
                                if (start == null || incident == null) {
                                    true
                                } else {
                                    val threeMonthsAgo = start.minusDays(90)
                                    incident.isAfter(start) || incident.isAfter(LocalDate.now()) || incident.isBefore(threeMonthsAgo)
                                }
                            }

                            val reasonTooShort = reason.trim().length < 10

                            if (casualViolation) {
                                // Block submit
                            } else if (reasonTooShort) {
                                // Block submit for reason length
                            } else if (earnedNoticeViolation) {
                                // Block submit for notice period
                            } else if (extraLeaveViolation) {
                                // Block submit for extraordinary leave rules
                            } else if (incidentViolation) {
                                // Block submit for incident date rules
                            } else if (requiresDoc && selectedFileUri == null) {
                                // Block submit for doc check
                            } else if (!uiState.isLoading && selectedStartDate != null) {
                                val formatter = DateTimeFormatter.ISO_LOCAL_DATE
                                val start = selectedStartDate!!.format(formatter)
                                val end = (selectedEndDate ?: selectedStartDate!!).format(formatter)
                                val incident = incidentDate?.format(formatter)
                                viewModel.submitLeave(
                                    token,
                                    selectedTypeCode,
                                    start,
                                    end,
                                    reason,
                                    selectedFileUri,
                                    isHalfDay,
                                    if (isHalfDay) halfDayPeriod else null,
                                    if (requiresDoc) true else null,
                                    incident
                                ) 
                            }
                        },
                        enabled = !uiState.isLoading && selectedStartDate != null && reason.isNotBlank() && 
                                reason.trim().length >= 10 &&
                                !(selectedTypeCode == "MEDICAL" && daysDiff > 3 && selectedFileUri == null) &&
                                !(selectedTypeCode == "CASUAL" && (daysDiff > 3 || (selectedStartDate?.let { isWeekendOrHoliday(it) } == true) || (selectedEndDate?.let { isWeekendOrHoliday(it) } == true))) &&
                                !((selectedTypeCode == "EXTRAWITHPAY" || selectedTypeCode == "EXTRAWITHOUTPAY") && run {
                                    val balance = uiState.balance
                                    val casual = balance?.CASUAL ?: 0.0
                                    val earned = balance?.EARNED ?: 0.0
                                    val medical = balance?.MEDICAL ?: 0.0
                                    casual > 2 || earned > 0 || medical > 5
                                }) &&
                                !(selectedTypeCode == "EARNED" && selectedStartDate != null && workingDaysUntil(selectedStartDate!!) in 0..4) &&
                                !(selectedTypeCode == "SPECIAL_DISABILITY" && run {
                                    val start = selectedStartDate
                                    val incident = incidentDate
                                    if (start == null || incident == null) {
                                        true
                                    } else {
                                        val threeMonthsAgo = start.minusDays(90)
                                        incident.isAfter(start) || incident.isAfter(LocalDate.now()) || incident.isBefore(threeMonthsAgo)
                                    }
                                }),
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
                                        selectedFileUri = null
                                        isHalfDay = false
                                        halfDayPeriod = "AM"
                                        if (item.apiCode != "SPECIAL_DISABILITY") {
                                            incidentDate = null
                                        }
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

            // Half-Day Toggle (only show for single day selection)
            if (selectedStartDate != null && (selectedEndDate == null || selectedStartDate == selectedEndDate) && (selectedTypeCode == "CASUAL" || selectedTypeCode == "EARNED")) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    "Half Day Leave",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    "Apply for half a day only",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = isHalfDay,
                                onCheckedChange = { isHalfDay = it }
                            )
                        }
                        
                        if (isHalfDay) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                FilterChip(
                                    onClick = { halfDayPeriod = "AM" },
                                    label = { Text("First Half (AM)") },
                                    selected = halfDayPeriod == "AM",
                                    leadingIcon = if (halfDayPeriod == "AM") {
                                        { Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp)) }
                                    } else null
                                )
                                FilterChip(
                                    onClick = { halfDayPeriod = "PM" },
                                    label = { Text("Second Half (PM)") },
                                    selected = halfDayPeriod == "PM",
                                    leadingIcon = if (halfDayPeriod == "PM") {
                                        { Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp)) }
                                    } else null
                                )
                            }
                        }
                    }
                }
            }

            // Incident Date (Special Disability)
            if (selectedTypeCode == "SPECIAL_DISABILITY") {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Incident Date",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        val formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy")
                        val displayDate = incidentDate?.format(formatter) ?: "Select incident date"
                        Button(onClick = {
                            val today = LocalDate.now()
                            val initial = incidentDate ?: today
                            android.app.DatePickerDialog(
                                context,
                                { _, year, month, dayOfMonth ->
                                    incidentDate = LocalDate.of(year, month + 1, dayOfMonth)
                                },
                                initial.year,
                                initial.monthValue - 1,
                                initial.dayOfMonth
                            ).show()
                        }) {
                            Text(displayDate)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "Incident must be within 3 months before the leave start date.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
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
                    onValueChange = { if (it.length <= 500) reason = it },
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
                        "${reason.length}/500",
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
            if (selectedTypeCode == "MEDICAL" && daysDiff > 3 && selectedFileUri == null) {
                 Text(
                    text = "* Medical certificate required for sick leave > 3 days",
                    style = MaterialTheme.typography.labelSmall,
                    color = ErrorRed,
                    modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                )
            }
            if (selectedTypeCode == "EARNED" && selectedStartDate != null && workingDaysUntil(selectedStartDate!!) in 0..4) {
                Text(
                    text = "* Earned Leave requires at least 5 working days advance notice",
                    style = MaterialTheme.typography.labelSmall,
                    color = ErrorRed,
                    modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                )
            }
            if ((selectedTypeCode == "EXTRAWITHPAY" || selectedTypeCode == "EXTRAWITHOUTPAY") && run {
                val balance = uiState.balance
                val casual = balance?.CASUAL ?: 0.0
                val earned = balance?.EARNED ?: 0.0
                val medical = balance?.MEDICAL ?: 0.0
                casual > 2 || earned > 0 || medical > 5
            }) {
                Text(
                    text = "* Extraordinary Leave requires other leave balances to be exhausted (Policy 6.26)",
                    style = MaterialTheme.typography.labelSmall,
                    color = ErrorRed,
                    modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                )
            }
            if (selectedTypeCode == "SPECIAL_DISABILITY") {
                val start = selectedStartDate
                val incident = incidentDate
                val incidentInvalid = if (start == null || incident == null) {
                    true
                } else {
                    val threeMonthsAgo = start.minusDays(90)
                    incident.isAfter(start) || incident.isAfter(LocalDate.now()) || incident.isBefore(threeMonthsAgo)
                }
                if (incidentInvalid) {
                    Text(
                        text = "* Incident date is required and must be within 3 months before leave start",
                        style = MaterialTheme.typography.labelSmall,
                        color = ErrorRed,
                        modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                    )
                }
            }
            if (selectedTypeCode == "CASUAL") {
                if (daysDiff > 3) {
                     Text(
                        text = "* Casual Leave cannot exceed 3 consecutive days",
                        style = MaterialTheme.typography.labelSmall,
                        color = ErrorRed,
                        modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                    )
                }
                if (selectedStartDate != null && isWeekendOrHoliday(selectedStartDate!!)) {
                     Text(
                        text = "* Casual Leave cannot start on a holiday/weekend",
                        style = MaterialTheme.typography.labelSmall,
                        color = ErrorRed,
                        modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                    )
                }
                 if (selectedEndDate != null && isWeekendOrHoliday(selectedEndDate!!)) {
                     Text(
                        text = "* Casual Leave cannot end on a holiday/weekend",
                        style = MaterialTheme.typography.labelSmall,
                        color = ErrorRed,
                        modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                    )
                 }
            }
            if (reason.isNotBlank() && reason.trim().length < 10) {
                Text(
                    text = "* Reason must be at least 10 characters",
                    style = MaterialTheme.typography.labelSmall,
                    color = ErrorRed,
                    modifier = Modifier.padding(start = 4.dp, top = 4.dp)
                )
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
