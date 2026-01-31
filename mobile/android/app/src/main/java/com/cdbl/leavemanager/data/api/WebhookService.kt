package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.WebhookEntry
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface WebhookService {
    @GET("webhooks")
    suspend fun getWebhooks(@Header("Authorization") token: String): Response<List<WebhookEntry>>
}
