package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.PolicyResponse
import retrofit2.Response
import retrofit2.http.GET

interface PolicyService {
    @GET("policies")
    suspend fun getPolicies(): Response<PolicyResponse>
}
