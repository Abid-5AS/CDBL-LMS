package com.abid.cdbl_lms.ui.features.dashboard.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.abid.cdbl_lms.data.model.LeaveBalance
import com.abid.cdbl_lms.data.model.LeaveType

@Composable
fun LeaveBalanceCard(
    leaveType: LeaveType,
    balance: LeaveBalance?,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val typeName = when (leaveType) {
        LeaveType.CASUAL -> "Casual Leave"
        LeaveType.MEDICAL -> "Medical Leave"
        LeaveType.EARNED -> "Earned Leave"
        else -> leaveType.name
    }

    val (icon, iconColor, cardColor) = when (leaveType) {
        LeaveType.EARNED -> Triple(
            Icons.Default.Star,
            Color(0xFFFF6B35), // Amber/Orange
            Color(0xFFFFF4E6) // Light amber background
        )
        LeaveType.CASUAL -> Triple(
            Icons.Default.ThumbUp,
            Color(0xFF2196F3), // Blue
            Color(0xFFE3F2FD) // Light blue background
        )
        LeaveType.MEDICAL -> Triple(
            Icons.Default.Favorite,
            Color(0xFF4CAF50), // Green
            Color(0xFFE8F5E9) // Light green background
        )
        else -> Triple(
            Icons.Default.ThumbUp,
            MaterialTheme.colorScheme.primary,
            MaterialTheme.colorScheme.surface
        )
    }

    val total = balance?.let { it.opening + it.accrued } ?: when (leaveType) {
        LeaveType.EARNED -> 24
        LeaveType.CASUAL -> 10
        LeaveType.MEDICAL -> 14
        else -> 0
    }
    val used = balance?.used ?: 0
    val available = balance?.available ?: total
    val progress = if (total > 0) used.toFloat() / total.toFloat() else 0f
    val percentage = if (total > 0) ((available.toFloat() / total.toFloat()) * 100).toInt() else 0

    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 1000),
        label = "progress"
    )

    Card(
        modifier = modifier
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = cardColor
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Icon and Title Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(iconColor.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = iconColor,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Column {
                        Text(
                            text = typeName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "$available/$total days",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Amount and Progress Ring
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "$available",
                        style = MaterialTheme.typography.displaySmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "$percentage% remaining",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Donut chart (simplified as CircularProgressIndicator)
                Box(
                    modifier = Modifier.size(64.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        progress = { 1f - animatedProgress },
                        modifier = Modifier.fillMaxSize(),
                        strokeWidth = 6.dp,
                        color = iconColor,
                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                    Text(
                        text = "$percentage%",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

