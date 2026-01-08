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
                FluidBackground()
                
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
                        .foregroundStyle(.white)
                }
                
                if viewModel.unreadCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Mark All Read") {
                            Task { await viewModel.markAllRead() }
                        }
                        .font(.caption)
                        .foregroundStyle(.cyan)
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
                        .foregroundStyle(.white)
                    
                    Spacer()
                    
                    if !notification.isRead {
                        Circle()
                            .fill(Color.cyan)
                            .frame(width: 8, height: 8)
                    }
                }
                
                Text(notification.message)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(2)
                
                Text(notification.timeAgo)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding()
        .glassEffect(
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
        
        // TODO: Implement notification API service
        // For now, use mock data
        await MainActor.run {
            isLoading = false
            // Mock notifications would go here
        }
    }
    
    func markAsRead(_ notification: AppNotification) async {
        // TODO: Implement mark as read API
    }
    
    func markAllRead() async {
        // TODO: Implement mark all as read API
    }
}

#Preview {
    NotificationsView()
}
