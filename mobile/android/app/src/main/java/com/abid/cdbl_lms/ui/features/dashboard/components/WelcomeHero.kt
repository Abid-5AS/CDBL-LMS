package com.abid.cdbl_lms.ui.features.dashboard.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.abid.cdbl_lms.util.DateUtils

@Composable
fun WelcomeHero(
    username: String,
    greeting: String,
    pendingLeaves: List<LeaveRequest>,
    approvedUpcomingLeaves: List<LeaveRequest>,
    onClick: (() -> Unit)? = null
) {
    val hasPending = pendingLeaves.isNotEmpty()
    val hasApprovedUpcoming = approvedUpcomingLeaves.isNotEmpty()
    val firstPending = pendingLeaves.firstOrNull()
    val firstApproved = approvedUpcomingLeaves.firstOrNull()

    val message = when {
        firstApproved != null -> {
            val startDate = DateUtils.formatDate(firstApproved.startDate)
            "Your ${firstApproved.type.name.lowercase()} leave starts on $startDate."
        }
        hasPending -> "You have ${pendingLeaves.size} request(s) awaiting approval."
        else -> "All clear, $username. No pending requests."
    }

    val icon = when {
        hasPending -> Icons.Default.Warning
        hasApprovedUpcoming -> Icons.Default.CheckCircle
        else -> Icons.Default.Info
    }

    val iconColor = when {
        hasPending -> MaterialTheme.colorScheme.error
        hasApprovedUpcoming -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (hasPending && onClick != null) {
                    Modifier.clickable { onClick() }
                } else {
                    Modifier
                }
            ),
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
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(40.dp)
                )
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "As-salamu alaykum, $username!",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (firstPending != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${firstPending.type.name.lowercase().replaceFirstChar { it.uppercase() }} Leave: ${DateUtils.formatDate(firstPending.startDate)} → ${DateUtils.formatDate(firstPending.endDate)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

