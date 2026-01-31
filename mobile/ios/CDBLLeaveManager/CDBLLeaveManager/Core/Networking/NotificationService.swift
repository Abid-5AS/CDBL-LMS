//
//  NotificationService.swift
//  CDBLLeaveManager
//
//  API service for notifications.
//

import Foundation
import Combine

actor NotificationService {
    static let shared = NotificationService()
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Get Notifications
    
    func getNotifications(limit: Int = 20, unreadOnly: Bool = false) async throws -> NotificationListResponse {
        return try await apiClient.request(
            "notifications/latest?limit=\(limit)&unreadOnly=\(unreadOnly)",
            method: .get
        )
    }
    
    // MARK: - Mark as Read
    
    func markAsRead(id: Int) async throws {
        let _: EmptyResponse = try await apiClient.request(
            "notifications/\(id)/read",
            method: .post
        )
    }
    
    func markAllAsRead() async throws {
        let _: EmptyResponse = try await apiClient.request(
            "notifications/read-all",
            method: .post
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
