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

import com.cdbl.leavemanager.data.model.BalanceResponse
import com.cdbl.leavemanager.data.repository.DashboardRepository
import com.cdbl.leavemanager.data.model.PolicySection
import com.cdbl.leavemanager.data.repository.PolicyRepository

data class ApplyLeaveUiState(
    val isLoading: Boolean = false,
    val result: Boolean = false, // Deprecated? 'success' is used
    val success: Boolean = false,
    val error: String? = null,
    val balance: BalanceResponse? = null,
    val leavePolicies: List<PolicySection> = emptyList()
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

    fun loadPolicies(token: String) {
        viewModelScope.launch {
            val result = policyRepository.fetchPolicies() // Token might not be needed if repository handles auth or assumes logged in context?
            
            result.onSuccess { policies ->
                _uiState.value = _uiState.value.copy(leavePolicies = policies.filter { policy ->
                    policy.availability.equals("all", ignoreCase = true) || 
                    (policy.availability.equals("female", ignoreCase = true)) // Simplified logic, real app might check user gender
                })
            }
        }
    }

    fun submitLeave(token: String, type: String, startDate: String, endDate: String, reason: String, attachmentUri: Uri? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val request = ApplyLeaveRequest(type, startDate, endDate, reason)
            
            // Prepare file if URI is present
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
