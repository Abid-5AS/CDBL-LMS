//
//  AuditLogsView.swift
//  CDBLLeaveManager
//
//  Audit logs viewer for system admins.
//

import SwiftUI
import Combine

struct AuditLogsView: View {
    @StateObject private var viewModel = AuditLogsViewModel()
    @State private var selectedFilter: String = ""
    
    private let filterOptions = ["", "LOGIN", "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT"]
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                VStack(spacing: 0) {
                    // Header
                    header
                    
                    // Filter
                    filterSection
                    
                    // Content
                    if viewModel.isLoading && viewModel.logs.isEmpty {
                        LoadingView()
                    } else if let error = viewModel.error, viewModel.logs.isEmpty {
                        ErrorView(error) {
                            Task { await viewModel.loadLogs() }
                        }
                    } else if viewModel.logs.isEmpty {
                        EmptyStateView(
                            icon: "doc.text.magnifyingglass",
                            title: "No Logs",
                            message: "No audit logs found."
                        )
                    } else {
                        logsList
                    }
                }
            }
            .task {
                await viewModel.loadLogs()
            }
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Audit Logs")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
            
            Spacer()
            
            Button(action: {
                Task { await viewModel.loadLogs() }
            }) {
                Image(systemName: "arrow.clockwise")
                    .foregroundStyle(.white)
                    .padding(10)
                    .glassEffect(in: Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Filter Section
    
    private var filterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(filterOptions, id: \.self) { filter in
                    Button(action: {
                        selectedFilter = filter
                        viewModel.selectedAction = filter
                        Task { await viewModel.loadLogs() }
                    }) {
                        Text(filter.isEmpty ? "All" : filter.capitalized)
                            .font(.caption)
                            .fontWeight(selectedFilter == filter ? .semibold : .regular)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .glassEffect(
                                selectedFilter == filter ? .regular : .clear,
                                in: Capsule()
                            )
                            .overlay(
                                Capsule()
                                    .strokeBorder(
                                        selectedFilter == filter ?
                                        Color.cyan : Color.white.opacity(0.2),
                                        lineWidth: 1
                                    )
                            )
                    }
                    .foregroundStyle(selectedFilter == filter ? .cyan : .white.opacity(0.7))
                }
            }
            .padding(.horizontal)
        }
        .padding(.bottom, 16)
    }
    
    // MARK: - Logs List
    
    private var logsList: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(viewModel.logs) { log in
                    AuditLogCard(log: log)
                }
                
                if viewModel.hasMore {
                    ProgressView()
                        .tint(.white)
                        .padding()
                        .onAppear {
                            Task { await viewModel.loadMore() }
                        }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
}

// MARK: - Audit Log Card

struct AuditLogCard: View {
    let log: AuditLog
    
    var body: some View {
        HStack(spacing: 12) {
            // Action Icon
            Circle()
                .fill(actionColor.opacity(0.2))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: actionIcon)
                        .font(.caption)
                        .foregroundStyle(actionColor)
                )
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(log.action)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                
                Text(log.actorEmail)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
                
                if let details = log.details {
                    Text(details)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.5))
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Time
            VStack(alignment: .trailing, spacing: 2) {
                Text(formatDate(log.createdAt))
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.5))
                
                Text(formatTime(log.createdAt))
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.4))
            }
        }
        .padding()
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 12))
    }
    
    private var actionIcon: String {
        let action = log.action.uppercased()
        if action.contains("CREATE") || action.contains("ADD") {
            return "plus.circle.fill"
        } else if action.contains("UPDATE") || action.contains("EDIT") {
            return "pencil.circle.fill"
        } else if action.contains("DELETE") || action.contains("REMOVE") {
            return "trash.fill"
        } else if action.contains("LOGIN") {
            return "person.fill.checkmark"
        } else if action.contains("APPROVE") {
            return "checkmark.circle.fill"
        } else if action.contains("REJECT") {
            return "xmark.circle.fill"
        } else {
            return "doc.fill"
        }
    }
    
    private var actionColor: Color {
        let action = log.action.uppercased()
        if action.contains("CREATE") || action.contains("ADD") {
            return .green
        } else if action.contains("UPDATE") || action.contains("EDIT") {
            return .orange
        } else if action.contains("DELETE") || action.contains("REMOVE") {
            return .red
        } else if action.contains("LOGIN") {
            return .blue
        } else if action.contains("APPROVE") {
            return .green
        } else if action.contains("REJECT") {
            return .red
        } else {
            return .purple
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        if dateString.count >= 10 {
            let dateOnly = String(dateString.prefix(10))
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let date = formatter.date(from: dateOnly) {
                formatter.dateFormat = "MMM dd"
                return formatter.string(from: date)
            }
        }
        return dateString
    }
    
    private func formatTime(_ dateString: String) -> String {
        if dateString.count > 10 {
            let start = dateString.index(dateString.startIndex, offsetBy: 11)
            let end = dateString.index(start, offsetBy: 5, limitedBy: dateString.endIndex) ?? dateString.endIndex
            return String(dateString[start..<end])
        }
        return ""
    }
}

// MARK: - ViewModel

@MainActor
final class AuditLogsViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var logs: [AuditLog] = []
    @Published var selectedAction = ""
    @Published var currentPage = 1
    @Published var hasMore = true
    
    private let adminService = AdminService.shared
    private let pageSize = 30
    
    func loadLogs() async {
        isLoading = true
        error = nil
        currentPage = 1
        
        do {
            let response = try await adminService.getAuditLogs(
                page: currentPage,
                pageSize: pageSize,
                action: selectedAction.isEmpty ? nil : selectedAction
            )
            logs = response.items
            hasMore = response.items.count == pageSize
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    func loadMore() async {
        guard !isLoading && hasMore else { return }
        
        currentPage += 1
        
        do {
            let response = try await adminService.getAuditLogs(
                page: currentPage,
                pageSize: pageSize,
                action: selectedAction.isEmpty ? nil : selectedAction
            )
            logs.append(contentsOf: response.items)
            hasMore = response.items.count == pageSize
        } catch {
            currentPage -= 1
        }
    }
}

#Preview {
    AuditLogsView()
}
