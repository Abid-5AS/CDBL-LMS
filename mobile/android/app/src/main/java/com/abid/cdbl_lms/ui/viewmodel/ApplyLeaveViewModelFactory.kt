package com.abid.cdbl_lms.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository

class ApplyLeaveViewModelFactory(
    private val leaveRepository: LeaveRepository,
    private val balanceRepository: LeaveBalanceRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ApplyLeaveViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ApplyLeaveViewModel(leaveRepository, balanceRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

