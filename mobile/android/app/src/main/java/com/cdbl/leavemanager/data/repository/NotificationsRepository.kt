package com.cdbl.leavemanager.data.repository

import com.cdbl.leavemanager.data.api.NotificationService
import com.cdbl.leavemanager.data.model.NotificationsResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationsRepository @Inject constructor(
    private val notificationService: NotificationService
) {
    suspend fun getNotifications(token: String, unreadOnly: Boolean = false): Result<NotificationsResponse> {
        return try {
            val response = notificationService.getNotifications("Bearer $token", unreadOnly = unreadOnly)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch notifications: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markRead(token: String, id: Int): Result<Unit> {
        return try {
            val response = notificationService.markRead("Bearer $token", id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to mark notification: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAllRead(token: String): Result<Unit> {
        return try {
            val response = notificationService.markAllRead("Bearer $token")
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to mark all notifications: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
