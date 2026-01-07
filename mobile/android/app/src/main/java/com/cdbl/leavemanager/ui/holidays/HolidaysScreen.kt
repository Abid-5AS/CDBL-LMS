package com.cdbl.leavemanager.ui.holidays

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CalendarToday
import androidx.compose.material.icons.rounded.Event
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cdbl.leavemanager.data.model.Holiday
import com.cdbl.leavemanager.ui.designsystem.component.CDBLMockTag
import com.cdbl.leavemanager.ui.designsystem.component.CDBLTopAppBar
import com.cdbl.leavemanager.ui.components.KpiCard
import com.cdbl.leavemanager.ui.theme.ErrorRed
import com.cdbl.leavemanager.ui.theme.Indigo600
import com.cdbl.leavemanager.ui.theme.SuccessGreen
import androidx.compose.material.icons.rounded.Search
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HolidaysScreen(
    token: String,
    onBackClick: () -> Unit,
    viewModel: HolidaysViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadHolidays(token)
    }

    val today = LocalDate.now()
    val showMock = uiState.holidays.isEmpty() && uiState.error == null
    var searchQuery by remember { mutableStateOf("") }
    var viewMode by remember { mutableStateOf("grid") }
    val mockHolidays = listOf(
        Holiday(
            id = 101,
            date = LocalDate.now().plusDays(3).toString(),
            name = "Independence Day",
            isOptional = false,
            description = "National holiday"
        ),
        Holiday(
            id = 102,
            date = LocalDate.now().plusDays(12).toString(),
            name = "Company Foundation Day",
            isOptional = true,
            description = "Optional observance"
        ),
        Holiday(
            id = 103,
            date = LocalDate.now().plusDays(25).toString(),
            name = "Victory Day",
            isOptional = false,
            description = "Public holiday"
        )
    )
    val displayHolidays = if (showMock) mockHolidays else uiState.holidays

    val filterOptions = listOf("Upcoming", "All", "Optional")
    val selectedFilter = remember { mutableStateOf("Upcoming") }
    val filteredHolidays = displayHolidays
        .sortedBy { it.date }
        .filter { holiday ->
            val date = parseHolidayDate(holiday.date)
            val matchesFilter = when (selectedFilter.value) {
                "Upcoming" -> date != null && !date.isBefore(today)
                "Optional" -> holiday.isOptional
                else -> true
            }
            val matchesSearch = searchQuery.isBlank() || holiday.name.contains(searchQuery, ignoreCase = true)
            matchesFilter && matchesSearch
        }

    val upcomingCount = displayHolidays.count {
        val date = parseHolidayDate(it.date)
        date != null && !date.isBefore(today)
    }
    val optionalCount = displayHolidays.count { it.isOptional }
    val nextHoliday = displayHolidays
        .mapNotNull { holiday ->
            val date = parseHolidayDate(holiday.date)
            if (date != null && !date.isBefore(today)) holiday to date else null
        }
        .minByOrNull { it.second }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            CDBLTopAppBar(
                title = "Holidays",
                navigationIcon = Icons.AutoMirrored.Rounded.ArrowBack,
                navigationIconContentDescription = "Back",
                onNavigationClick = onBackClick
            )
        }
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(paddingValues).fillMaxSize()
            ) {
                item {
                    if (showMock) {
                        CDBLMockTag()
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            TextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                placeholder = { Text("Search holidays...") },
                                leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth(),
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                    disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                )
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                filterOptions.forEach { option ->
                                    FilterChip(
                                        selected = selectedFilter.value == option,
                                        onClick = { selectedFilter.value = option },
                                        label = { Text(option) }
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                listOf("grid" to "Grid", "list" to "List", "calendar" to "Calendar").forEach { (value, label) ->
                                    FilterChip(
                                        selected = viewMode == value,
                                        onClick = { viewMode = value },
                                        label = { Text(label) }
                                    )
                                }
                            }
                        }
                    }
                }
                item {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        KpiCard(
                            title = "Upcoming",
                            value = upcomingCount.toString(),
                            subtitle = "Holidays ahead",
                            modifier = Modifier.weight(1f),
                            bg = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        KpiCard(
                            title = "Optional",
                            value = optionalCount.toString(),
                            subtitle = "Optional days",
                            modifier = Modifier.weight(1f),
                            bg = MaterialTheme.colorScheme.tertiaryContainer,
                            contentColor = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                    }
                }
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Next Holiday", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = nextHoliday?.first?.name ?: "No upcoming holidays",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            nextHoliday?.second?.let { date ->
                                Text(
                                    text = date.format(DateTimeFormatter.ofPattern("MMM dd, yyyy")),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
                if (displayHolidays.isEmpty()) {
                     item {
                        Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text("No holidays found.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                } else {
                    when {
                        filteredHolidays.isEmpty() -> {
                            item {
                                Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                                    Text("No holidays match this filter.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                        viewMode == "grid" -> {
                            items(filteredHolidays) { holiday ->
                                HolidayCard(holiday)
                            }
                        }
                        viewMode == "list" -> {
                            items(filteredHolidays) { holiday ->
                                HolidayListItem(holiday)
                            }
                        }
                        else -> {
                            item {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(20.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        CDBLMockTag()
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            "Calendar view coming soon",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            textAlign = TextAlign.Center
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HolidayCard(holiday: Holiday) {
    val isOptional = holiday.isOptional
    
    // Parse date
    val dateObj = try {
        LocalDate.parse(holiday.date.take(10))
    } catch(e: Exception) { LocalDate.now() }
    val day = dateObj.dayOfMonth
    val month = dateObj.month.name.lowercase().replaceFirstChar { it.uppercase() }.take(3)
    val dayOfWeek = dateObj.dayOfWeek.name.lowercase().replaceFirstChar { it.uppercase() }

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
             // Date Box
             Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier
                    .size(50.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha=0.3f), RoundedCornerShape(10.dp))
            ) {
                Text(month, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                Text(day.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(holiday.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(2.dp))
                 Text(dayOfWeek, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            
            if (isOptional) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha=0.5f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        "Optional", 
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}

@Composable
fun HolidayListItem(holiday: Holiday) {
    val isOptional = holiday.isOptional
    val dateObj = try {
        LocalDate.parse(holiday.date.take(10))
    } catch(e: Exception) { LocalDate.now() }
    val displayDate = dateObj.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(holiday.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(displayDate, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (isOptional) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha=0.5f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        "Optional",
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}

private fun parseHolidayDate(date: String): LocalDate? {
    return try {
        LocalDate.parse(date.take(10))
    } catch (e: Exception) {
        null
    }
}
