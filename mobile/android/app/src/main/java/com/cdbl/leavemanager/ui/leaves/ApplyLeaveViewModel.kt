package com.cdbl.leavemanager.ui.leaves

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cdbl.leavemanager.data.model.ApplyLeaveRequest
import com.cdbl.leavemanager.data.repository.LeaveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import java.time.LocalDate

import com.cdbl.leavemanager.data.model.BalanceResponse
import com.cdbl.leavemanager.data.repository.DashboardRepository
import com.cdbl.leavemanager.data.model.PolicySection
import com.cdbl.leavemanager.data.repository.PolicyRepository
import com.cdbl.leavemanager.ui.leaves.components.DayStatus

// Existing leave info for calendar display
data class ExistingLeaveInfo(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val status: String,  // PENDING, APPROVED, REJECTED, CANCELLED
    val leaveType: String
)

data class ApplyLeaveUiState(
    val isLoading: Boolean = false,
    val result: Boolean = false,
    val success: Boolean = false,
    val error: String? = null,
    val balance: BalanceResponse? = null,
    val leavePolicies: List<PolicySection> = emptyList(),
    val holidays: List<LocalDate> = emptyList(),
    val existingLeaves: List<ExistingLeaveInfo> = emptyList()
)

@HiltViewModel
class ApplyLeaveViewModel @Inject constructor(
    private val leaveRepository: LeaveRepository,
    private val dashboardRepository: DashboardRepository,
    private val policyRepository: PolicyRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(ApplyLeaveUiState())
    val uiState: StateFlow<ApplyLeaveUiState> = _uiState.asStateFlow()

    fun loadBalance(token: String) {
        viewModelScope.launch {
            val result = dashboardRepository.getMyBalance(token)
            result.onSuccess {
               _uiState.value = _uiState.value.copy(balance = it)
            }
        }
    }

    fun loadHolidays(token: String) {
        viewModelScope.launch {
            val result = dashboardRepository.getHolidays(token)
            result.onSuccess { holidays ->
                val holidayDates = holidays?.mapNotNull { holiday ->
                    try {
                        LocalDate.parse(holiday.date.take(10))
                    } catch (e: Exception) {
                        null
                    }
                } ?: emptyList()
                _uiState.value = _uiState.value.copy(holidays = holidayDates)
            }
        }
    }

    fun loadExistingLeaves(token: String) {
        viewModelScope.launch {
            val result = leaveRepository.getRecentLeaves(token)
            result.onSuccess { leaves ->
                val existingLeaves = leaves.mapNotNull { leave ->
                    try {
                        val startDate = LocalDate.parse(leave.startDate.take(10))
                        val endDate = LocalDate.parse(leave.endDate.take(10))
                        ExistingLeaveInfo(
                            startDate = startDate,
                            endDate = endDate,
                            status = leave.status,
                            leaveType = leave.type
                        )
                    } catch (e: Exception) {
                        null
                    }
                }
                _uiState.value = _uiState.value.copy(existingLeaves = existingLeaves)
            }
        }
    }

    // Convert existing leaves to a map of date -> status for calendar display
    fun getExistingLeavesMap(): Map<LocalDate, DayStatus> {
        val map = mutableMapOf<LocalDate, DayStatus>()
        _uiState.value.existingLeaves.forEach { leave ->
            var date = leave.startDate
            while (!date.isAfter(leave.endDate)) {
                val status = when (leave.status.uppercase()) {
                    "PENDING" -> DayStatus.PENDING
                    "APPROVED" -> DayStatus.APPROVED
                    "REJECTED" -> DayStatus.REJECTED
                    else -> DayStatus.BLOCKED
                }
                map[date] = status
                date = date.plusDays(1)
            }
        }
        return map
    }

    fun loadPolicies(token: String) {
        viewModelScope.launch {
            val result = policyRepository.fetchPolicies()
            
            result.onSuccess { policies ->
                val filtered = policies.filter { policy ->
                    policy.availability.equals("all", ignoreCase = true) || 
                    policy.availability.equals("female", ignoreCase = true) ||
                    permissionsAllows(policy.availability)
                }
                
                if (filtered.isNotEmpty()) {
                    _uiState.value = _uiState.value.copy(leavePolicies = filtered)
                } else {
                    useDefaultPolicies()
                }
            }.onFailure {
                useDefaultPolicies()
            }
        }
    }

    private fun permissionsAllows(availability: String?): Boolean {
        return true
    }

    private fun useDefaultPolicies() {
        val defaults = listOf(
            PolicySection("Annual Leave", "AL", "all", "Annual leave entitlement", emptyList(), emptyList()),
            PolicySection("Sick Leave", "SL", "all", "Medical leave", emptyList(), emptyList()),
            PolicySection("Casual Leave", "CL", "all", "Casual leave", emptyList(), emptyList()),
            PolicySection("Leave Without Pay", "LWP", "all", "Unpaid leave", emptyList(), emptyList())
        )
        _uiState.value = _uiState.value.copy(leavePolicies = defaults)
    }

    fun submitLeave(token: String, type: String, startDate: String, endDate: String, reason: String, attachmentUri: Uri? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val request = ApplyLeaveRequest(type, startDate, endDate, reason)
            
            val file = attachmentUri?.let { uri ->
                getFileFromUri(uri)
            }

            val result = leaveRepository.applyLeave(token, request, file)
            
            result.onSuccess {
                _uiState.value = _uiState.value.copy(success = true, isLoading = false)
            }.onFailure {
                _uiState.value = _uiState.value.copy(error = it.message, isLoading = false)
            }
        }
    }
    
    private fun getFileFromUri(uri: Uri): File? {
        return try {
            val contentResolver = context.contentResolver
            val fileName = "temp_attachment_${System.currentTimeMillis()}"
            val tempFile = File(context.cacheDir, fileName)
            
            contentResolver.openInputStream(uri)?.use { inputStream ->
                FileOutputStream(tempFile).use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
            }
            tempFile
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    fun resetState() {
        _uiState.value = ApplyLeaveUiState()
    }
}

