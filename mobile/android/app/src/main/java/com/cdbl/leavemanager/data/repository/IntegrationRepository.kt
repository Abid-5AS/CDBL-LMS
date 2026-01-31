package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.IntegrationService
import com.cdbl.leavemanager.data.model.CalendarIntegrationStatus
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class IntegrationRepository @Inject constructor(
    private val integrationService: IntegrationService
) {
    suspend fun getCalendarStatus(token: String): Result<List<CalendarIntegrationStatus>> {
        return try {
            val response = integrationService.getCalendarStatus("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch calendar status: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
