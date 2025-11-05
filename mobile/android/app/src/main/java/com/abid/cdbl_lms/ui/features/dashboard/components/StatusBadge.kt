package com.abid.cdbl_lms.ui.features.dashboard.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.abid.cdbl_lms.data.model.LeaveStatus

@Composable
fun StatusBadge(
    status: LeaveStatus,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, textColor, text) = when (status) {
        LeaveStatus.DRAFT -> Triple(
            Color(0xFFF3F4F6), // Gray 100
            Color(0xFF6B7280), // Gray 500
            "Draft"
        )
        LeaveStatus.SUBMITTED -> Triple(
            Color(0xFFFEF3C7), // Amber 100
            Color(0xFF92400E), // Amber 800
            "Submitted"
        )
        LeaveStatus.PENDING -> Triple(
            Color(0xFFDBEAFE), // Blue 100
            Color(0xFF1E40AF), // Blue 800
            "Pending"
        )
        LeaveStatus.APPROVED -> Triple(
            Color(0xFFD1FAE5), // Green 100
            Color(0xFF065F46), // Green 800
            "Approved"
        )
        LeaveStatus.REJECTED -> Triple(
            Color(0xFFFEE2E2), // Red 100
            Color(0xFF991B1B), // Red 800
            "Rejected"
        )
        LeaveStatus.CANCELLED -> Triple(
            Color(0xFFF3F4F6), // Gray 100
            Color(0xFF374151), // Gray 700
            "Cancelled"
        )
        LeaveStatus.RETURNED -> Triple(
            Color(0xFFFEF3C7), // Amber 100
            Color(0xFF92400E), // Amber 800
            "Returned"
        )
        LeaveStatus.CANCELLATION_REQUESTED -> Triple(
            Color(0xFFFEF3C7), // Amber 100
            Color(0xFF92400E), // Amber 800
            "Cancellation Requested"
        )
        LeaveStatus.RECALLED -> Triple(
            Color(0xFFF3F4F6), // Gray 100
            Color(0xFF374151), // Gray 700
            "Recalled"
        )
        LeaveStatus.OVERSTAY_PENDING -> Triple(
            Color(0xFFFEE2E2), // Red 100
            Color(0xFF991B1B), // Red 800
            "Overstay Pending"
        )
    }

    Box(
        modifier = modifier
            .background(
                color = backgroundColor,
                shape = RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            fontWeight = FontWeight.SemiBold
        )
    }
}

