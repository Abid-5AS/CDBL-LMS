package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.EmployeeDashboardData
import com.cdbl.leavemanager.data.model.EmployeeListResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Path

interface EmployeeService {
    @GET("auth/users")
    suspend fun getEmployees(@Header("Authorization") token: String): Response<EmployeeListResponse>

    @GET("employees/{id}")
    suspend fun getEmployeeDetail(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<EmployeeDashboardData>
}
