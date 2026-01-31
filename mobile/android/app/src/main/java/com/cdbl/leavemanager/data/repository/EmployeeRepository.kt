package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.EmployeeService
import com.cdbl.leavemanager.data.model.EmployeeDashboardData
import com.cdbl.leavemanager.data.model.EmployeeSummary
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EmployeeRepository @Inject constructor(
    private val employeeService: EmployeeService
) {
    suspend fun getEmployees(token: String): Result<List<EmployeeSummary>> {
        return try {
            val response = employeeService.getEmployees("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.users)
            } else {
                Result.failure(Exception("Failed to fetch employees: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEmployeeDetail(token: String, id: Int): Result<EmployeeDashboardData> {
        return try {
            val response = employeeService.getEmployeeDetail("Bearer $token", id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch employee detail: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
