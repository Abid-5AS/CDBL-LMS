package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.NotificationsResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface NotificationService {
    @GET("notifications/latest")
    suspend fun getNotifications(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int = 20,
        @Query("unreadOnly") unreadOnly: Boolean = false
    ): Response<NotificationsResponse>

    @POST("notifications/{id}/read")
    suspend fun markRead(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<Map<String, Any>>
}
