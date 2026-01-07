package com.cdbl.leavemanager.data.api

import com.cdbl.leavemanager.data.model.CalendarIntegrationStatus
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface IntegrationService {
    @GET("integrations/calendar/status")
    suspend fun getCalendarStatus(
        @Header("Authorization") token: String
    ): Response<List<CalendarIntegrationStatus>>
}
