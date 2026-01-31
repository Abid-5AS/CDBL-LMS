package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.AnalyticsService
import com.cdbl.leavemanager.data.model.AnalyticsTrendResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsRepository @Inject constructor(
    private val analyticsService: AnalyticsService
) {
    suspend fun getLeaveTrends(token: String, period: String = "12m"): Result<AnalyticsTrendResponse> {
        return try {
            val response = analyticsService.getLeaveTrends("Bearer $token", period)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch analytics: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
