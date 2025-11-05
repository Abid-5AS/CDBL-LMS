package com.abid.cdbl_lms

import android.app.Application as AndroidApplication
import com.abid.cdbl_lms.data.local.AppDatabase
import com.abid.cdbl_lms.data.repository.LeaveBalanceRepository
import com.abid.cdbl_lms.data.repository.LeaveRepository

class Application : AndroidApplication() {
    val database by lazy { AppDatabase.getDatabase(this) }
    val leaveRepository by lazy { LeaveRepository(database) }
    val balanceRepository by lazy { LeaveBalanceRepository(database) }
}

