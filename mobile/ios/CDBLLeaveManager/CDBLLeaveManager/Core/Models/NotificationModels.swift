//
//  NotificationModels.swift
//  CDBLLeaveManager
//
//  Notification related models.
//

import Foundation
import SwiftUI

// MARK: - Notification

struct AppNotification: Decodable, Identifiable {
    let id: Int
    let title: String
    let message: String
    let type: String
    let isRead: Bool
    let createdAt: String
    let data: NotificationData?
    
    var icon: String {
        switch type.uppercased() {
        case "LEAVE_APPROVED":
            return "checkmark.circle.fill"
        case "LEAVE_REJECTED":
            return "xmark.circle.fill"
        case "LEAVE_RETURNED":
            return "arrow.uturn.backward.circle.fill"
        case "LEAVE_REQUEST":
            return "doc.text.fill"
        case "APPROVAL_REQUIRED":
            return "exclamationmark.circle.fill"
        case "REMINDER":
            return "bell.fill"
        default:
            return "bell.fill"
        }
    }
    
    var iconColor: Color {
        switch type.uppercased() {
        case "LEAVE_APPROVED":
            return .green
        case "LEAVE_REJECTED":
            return .red
        case "LEAVE_RETURNED":
            return .orange
        case "LEAVE_REQUEST":
            return .blue
        case "APPROVAL_REQUIRED":
            return .purple
        case "REMINDER":
            return .yellow
        default:
            return .gray
        }
    }
    
    var timeAgo: String {
        // Parse and format relative time
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let date = formatter.date(from: createdAt) else {
            return createdAt
        }
        
        let now = Date()
        let components = Calendar.current.dateComponents([.minute, .hour, .day], from: date, to: now)
        
        if let days = components.day, days > 0 {
            return days == 1 ? "1 day ago" : "\(days) days ago"
        } else if let hours = components.hour, hours > 0 {
            return hours == 1 ? "1 hour ago" : "\(hours) hours ago"
        } else if let minutes = components.minute, minutes > 0 {
            return minutes == 1 ? "1 minute ago" : "\(minutes) minutes ago"
        } else {
            return "Just now"
        }
    }
}

struct NotificationData: Decodable {
    let leaveId: Int?
    let approvalId: Int?
    let employeeId: Int?
}

// MARK: - Notification List Response

struct NotificationListResponse: Decodable {
    let notifications: [AppNotification]?
    let items: [AppNotification]?
    let unreadCount: Int?
    
    var allNotifications: [AppNotification] {
        notifications ?? items ?? []
    }
}

// MARK: - Mark Read Request

struct MarkNotificationReadRequest: Encodable {
    let notificationIds: [Int]
}
