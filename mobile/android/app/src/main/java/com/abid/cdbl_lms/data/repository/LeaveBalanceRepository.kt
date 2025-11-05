package com.abid.cdbl_lms.data.repository

import com.abid.cdbl_lms.data.local.AppDatabase
import com.abid.cdbl_lms.data.local.entity.LeaveBalanceEntity
import com.abid.cdbl_lms.data.model.LeaveBalance
import com.abid.cdbl_lms.data.model.LeaveType
import com.abid.cdbl_lms.util.toEntity
import com.abid.cdbl_lms.util.toModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.Calendar

class LeaveBalanceRepository(
    private val database: AppDatabase
) {
    private val balanceDao = database.leaveBalanceDao()

    fun getBalance(type: LeaveType, year: Int = Calendar.getInstance().get(Calendar.YEAR)): Flow<LeaveBalance?> {
        return balanceDao.getBalance(type, year).map { it?.toModel() }
    }

    fun getAllBalancesForYear(year: Int = Calendar.getInstance().get(Calendar.YEAR)): Flow<List<LeaveBalance>> {
        return balanceDao.getAllBalancesForYear(year).map { entities ->
            entities.map { it.toModel() }
        }
    }

    suspend fun insertBalance(balance: LeaveBalance) {
        balanceDao.insertBalance(balance.toEntity())
    }

    suspend fun updateBalance(balance: LeaveBalance) {
        balanceDao.updateBalance(balance.toEntity())
    }

    suspend fun incrementUsed(type: LeaveType, days: Int, year: Int = Calendar.getInstance().get(Calendar.YEAR)) {
        balanceDao.incrementUsed(type, year, days)
    }

    suspend fun decrementUsed(type: LeaveType, days: Int, year: Int = Calendar.getInstance().get(Calendar.YEAR)) {
        balanceDao.decrementUsed(type, year, days)
    }
}

