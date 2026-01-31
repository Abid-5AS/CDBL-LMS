package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.ReportsService
import com.cdbl.leavemanager.data.model.ScheduledReport
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReportsRepository @Inject constructor(
    private val reportsService: ReportsService
) {
    suspend fun getReports(token: String): Result<List<ScheduledReport>> {
        return try {
            val response = reportsService.getReports("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.reports)
            } else {
                Result.failure(Exception("Failed to fetch reports: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
