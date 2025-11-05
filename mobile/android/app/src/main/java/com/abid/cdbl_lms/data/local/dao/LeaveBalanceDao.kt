package com.abid.cdbl_lms.data.local.dao

import androidx.room.*
import com.abid.cdbl_lms.data.local.entity.LeaveBalanceEntity
import com.abid.cdbl_lms.data.model.LeaveType
import kotlinx.coroutines.flow.Flow

@Dao
interface LeaveBalanceDao {
    @Query("SELECT * FROM leave_balances WHERE type = :type AND year = :year")
    fun getBalance(type: LeaveType, year: Int): Flow<LeaveBalanceEntity?>

    @Query("SELECT * FROM leave_balances WHERE year = :year")
    fun getAllBalancesForYear(year: Int): Flow<List<LeaveBalanceEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBalance(balance: LeaveBalanceEntity)

    @Update
    suspend fun updateBalance(balance: LeaveBalanceEntity)

    @Query("UPDATE leave_balances SET used = used + :days, closing = closing - :days WHERE type = :type AND year = :year")
    suspend fun incrementUsed(type: LeaveType, year: Int, days: Int)

    @Query("UPDATE leave_balances SET used = used - :days, closing = closing + :days WHERE type = :type AND year = :year")
    suspend fun decrementUsed(type: LeaveType, year: Int, days: Int)
}

