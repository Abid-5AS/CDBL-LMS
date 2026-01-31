package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.LeaveService
import com.cdbl.leavemanager.data.model.LeaveRequest
import javax.inject.Inject
import javax.inject.Singleton
import java.time.YearMonth
import java.time.format.DateTimeFormatter

@Singleton
class CalendarRepository @Inject constructor(
    private val leaveService: LeaveService
) {
    suspend fun getTeamCalendarEvents(token: String, month: YearMonth): Result<List<LeaveRequest>> {
        return try {
            val startDate = month.atDay(1).format(DateTimeFormatter.ISO_DATE)
            val endDate = month.atEndOfMonth().format(DateTimeFormatter.ISO_DATE)

            // mine="0" implies fetching leaves for the team/company (depending on backend permissions)
            val response = leaveService.getLeaves(
                token = "Bearer $token",
                mine = "0",
                limit = 100, // Fetch enough for the month
                startDate = startDate,
                endDate = endDate
            )

            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
