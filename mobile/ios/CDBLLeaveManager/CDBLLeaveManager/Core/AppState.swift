//
//  AppState.swift
//  CDBLLeaveManager
//
//  Central state management for the application.
//

import SwiftUI
import Combine

@MainActor
final class AppState: ObservableObject {
    static let shared = AppState()
    
    // MARK: - Published State
    
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false
    @Published var currentUser: AuthUser?
    @Published var userRole: UserRole = .employee
    @Published var errorMessage: String?
    
    // MARK: - Theme
    
    @AppStorage("isDarkMode") var isDarkMode: Bool = true
    @AppStorage("useSystemTheme") var useSystemTheme: Bool = true
    
    // MARK: - Network Status
    
    @Published var isOnline: Bool = true
    
    // MARK: - Token
    
    private var tokenManager = TokenManager.shared
    
    private init() {
        checkAuthState()
    }
    
    // MARK: - Auth State Management
    
    func checkAuthState() {
        if tokenManager.hasValidToken() {
            isAuthenticated = true
            loadUserRole()
        } else {
            isAuthenticated = false
            currentUser = nil
            userRole = .employee
        }
    }
    
    private func loadUserRole() {
        let role = tokenManager.getUserRole()
        userRole = UserRole(rawValue: role) ?? .employee
    }
    
    // MARK: - Login
    
    func login(token: String, refreshToken: String?, user: AuthUser?) {
        tokenManager.saveToken(token)
        if let refreshToken = refreshToken {
            tokenManager.saveRefreshToken(refreshToken)
        }
        if let user = user {
            currentUser = user
            tokenManager.saveUserEmail(user.email)
        }
        loadUserRole()
        
        withAnimation(.easeInOut(duration: 0.3)) {
            isAuthenticated = true
        }
    }
    
    // MARK: - Logout
    
    func logout() {
        tokenManager.clearToken()
        currentUser = nil
        userRole = .employee
        
        withAnimation(.easeInOut(duration: 0.3)) {
            isAuthenticated = false
        }
    }
    
    // MARK: - Error Handling
    
    func showError(_ message: String) {
        errorMessage = message
        
        // Auto-dismiss after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            if self?.errorMessage == message {
                self?.errorMessage = nil
            }
        }
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Top Level Destinations
    
    var topLevelDestinations: [TopLevelDestination] {
        switch userRole {
        case .employee:
            return [.dashboard, .leaves, .holidays, .more]
        case .deptHead:
            return [.dashboard, .approvals, .team, .more]
        case .hrAdmin:
            return [.dashboard, .approvals, .team, .more]
        case .hrHead:
            return [.dashboard, .approvals, .team, .reports, .more]
        case .ceo:
            return [.dashboard, .approvals, .reports, .more]
        case .systemAdmin:
            return [.dashboard, .admin, .team, .more]
        }
    }
}

// MARK: - Top Level Destination

enum TopLevelDestination: String, CaseIterable, Identifiable {
    case dashboard
    case leaves
    case holidays
    case approvals
    case team
    case reports
    case admin
    case more
    
    var id: String { rawValue }
    
    var title: String {
        switch self {
        case .dashboard: return "Home"
        case .leaves: return "Leaves"
        case .holidays: return "Holidays"
        case .approvals: return "Approvals"
        case .team: return "Team"
        case .reports: return "Reports"
        case .admin: return "Admin"
        case .more: return "More"
        }
    }
    
    var icon: String {
        switch self {
        case .dashboard: return "square.grid.2x2.fill"
        case .leaves: return "doc.text.fill"
        case .holidays: return "calendar"
        case .approvals: return "checkmark.circle.fill"
        case .team: return "person.3.fill"
        case .reports: return "chart.bar.fill"
        case .admin: return "gearshape.2.fill"
        case .more: return "ellipsis.circle.fill"
        }
    }
    
    var unselectedIcon: String {
        switch self {
        case .dashboard: return "square.grid.2x2"
        case .leaves: return "doc.text"
        case .holidays: return "calendar"
        case .approvals: return "checkmark.circle"
        case .team: return "person.3"
        case .reports: return "chart.bar"
        case .admin: return "gearshape.2"
        case .more: return "ellipsis.circle"
        }
    }
}
