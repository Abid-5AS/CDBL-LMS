//
//  MoreView.swift
//  CDBLLeaveManager
//
//  More menu with navigation to additional features.
//

import SwiftUI

struct MoreView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false
    @State private var showProfile = false
    @State private var showNotifications = false
    @State private var showCalendar = false
    @State private var showEncashment = false
    @State private var showBalance = false
    @State private var showPolicy = false
    @State private var showHelp = false
    @State private var showFeedback = false
    @State private var showTerms = false
    @State private var showPrivacy = false
    @State private var showMyLeaves = false
    @State private var showApplyLeave = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    header
                    
                    // Profile Card
                    profileCard
                    
                    // Main Menu Items
                    mainMenuSection
                    
                    // Resources Section
                    resourcesSection
                    
                    // Logout
                    logoutButton
                    
                    // Version
                    versionInfo
                    
                    Spacer().frame(height: 100)
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showProfile) {
                NavigationStack {
                    ProfileView()
                        .navigationTitle("Profile")
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            ToolbarItem(placement: .topBarTrailing) {
                                Button("Done") { showProfile = false }
                            }
                        }
                }
            }
            .sheet(isPresented: $showNotifications) {
                NotificationsView()
            }
            .sheet(isPresented: $showCalendar) {
                CalendarView()
            }
            .sheet(isPresented: $showEncashment) {
                EncashmentListView()
            }
            .sheet(isPresented: $showBalance) {
                BalanceView()
            }
            .sheet(isPresented: $showPolicy) {
                PolicyView()
            }
            .sheet(isPresented: $showHelp) {
                HelpView()
            }
            .sheet(isPresented: $showFeedback) {
                FeedbackView()
            }
            .sheet(isPresented: $showTerms) {
                TermsView()
            }
            .sheet(isPresented: $showPrivacy) {
                PrivacyView()
            }
            .sheet(isPresented: $showMyLeaves) {
                LeavesListView()
            }
            .sheet(isPresented: $showApplyLeave) {
                ApplyLeaveView()
            }
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("More")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 60)
    }
    
    // MARK: - Profile Card
    
    private var profileCard: some View {
        Button(action: { showProfile = true }) {
            HStack(spacing: 16) {
                // Avatar
                Circle()
                    .fill(Color(.tertiarySystemBackground))
                    .frame(width: 60, height: 60)
                    .overlay(
                        Text(userInitials)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundStyle(.primary)
                    )
                    .surfaceBackground(in: Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("View Profile")
                        .font(.headline)
                        .foregroundStyle(.primary)
                    
                    Text(appState.userRole.displayName)
                        .font(.caption)
                        .foregroundStyle(Color.accentColor)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
        }
        .padding(.horizontal)
    }
    
    private var userInitials: String {
        if let email = TokenManager.shared.getUserEmail() {
            return email.prefix(2).uppercased()
        }
        return "U"
    }
    
    // MARK: - Main Menu Section
    
    private var mainMenuSection: some View {
        VStack(spacing: 0) {
            // Show My Leaves for non-employee roles (they don't have leaves tab)
            if appState.userRole != .employee {
                MoreMenuItem(
                    icon: "doc.text.fill",
                    title: "My Leaves",
                    color: .indigo,
                    action: { showMyLeaves = true }
                )
                
                Divider().padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "plus.circle.fill",
                    title: "Apply Leave",
                    color: .cyan,
                    action: { showApplyLeave = true }
                )
                
                Divider().padding(.leading, 56)
            }
            
            MoreMenuItem(
                icon: "bell.fill",
                title: "Notifications",
                color: .orange,
                action: { showNotifications = true }
            )
            
            Divider().padding(.leading, 56)
            
            MoreMenuItem(
                icon: "gearshape.fill",
                title: "Settings",
                color: .gray,
                action: { showSettings = true }
            )
            
            Divider().padding(.leading, 56)
            
            MoreMenuItem(
                icon: "calendar.badge.clock",
                title: "Team Calendar",
                color: .blue,
                action: { showCalendar = true }
            )
            
            Divider().padding(.leading, 56)
            
            MoreMenuItem(
                icon: "banknote.fill",
                title: "Leave Encashment",
                color: .green,
                action: { showEncashment = true }
            )
            
            Divider().padding(.leading, 56)
            
            MoreMenuItem(
                icon: "chart.pie.fill",
                title: "Leave Balance",
                color: .purple,
                action: { showBalance = true }
            )
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }
    
    // MARK: - Resources Section
    
    private var resourcesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Resources")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                MoreMenuItem(
                    icon: "doc.text.fill",
                    title: "Leave Policies",
                    color: .purple,
                    action: { showPolicy = true }
                )
                
                Divider().padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "questionmark.circle.fill",
                    title: "Help & FAQ",
                    color: .cyan,
                    action: { showHelp = true }
                )
                
                Divider().padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "envelope.fill",
                    title: "Send Feedback",
                    color: .pink,
                    action: { showFeedback = true }
                )
                
                Divider().padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "doc.fill",
                    title: "Terms of Service",
                    color: .gray,
                    action: { showTerms = true }
                )
                
                Divider().padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "lock.shield.fill",
                    title: "Privacy Policy",
                    color: .gray,
                    action: { showPrivacy = true }
                )
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
        }
        .padding(.horizontal)
    }
    
    // MARK: - Logout Button
    
    private var logoutButton: some View {
        Button(action: { appState.logout() }) {
            HStack {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                Text("Log Out")
            }
            .fontWeight(.semibold)
            .foregroundStyle(.red)
            .frame(maxWidth: .infinity)
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
        }
        .padding(.horizontal)
    }
    
    // MARK: - Version Info
    
    private var versionInfo: some View {
        VStack(spacing: 4) {
            Text("CDBL Connect")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Version 1.0.0")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 8)
    }
}

// MARK: - More Menu Item

struct MoreMenuItem: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(color)
                    .frame(width: 24)
                
                Text(title)
                    .font(.body)
                    .foregroundStyle(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 12)
        }
    }
}

#Preview {
    ZStack {
        Color(.systemBackground).ignoresSafeArea()
        MoreView()
            .environmentObject(AppState.shared)
    }
}
