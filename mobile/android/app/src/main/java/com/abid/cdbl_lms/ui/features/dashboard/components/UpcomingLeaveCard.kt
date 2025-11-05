package com.abid.cdbl_lms.ui.features.dashboard.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.abid.cdbl_lms.util.DateUtils
import java.util.Date
import java.util.Calendar

@Composable
fun UpcomingLeaveCard(
    leave: LeaveRequest,
    onClick: () -> Unit = {}
) {
    val today = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.time

    val startDate = Calendar.getInstance().apply {
        time = leave.startDate
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.time

    val daysUntil = ((startDate.time - today.time) / (1000 * 60 * 60 * 24)).toInt()

    val badgeText = when {
        daysUntil < 0 -> "Past"
        daysUntil < 3 -> "Starts in ${daysUntil}d"
        daysUntil <= 7 -> "Starts in ${daysUntil}d"
        else -> "Starts in ${daysUntil}d"
    }

    val badgeVariant = when {
        daysUntil < 0 -> "outline"
        daysUntil < 3 -> "destructive"
        daysUntil <= 7 -> "secondary"
        else -> "default"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${leave.type.name} Leave",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    StatusBadge(status = leave.status)
                    Surface(
                        color = when (badgeVariant) {
                            "destructive" -> MaterialTheme.colorScheme.errorContainer
                            "secondary" -> MaterialTheme.colorScheme.secondaryContainer
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            text = badgeText,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = when (badgeVariant) {
                                "destructive" -> MaterialTheme.colorScheme.onErrorContainer
                                "secondary" -> MaterialTheme.colorScheme.onSecondaryContainer
                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                            }
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${DateUtils.formatDate(leave.startDate)} → ${DateUtils.formatDate(leave.endDate)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${leave.workingDays} day${if (leave.workingDays > 1) "s" else ""}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

