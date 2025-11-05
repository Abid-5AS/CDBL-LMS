package com.abid.cdbl_lms.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository
import com.abid.cdbl_lms.data.model.LeaveBalance
import com.abid.cdbl_lms.data.model.LeaveRequest
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.data.model.LeaveStatus
import com.abid.cdbl_lms.util.DateUtils
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Date

class DashboardViewModel(
    private val leaveRepository: LeaveRepository,
    private val balanceRepository: LeaveBalanceRepository
) : ViewModel() {

    val balances: StateFlow<List<LeaveBalance>> = balanceRepository
        .getAllBalancesForYear(DateUtils.getCurrentYear())
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val recentLeaves: StateFlow<List<LeaveRequest>> = leaveRepository
        .getAllLeaves()
        .map { it.take(3) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val upcomingLeaves: StateFlow<List<LeaveRequest>> = leaveRepository
        .getAllLeaves()
        .map { leaves ->
            val today = DateUtils.today()
            leaves.filter { 
                it.status == LeaveStatus.APPROVED && 
                it.startDate >= today 
            }
                .sortedBy { it.startDate }
                .take(5)
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val pendingLeaves: StateFlow<List<LeaveRequest>> = leaveRepository
        .getAllLeaves()
        .map { leaves ->
            leaves.filter { 
                it.status == LeaveStatus.SUBMITTED || 
                it.status == LeaveStatus.PENDING 
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val approvedLeaves: StateFlow<List<LeaveRequest>> = leaveRepository
        .getAllLeaves()
        .map { leaves ->
            leaves.filter { it.status == LeaveStatus.APPROVED }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val unsyncedCount: StateFlow<Int> = leaveRepository
        .getUnsyncedLeaves()
        .map { it.size }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = 0
        )

    fun getBalanceForType(type: LeaveType): LeaveBalance? {
        return balances.value.find { it.type == type }
    }

    fun getGreeting(): String {
        val calendar = java.util.Calendar.getInstance()
        val hour = calendar.get(java.util.Calendar.HOUR_OF_DAY)
        return when {
            hour < 12 -> "Good Morning"
            hour < 17 -> "Good Afternoon"
            else -> "Good Evening"
        }
    }
}

class DashboardViewModelFactory(
    private val leaveRepository: LeaveRepository,
    private val balanceRepository: LeaveBalanceRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(DashboardViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return DashboardViewModel(leaveRepository, balanceRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

