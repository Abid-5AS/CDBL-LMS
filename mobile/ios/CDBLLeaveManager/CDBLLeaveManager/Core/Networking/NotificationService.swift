//
//  NotificationService.swift
//  CDBLLeaveManager
//
//  API service for notifications.
//

import Foundation

actor NotificationService {
    static let shared = NotificationService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Get Notifications
    
    func getNotifications(page: Int = 1, pageSize: Int = 20) async throws -> NotificationListResponse {
        return try await apiClient.request(
            "notifications?page=\(page)&pageSize=\(pageSize)",
            method: .get
        )
    }
    
    func getUnreadCount() async throws -> Int {
        struct Response: Decodable {
            let count: Int
        }
        let response: Response = try await apiClient.request(
            "notifications/unread-count",
            method: .get
        )
        return response.count
    }
    
    // MARK: - Mark as Read
    
    func markAsRead(id: Int) async throws {
        let _: EmptyResponse = try await apiClient.request(
            "notifications/\(id)/read",
            method: .patch
        )
    }
    
    func markAllAsRead() async throws {
        let _: EmptyResponse = try await apiClient.request(
            "notifications/read-all",
            method: .patch
        )
    }
    
    // MARK: - Update Settings
    
    func updateSettings(emailEnabled: Bool, pushEnabled: Bool) async throws {
        struct Request: Encodable {
            let emailEnabled: Bool
            let pushEnabled: Bool
        }
        let _: EmptyResponse = try await apiClient.request(
            "notifications/settings",
            method: .put,
            body: Request(emailEnabled: emailEnabled, pushEnabled: pushEnabled)
        )
    }
}

// MARK: - Empty Response

struct EmptyResponse: Decodable {}
