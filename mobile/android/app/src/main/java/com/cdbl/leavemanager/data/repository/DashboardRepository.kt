package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.DashboardService
import com.cdbl.leavemanager.data.model.BalanceResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepository @Inject constructor(
    private val dashboardService: DashboardService
) {
    suspend fun getMyBalance(token: String): Result<BalanceResponse> {
        return try {
            val response = dashboardService.getMyBalance("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch balance: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
