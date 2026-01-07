package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.DelegationsResponse
import retrofit2.Response
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

interface DelegationService {
    @GET("approvals/delegate")
    suspend fun getDelegations(
        @Header("Authorization") token: String,
        @Query("type") type: String = "mine",
        @Query("includeInactive") includeInactive: Boolean = false
    ): Response<DelegationsResponse>

    @DELETE("approvals/delegate")
    suspend fun revokeDelegation(
        @Header("Authorization") token: String,
        @Query("id") id: Int
    ): Response<Map<String, Any>>
}
