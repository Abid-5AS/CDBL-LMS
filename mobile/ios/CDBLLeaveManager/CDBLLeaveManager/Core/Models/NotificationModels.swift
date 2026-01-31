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
    let read: Bool
    let readAt: String?
    let createdAt: String
    let data: NotificationData?
    let leaveId: Int?
    let link: String?
    
    var isRead: Bool {
        read
    }
    
    var icon: String {
        switch type.uppercased() {
        case "LEAVE_SUBMITTED":
            return "paperplane.fill"
        case "LEAVE_APPROVED":
            return "checkmark.circle.fill"
        case "LEAVE_REJECTED":
            return "xmark.circle.fill"
        case "LEAVE_RETURNED":
            return "arrow.uturn.backward.circle.fill"
        case "LEAVE_FORWARDED":
            return "arrowshape.turn.up.right.fill"
        case "LEAVE_CANCELLED":
            return "minus.circle.fill"
        case "LEAVE_CANCELLATION_REQUESTED":
            return "exclamationmark.triangle.fill"
        case "LEAVE_APPROACHING":
            return "calendar.badge.clock"
        case "LEAVE_TYPE_CHANGED":
            return "arrow.triangle.2.circlepath"
        case "APPROVAL_REQUIRED":
            return "exclamationmark.circle.fill"
        case "ENCASHMENT_APPROVED":
            return "checkmark.seal.fill"
        case "ENCASHMENT_REJECTED":
            return "xmark.seal.fill"
        case "SYSTEM_ANNOUNCEMENT":
            return "megaphone.fill"
        case "LEAVE_REQUEST":
            return "doc.text.fill"
        default:
            return "bell.fill"
        }
    }
    
    var iconColor: Color {
        switch type.uppercased() {
        case "LEAVE_SUBMITTED":
            return .blue
        case "LEAVE_APPROVED":
            return .green
        case "LEAVE_REJECTED":
            return .red
        case "LEAVE_RETURNED":
            return .orange
        case "LEAVE_FORWARDED":
            return .indigo
        case "LEAVE_CANCELLED":
            return .gray
        case "LEAVE_CANCELLATION_REQUESTED":
            return .orange
        case "LEAVE_APPROACHING":
            return .teal
        case "LEAVE_TYPE_CHANGED":
            return .purple
        case "APPROVAL_REQUIRED":
            return .purple
        case "ENCASHMENT_APPROVED":
            return .green
        case "ENCASHMENT_REJECTED":
            return .red
        case "SYSTEM_ANNOUNCEMENT":
            return .yellow
        case "LEAVE_REQUEST":
            return .blue
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
