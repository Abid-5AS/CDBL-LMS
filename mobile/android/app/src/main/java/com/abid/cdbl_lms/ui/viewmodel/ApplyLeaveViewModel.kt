package com.abid.cdbl_lms.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abid.cdbl_lms.data.model.LeaveBalance
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.abid.cdbl_lms.data.model.LeaveStatus
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository
import com.abid.cdbl_lms.domain.policy.LeavePolicyValidator
import com.abid.cdbl_lms.util.DateUtils
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*

class ApplyLeaveViewModel(
    private val leaveRepository: LeaveRepository,
    private val balanceRepository: LeaveBalanceRepository
) : ViewModel() {

    // Form state
    val selectedType = MutableStateFlow<LeaveType?>(null)
    val startDate = MutableStateFlow<Date?>(null)
    val endDate = MutableStateFlow<Date?>(null)
    val reason = MutableStateFlow("")
    val certificateUri = MutableStateFlow<String?>(null)

    // Validation state
    val errors = MutableStateFlow<Map<String, String>>(emptyMap())
    val isSubmitting = MutableStateFlow(false)

    // Balance state
    val balances: StateFlow<List<LeaveBalance>> = balanceRepository
        .getAllBalancesForYear(DateUtils.getCurrentYear())
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Computed properties
    val workingDays: StateFlow<Int> = combine(startDate, endDate) { start, end ->
        if (start != null && end != null) {
            LeavePolicyValidator.calculateCalendarDays(start, end)
        } else {
            0
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 0
    )

    val requiresCertificate: StateFlow<Boolean> = combine(
        selectedType,
        workingDays
    ) { type, days ->
        type == LeaveType.MEDICAL && days > LeavePolicyValidator.ML_CERTIFICATE_THRESHOLD
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = false
    )

    val currentBalance: StateFlow<Int?> = combine(selectedType, balances) { type, balances ->
        if (type == null) return@combine null
        val balance = balances.find { it.type == type }
        balance?.available
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    val policyWarnings = MutableStateFlow<List<String>>(emptyList())

    fun validateForm(): Boolean {
        val newErrors = mutableMapOf<String, String>()
        val warnings = mutableListOf<String>()

        // Validate leave type
        if (selectedType.value == null) {
            newErrors["type"] = "Please select a leave type"
        }

        // Validate dates
        if (startDate.value == null) {
            newErrors["startDate"] = "Please select start date"
        }
        if (endDate.value == null) {
            newErrors["endDate"] = "Please select end date"
        }

        // Validate date range
        val start = startDate.value
        val end = endDate.value
        if (start != null && end != null) {
            if (end.before(start)) {
                newErrors["endDate"] = "End date must be after start date"
            }

            val type = selectedType.value
            if (type != null) {
                // Validate weekend/holiday rules
                if (!LeavePolicyValidator.isValidStartOrEndDate(start)) {
                    newErrors["startDate"] = "Start date cannot be on Friday or Saturday"
                }
                if (!LeavePolicyValidator.isValidStartOrEndDate(end)) {
                    newErrors["endDate"] = "End date cannot be on Friday or Saturday"
                }

                // Type-specific validations
                when (type) {
                    LeaveType.EARNED -> {
                        val noticeResult = LeavePolicyValidator.validateELNotice(start)
                        if (noticeResult is com.abid.cdbl_lms.domain.policy.ValidationResult.Error) {
                            warnings.add(noticeResult.message)
                        }
                    }
                    LeaveType.CASUAL -> {
                        val days = workingDays.value
                        if (days > LeavePolicyValidator.CL_MAX_CONSECUTIVE) {
                            warnings.add("Casual Leave cannot exceed ${LeavePolicyValidator.CL_MAX_CONSECUTIVE} consecutive days")
                        }
                        val sideTouchResult = LeavePolicyValidator.validateCLSideTouch(start, end)
                        if (sideTouchResult is com.abid.cdbl_lms.domain.policy.ValidationResult.Error) {
                            newErrors["dates"] = sideTouchResult.message
                        }
                    }
                    LeaveType.MEDICAL -> {
                        // No specific date rules
                    }
                    LeaveType.EXTRAWITHPAY,
                    LeaveType.EXTRAWITHOUTPAY,
                    LeaveType.MATERNITY,
                    LeaveType.PATERNITY,
                    LeaveType.STUDY,
                    LeaveType.SPECIAL_DISABILITY,
                    LeaveType.QUARANTINE -> {
                        // Special leave types - no specific validation rules for now
                        // These may have policy-specific rules that can be added later
                    }
                }

                // Validate balance
                val balance = currentBalance.value
                if (balance != null) {
                    val balanceResult = LeavePolicyValidator.validateBalance(
                        balance,
                        workingDays.value,
                        type
                    )
                    if (balanceResult is com.abid.cdbl_lms.domain.policy.ValidationResult.Error) {
                        newErrors["balance"] = balanceResult.message
                    }
                }
            }
        }

        // Validate reason
        val trimmedReason = reason.value.trim()
        if (trimmedReason.isEmpty()) {
            newErrors["reason"] = "Please provide a reason for leave"
        } else if (trimmedReason.length < 10) {
            newErrors["reason"] = "Reason must be at least 10 characters"
        }

        // Validate certificate
        if (requiresCertificate.value && certificateUri.value == null) {
            newErrors["certificate"] = "Medical certificate is required for Medical Leave over 3 days"
        }

        errors.value = newErrors
        policyWarnings.value = warnings
        return newErrors.isEmpty()
    }

    fun submitLeaveRequest(onSuccess: () -> Unit, onError: (String) -> Unit) {
        if (!validateForm()) {
            onError("Please fix the form errors")
            return
        }

        viewModelScope.launch {
            isSubmitting.value = true
            try {
                val type = selectedType.value ?: return@launch
                val start = startDate.value ?: return@launch
                val end = endDate.value ?: return@launch
                val trimmedReason = reason.value.trim()

                val balance = balances.value.find { it.type == type }

                val request = LeaveRequest(
                    type = type,
                    startDate = DateUtils.normalizeToDhakaMidnight(start),
                    endDate = DateUtils.normalizeToDhakaMidnight(end),
                    workingDays = workingDays.value,
                    reason = trimmedReason,
                    status = LeaveStatus.SUBMITTED,
                    needsCertificate = requiresCertificate.value,
                    certificateUrl = certificateUri.value,
                    balanceAtRequest = balance
                )

                leaveRepository.insertLeave(request)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Failed to submit leave request")
            } finally {
                isSubmitting.value = false
            }
        }
    }

    fun saveDraft(onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val type = selectedType.value ?: return@launch
                val start = startDate.value ?: return@launch
                val end = endDate.value ?: return@launch

                val balance = balances.value.find { it.type == type }

                val request = LeaveRequest(
                    type = type,
                    startDate = DateUtils.normalizeToDhakaMidnight(start),
                    endDate = DateUtils.normalizeToDhakaMidnight(end),
                    workingDays = workingDays.value,
                    reason = reason.value.trim(),
                    status = LeaveStatus.DRAFT,
                    needsCertificate = requiresCertificate.value,
                    certificateUrl = certificateUri.value,
                    balanceAtRequest = balance
                )

                leaveRepository.insertLeave(request)
                onSuccess()
            } catch (e: Exception) {
                // Silent fail for draft
            }
        }
    }
}
