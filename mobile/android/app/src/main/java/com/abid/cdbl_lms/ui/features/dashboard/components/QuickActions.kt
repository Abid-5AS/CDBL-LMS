package com.abid.cdbl_lms.ui.features.dashboard.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.abid.cdbl_lms.data.model.LeaveStatus
import java.util.Date

@Composable
fun QuickActions(
    pendingLeaves: List<LeaveRequest>,
    approvedLeaves: List<LeaveRequest>,
    medicalLeavesOver7Days: List<LeaveRequest>,
    onApplyLeave: () -> Unit,
    onCancelPending: ((LeaveRequest) -> Unit)? = null,
    onRequestCancellation: ((LeaveRequest) -> Unit)? = null,
    onReturnToDuty: ((LeaveRequest) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val firstPending = pendingLeaves.firstOrNull()
    val firstApproved = approvedLeaves.firstOrNull()
    val firstMedicalOver7 = medicalLeavesOver7Days.firstOrNull()

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = onApplyLeave,
            modifier = Modifier.weight(1f)
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Apply Leave")
        }

        if (firstPending != null && onCancelPending != null) {
            OutlinedButton(
                onClick = { onCancelPending(firstPending) },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Close, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Cancel Pending")
            }
        }

        if (firstMedicalOver7 != null && onReturnToDuty != null) {
            OutlinedButton(
                onClick = { onReturnToDuty(firstMedicalOver7) },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Return to Duty")
            }
        }

        if (firstApproved != null && onRequestCancellation != null) {
            OutlinedButton(
                onClick = { onRequestCancellation(firstApproved) },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Delete, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Request Cancellation")
            }
        }
    }
}

fun getMedicalLeavesOver7Days(
    leaves: List<LeaveRequest>,
    today: Date = Date()
): List<LeaveRequest> {
    return leaves.filter { leave ->
        leave.type.name == "MEDICAL" &&
        leave.status == LeaveStatus.APPROVED &&
        leave.workingDays > 7 &&
        leave.endDate.before(today) &&
        leave.fitnessCertificateUrl.isNullOrEmpty()
    }
}

