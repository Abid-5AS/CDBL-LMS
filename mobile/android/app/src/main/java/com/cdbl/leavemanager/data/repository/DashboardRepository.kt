package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.DashboardService
// import com.cdbl.leavemanager.data.api.AdminService // TODO: AdminService not implemented yet
import com.cdbl.leavemanager.data.model.BalanceResponse
import com.cdbl.leavemanager.data.model.BalanceDetailResponse
import com.cdbl.leavemanager.data.model.TeamOnLeaveResponse
import com.cdbl.leavemanager.data.local.CacheManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepository @Inject constructor(
    private val dashboardService: DashboardService,
    private val cacheManager: CacheManager
) {
    suspend fun getMyBalance(token: String): Result<BalanceResponse> {
        return try {
            val response = dashboardService.getMyBalance("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                cacheManager.save(CacheManager.KEY_DASHBOARD_BALANCE, data)
                Result.success(data)
            } else {
                // Try cache on API failure
                val cached = cacheManager.get(CacheManager.KEY_DASHBOARD_BALANCE, BalanceResponse::class.java)
                if (cached != null) Result.success(cached)
                else Result.failure(Exception("Failed to fetch balance: ${response.code()}"))
            }
        } catch (e: Exception) {
            // Try cache on Network exception
             val cached = cacheManager.get(CacheManager.KEY_DASHBOARD_BALANCE, BalanceResponse::class.java)
             if (cached != null) Result.success(cached)
             else Result.failure(e)
        }
    }

    suspend fun getMyBalanceDetailed(token: String): Result<BalanceDetailResponse> {
        return try {
            val response = dashboardService.getMyBalanceDetailed("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                cacheManager.save(CacheManager.KEY_BALANCE_DETAILED, data)
                Result.success(data)
            } else {
                val cached = cacheManager.get(CacheManager.KEY_BALANCE_DETAILED, BalanceDetailResponse::class.java)
                if (cached != null) Result.success(cached)
                else Result.failure(Exception("Failed to fetch balance details: ${response.code()}"))
            }
        } catch (e: Exception) {
            val cached = cacheManager.get(CacheManager.KEY_BALANCE_DETAILED, BalanceDetailResponse::class.java)
            if (cached != null) Result.success(cached)
            else Result.failure(e)
        }
    }

    suspend fun getTeamOnLeave(token: String): Result<TeamOnLeaveResponse> {
        return try {
            val response = dashboardService.getTeamOnLeave("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!
                cacheManager.save(CacheManager.KEY_DASHBOARD_TEAM, data)
                Result.success(data)
            } else {
                 val cached = cacheManager.get(CacheManager.KEY_DASHBOARD_TEAM, TeamOnLeaveResponse::class.java)
                 if (cached != null) Result.success(cached)
                 else Result.failure(Exception("Failed to fetch team data: ${response.code()}"))
            }
        } catch (e: Exception) {
             val cached = cacheManager.get(CacheManager.KEY_DASHBOARD_TEAM, TeamOnLeaveResponse::class.java)
             if (cached != null) Result.success(cached)
             else Result.failure(e)
        }
    }

    suspend fun getSystemStats(token: String): Result<com.cdbl.leavemanager.data.model.SystemStatsResponse> {
        return try {
            val response = dashboardService.getSystemStats("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch system stats: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHolidays(token: String): Result<List<com.cdbl.leavemanager.data.model.Holiday>> {
        return try {
            val response = dashboardService.getHolidays("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.holidays)
            } else {
                Result.failure(Exception("Failed to fetch holidays: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHRStats(token: String): Result<com.cdbl.leavemanager.data.model.HRAdminStats> {
        return try {
            val response = dashboardService.getHRStats("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch HR stats: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAuditLogs(token: String): Result<List<com.cdbl.leavemanager.data.model.AuditLog>> {
        return try {
            val response = dashboardService.getAuditLogs("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.items)
            } else {
                Result.failure(Exception("Failed to fetch audit logs: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    suspend fun getCEOStats(token: String): Result<com.cdbl.leavemanager.data.model.CEOStats> {
        return try {
            val response = dashboardService.getCEOStats("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch CEO stats: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHRHeadStats(token: String): Result<com.cdbl.leavemanager.data.model.HRHeadStats> {
        return try {
            val response = dashboardService.getHRHeadStats("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch HR Head stats: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUsers(token: String): Result<List<com.cdbl.leavemanager.data.model.AdminUser>> {
        return try {
            val response = dashboardService.getUsers("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                // Prefer 'users' list, fall back to empty
                Result.success(response.body()?.users ?: emptyList())
            } else {
                Result.failure(Exception("Failed to fetch users"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createUser(token: String, request: com.cdbl.leavemanager.data.model.CreateUserRequest): Result<String> {
        return try {
            val response = dashboardService.createUser("Bearer $token", request)
            if (response.isSuccessful && response.body()?.ok == true) {
                Result.success("User created successfully")
            } else {
                val errorMsg = response.body()?.error ?: "Failed to create user"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateUser(token: String, userId: String, request: com.cdbl.leavemanager.data.model.UpdateUserRequest): Result<String> {
        return try {
            val response = dashboardService.updateUser("Bearer $token", userId, request)
            if (response.isSuccessful && response.body()?.item != null) {
                Result.success("User updated successfully")
            } else {
                 val errorMsg = response.body()?.error ?: "Failed to update user"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
