package com.cdbl.leavemanager.ui.leaves.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cdbl.leavemanager.ui.theme.*
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.*

/**
 * Day status for visual indicators
 */
enum class DayStatus {
    AVAILABLE,          // Can apply for leave
    WEEKEND,            // Saturday/Sunday (may be blocked)
    HOLIDAY,            // Public holiday
    PENDING,            // Existing leave request pending
    APPROVED,           // Approved leave
    REJECTED,           // Rejected leave
    SELECTED,           // Currently selected for new request
    PAST,               // Past date, cannot select
    BLOCKED             // Cannot apply (policy restriction)
}

/**
 * Data class for each day in calendar
 */
data class CalendarDay(
    val date: LocalDate,
    val status: DayStatus,
    val label: String? = null  // E.g., holiday name
)

/**
 * Leave Calendar Component with visual indicators
 */
@Composable
fun LeaveCalendar(
    currentMonth: YearMonth,
    onMonthChange: (YearMonth) -> Unit,
    selectedStartDate: LocalDate?,
    selectedEndDate: LocalDate?,
    onDateSelected: (LocalDate) -> Unit,
    holidays: List<LocalDate> = emptyList(),
    existingLeaves: Map<LocalDate, DayStatus> = emptyMap(),
    weekendsBlocked: Boolean = false,
    modifier: Modifier = Modifier
) {
    val today = LocalDate.now()
    val daysInMonth = currentMonth.lengthOfMonth()
    val firstDayOfMonth = currentMonth.atDay(1)
    val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value // 1=Monday, 7=Sunday
    
    // Adjust for Sunday start (convert to 0=Sunday, 6=Saturday)
    val offset = if (firstDayOfWeek == 7) 0 else firstDayOfWeek
    
    // Generate calendar days
    val calendarDays = remember(currentMonth, holidays, existingLeaves, selectedStartDate, selectedEndDate) {
        buildList {
            // Add empty cells for days before the 1st
            repeat(offset) { add(null) }
            
            // Add actual days
            for (day in 1..daysInMonth) {
                val date = currentMonth.atDay(day)
                val status = when {
                    // Check if in selection range first
                    selectedStartDate != null && selectedEndDate != null &&
                        !date.isBefore(selectedStartDate) && !date.isAfter(selectedEndDate) -> DayStatus.SELECTED
                    selectedStartDate != null && selectedEndDate == null && date == selectedStartDate -> DayStatus.SELECTED
                    // Check existing leaves
                    existingLeaves.containsKey(date) -> existingLeaves[date]!!
                    // Check holidays
                    holidays.contains(date) -> DayStatus.HOLIDAY
                    // Check weekends
                    weekendsBlocked && (date.dayOfWeek == DayOfWeek.SATURDAY || date.dayOfWeek == DayOfWeek.SUNDAY) -> DayStatus.WEEKEND
                    // Check past dates
                    date.isBefore(today) -> DayStatus.PAST
                    // Available
                    else -> DayStatus.AVAILABLE
                }
                add(CalendarDay(date, status))
            }
        }
    }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Month Navigation
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { onMonthChange(currentMonth.minusMonths(1)) }) {
                    Icon(
                        Icons.AutoMirrored.Rounded.KeyboardArrowLeft,
                        contentDescription = "Previous month",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                Text(
                    text = "${currentMonth.month.getDisplayName(TextStyle.FULL, Locale.getDefault())} ${currentMonth.year}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                IconButton(onClick = { onMonthChange(currentMonth.plusMonths(1)) }) {
                    Icon(
                        Icons.AutoMirrored.Rounded.KeyboardArrowRight,
                        contentDescription = "Next month",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Day of Week Headers
            Row(modifier = Modifier.fillMaxWidth()) {
                listOf("S", "M", "T", "W", "T", "F", "S").forEach { day ->
                    Text(
                        text = day,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Calendar Grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(7),
                modifier = Modifier.heightIn(max = 280.dp),
                userScrollEnabled = false
            ) {
                items(calendarDays) { dayOrNull ->
                    if (dayOrNull == null) {
                        // Empty cell
                        Box(modifier = Modifier.aspectRatio(1f))
                    } else {
                        CalendarDayCell(
                            day = dayOrNull,
                            isToday = dayOrNull.date == today,
                            onDateSelected = {
                                if (dayOrNull.status == DayStatus.AVAILABLE ||
                                    dayOrNull.status == DayStatus.SELECTED ||
                                    dayOrNull.status == DayStatus.WEEKEND) {
                                    onDateSelected(dayOrNull.date)
                                }
                            }
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Legend
            CalendarLegend()
        }
    }
}

@Composable
private fun CalendarDayCell(
    day: CalendarDay,
    isToday: Boolean,
    onDateSelected: () -> Unit
) {
    val (bgColor, textColor, borderColor) = when (day.status) {
        DayStatus.SELECTED -> Triple(
            MaterialTheme.colorScheme.primary,
            Color.White,
            Color.Transparent
        )
        DayStatus.HOLIDAY -> Triple(
            ErrorRed.copy(alpha = 0.15f),
            ErrorRed,
            Color.Transparent
        )
        DayStatus.PENDING -> Triple(
            WarningAmber.copy(alpha = 0.15f),
            WarningAmber.copy(alpha = 0.8f),
            Color.Transparent
        )
        DayStatus.APPROVED -> Triple(
            SuccessGreen.copy(alpha = 0.15f),
            SuccessGreen,
            Color.Transparent
        )
        DayStatus.REJECTED -> Triple(
            Color.Gray.copy(alpha = 0.1f),
            Color.Gray,
            Color.Transparent
        )
        DayStatus.WEEKEND -> Triple(
            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
            Color.Transparent
        )
        DayStatus.PAST -> Triple(
            Color.Transparent,
            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
            Color.Transparent
        )
        DayStatus.BLOCKED -> Triple(
            Color.Gray.copy(alpha = 0.1f),
            Color.Gray.copy(alpha = 0.5f),
            Color.Transparent
        )
        DayStatus.AVAILABLE -> Triple(
            Color.Transparent,
            MaterialTheme.colorScheme.onSurface,
            if (isToday) MaterialTheme.colorScheme.primary else Color.Transparent
        )
    }
    
    val clickable = day.status == DayStatus.AVAILABLE || 
                   day.status == DayStatus.SELECTED || 
                   day.status == DayStatus.WEEKEND
    
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(CircleShape)
            .background(bgColor)
            .then(
                if (borderColor != Color.Transparent) 
                    Modifier.border(2.dp, borderColor, CircleShape) 
                else 
                    Modifier
            )
            .then(
                if (clickable) 
                    Modifier.clickable(onClick = onDateSelected) 
                else 
                    Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = day.date.dayOfMonth.toString(),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isToday || day.status == DayStatus.SELECTED) FontWeight.Bold else FontWeight.Normal,
            color = textColor
        )
    }
}

@Composable
private fun CalendarLegend() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        LegendItem(color = MaterialTheme.colorScheme.primary, label = "Selected")
        LegendItem(color = ErrorRed, label = "Holiday")
        LegendItem(color = WarningAmber, label = "Pending")
        LegendItem(color = SuccessGreen, label = "Approved")
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
