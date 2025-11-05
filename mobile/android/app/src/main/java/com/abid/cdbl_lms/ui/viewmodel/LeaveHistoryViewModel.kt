package com.abid.cdbl_lms.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abid.cdbl_lms.data.repository.LeaveRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class LeaveHistoryViewModel(
    private val leaveRepository: LeaveRepository
) : ViewModel() {

    val allLeaves: StateFlow<List<com.abid.cdbl_lms.data.model.LeaveRequest>> = leaveRepository
        .getAllLeaves()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
}

class LeaveHistoryViewModelFactory(
    private val leaveRepository: LeaveRepository
) : androidx.lifecycle.ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(LeaveHistoryViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return LeaveHistoryViewModel(leaveRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

