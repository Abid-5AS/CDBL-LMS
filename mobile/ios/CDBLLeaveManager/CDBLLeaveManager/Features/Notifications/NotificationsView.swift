//
//  NotificationsView.swift
//  CDBLLeaveManager
//
//  Notifications list view.
//

import SwiftUI
import Combine

struct NotificationsView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = NotificationsViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                if viewModel.isLoading && viewModel.notifications.isEmpty {
                    LoadingView()
                } else if let error = viewModel.error, viewModel.notifications.isEmpty {
                    ErrorView(error) {
                        Task { await viewModel.loadNotifications() }
                    }
                } else if viewModel.notifications.isEmpty {
                    EmptyStateView(
                        icon: "bell.slash",
                        title: "No Notifications",
                        message: "You're all caught up!"
                    )
                } else {
                    notificationsList
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.primary)
                }
                
                if viewModel.unreadCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Mark All Read") {
                            Task { await viewModel.markAllRead() }
                        }
                        .font(.caption)
                        .foregroundStyle(Color.accentColor)
                    }
                }
            }
            .task {
                await viewModel.loadNotifications()
            }
        }
    }
    
    private var notificationsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.notifications) { notification in
                    NotificationCard(notification: notification)
                        .onTapGesture {
                            Task { await viewModel.markAsRead(notification) }
                        }
                }
            }
            .padding()
        }
    }
}

// MARK: - Notification Card

struct NotificationCard: View {
    let notification: AppNotification
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Icon
            Circle()
                .fill(notification.iconColor.opacity(0.2))
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: notification.icon)
                        .foregroundStyle(notification.iconColor)
                )
            
            // Content
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(notification.title)
                        .font(.subheadline)
                        .fontWeight(notification.isRead ? .regular : .semibold)
                        .foregroundStyle(.primary)
                    
                    Spacer()
                    
                    if !notification.isRead {
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 8, height: 8)
                    }
                }
                
                Text(notification.message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                
                Text(notification.timeAgo)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .surfaceBackground(
            notification.isRead ? .clear : .regular,
            in: RoundedRectangle(cornerRadius: 16)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(
                    notification.isRead ? Color.white.opacity(0.1) : Color.clear,
                    lineWidth: 1
                )
        )
    }
}

// MARK: - ViewModel

@MainActor
final class NotificationsViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var notifications: [AppNotification] = []
    
    var unreadCount: Int {
        notifications.filter { !$0.isRead }.count
    }
    
    func loadNotifications() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await NotificationService.shared.getNotifications(limit: 50, unreadOnly: false)
            notifications = response.allNotifications
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    func markAsRead(_ notification: AppNotification) async {
        do {
            try await NotificationService.shared.markAsRead(id: notification.id)
            if let index = notifications.firstIndex(where: { $0.id == notification.id }) {
                notifications[index] = AppNotification(
                    id: notifications[index].id,
                    title: notifications[index].title,
                    message: notifications[index].message,
                    type: notifications[index].type,
                    read: true,
                    readAt: notifications[index].readAt,
                    createdAt: notifications[index].createdAt,
                    data: notifications[index].data,
                    leaveId: notifications[index].leaveId,
                    link: notifications[index].link
                )
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    func markAllRead() async {
        do {
            try await NotificationService.shared.markAllAsRead()
            notifications = notifications.map { item in
                AppNotification(
                    id: item.id,
                    title: item.title,
                    message: item.message,
                    type: item.type,
                    read: true,
                    readAt: item.readAt,
                    createdAt: item.createdAt,
                    data: item.data,
                    leaveId: item.leaveId,
                    link: item.link
                )
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#Preview {
    NotificationsView()
}
