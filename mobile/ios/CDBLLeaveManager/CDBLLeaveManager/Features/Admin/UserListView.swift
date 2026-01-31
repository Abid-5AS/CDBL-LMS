//
//  UserListView.swift
//  CDBLLeaveManager
//
//  Admin user management list.
//

import SwiftUI
import Combine

struct UserListView: View {
    @StateObject private var viewModel = UserListViewModel()
    @State private var searchText = ""
    @State private var path = NavigationPath()
    
    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    header
                    
                    // Search Bar
                    searchBar
                    
                    // Content
                    if viewModel.isLoading && viewModel.users.isEmpty {
                        LoadingView()
                    } else if let error = viewModel.error, viewModel.users.isEmpty {
                        ErrorView(error) {
                            Task { await viewModel.loadUsers() }
                        }
                    } else if viewModel.filteredUsers.isEmpty {
                        EmptyStateView(
                            icon: "person.3",
                            title: "No Users",
                            message: searchText.isEmpty ?
                                "No users found." :
                                "No results for '\(searchText)'"
                        )
                    } else {
                        usersList
                    }
                }
            }
            .task {
                await viewModel.loadUsers()
            }
            .navigationDestination(for: UserManagementRoute.self) { route in
                switch route {
                case .create:
                    UserManagementView()
                case .edit(let userId):
                    UserManagementView(userId: userId)
                }
            }
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("Users")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
            
            Spacer()
            
            Button(action: { path.append(UserManagementRoute.create) }) {
                Image(systemName: "plus")
                    .foregroundStyle(.primary)
                    .padding(10)
                    .surfaceBackground(in: Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
        .padding(.bottom, 16)
    }
    
    // MARK: - Search Bar
    
    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            
            TextField("Search users...", text: $searchText)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .foregroundStyle(.primary)
            
            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .padding(.bottom, 16)
        .onChange(of: searchText) { _, newValue in
            viewModel.searchQuery = newValue
        }
    }
    
    // MARK: - Users List
    
    private var usersList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredUsers) { user in
                    NavigationLink(value: UserManagementRoute.edit(user.id)) {
                        UserCard(
                            user: user,
                            onToggleStatus: {
                                Task { await viewModel.toggleStatus(user) }
                            }
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 100)
        }
    }
}

enum UserManagementRoute: Hashable {
    case create
    case edit(Int)
}

// MARK: - User Card

struct UserCard: View {
    let user: UserAdmin
    let onToggleStatus: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            // Avatar
            Circle()
                .fill(user.isActive ? Color.green.opacity(0.2) : Color.gray.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(initials)
                        .font(.headline)
                        .foregroundStyle(user.isActive ? .green : .gray)
                )
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(user.name ?? user.email)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Text(user.email)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                HStack(spacing: 8) {
                    Text(user.role.capitalized)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.accentColor.opacity(0.2))
                        .clipShape(Capsule())
                        .foregroundStyle(Color.accentColor)
                    
                    if let dept = user.department {
                        Text(dept)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            
            Spacer()
            
            // Status Toggle
            Button(action: onToggleStatus) {
                Circle()
                    .fill(user.isActive ? Color.green : Color.gray)
                    .frame(width: 12, height: 12)
            }
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
    }
    
    private var initials: String {
        let name = user.name ?? user.email
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return name.prefix(2).uppercased()
    }
}

// MARK: - ViewModel

@MainActor
final class UserListViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?
    @Published var users: [UserAdmin] = []
    @Published var searchQuery = ""
    
    private let adminService = AdminService.shared
    
    var filteredUsers: [UserAdmin] {
        if searchQuery.isEmpty {
            return users
        }
        return users.filter { user in
            (user.name?.localizedCaseInsensitiveContains(searchQuery) ?? false) ||
            user.email.localizedCaseInsensitiveContains(searchQuery) ||
            (user.department?.localizedCaseInsensitiveContains(searchQuery) ?? false)
        }
    }
    
    func loadUsers() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await adminService.getUsers()
            users = response.allUsers
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
    
    func toggleStatus(_ user: UserAdmin) async {
        do {
            _ = try await adminService.toggleUserStatus(id: user.id, isActive: !user.isActive)
            // Update local state
            if let index = users.firstIndex(where: { $0.id == user.id }) {
                users[index] = UserAdmin(
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    employeeId: user.employeeId,
                    department: user.department,
                    designation: user.designation,
                    role: user.role,
                    isActive: !user.isActive,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                )
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

#Preview {
    UserListView()
}
