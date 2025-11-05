package com.abid.cdbl_lms.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.util.DateUtils
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class LeaveBalanceViewModel(
    private val balanceRepository: LeaveBalanceRepository
) : ViewModel() {

    val balances: StateFlow<List<com.abid.cdbl_lms.data.model.LeaveBalance>> = balanceRepository
        .getAllBalancesForYear(DateUtils.getCurrentYear())
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
}

class LeaveBalanceViewModelFactory(
    private val balanceRepository: LeaveBalanceRepository
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(LeaveBalanceViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return LeaveBalanceViewModel(balanceRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

