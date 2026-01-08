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
    @State private var showPolicy = false
    @State private var showHelp = false
    @State private var showFeedback = false
    @State private var showTerms = false
    @State private var showPrivacy = false
    
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
        }
    }
    
    // MARK: - Header
    
    private var header: some View {
        HStack {
            Text("More")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
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
                    .fill(
                        LinearGradient(
                            colors: [.cyan.opacity(0.5), .purple.opacity(0.5)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 60, height: 60)
                    .overlay(
                        Text(userInitials)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                    )
                    .glassEffect(in: Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("View Profile")
                        .font(.headline)
                        .foregroundStyle(.white)
                    
                    Text(appState.userRole.displayName)
                        .font(.caption)
                        .foregroundStyle(.cyan)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundStyle(.white.opacity(0.4))
            }
            .padding()
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 20))
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
            MoreMenuItem(
                icon: "bell.fill",
                title: "Notifications",
                color: .orange,
                action: { showNotifications = true }
            )
            
            Divider().background(Color.white.opacity(0.1)).padding(.leading, 56)
            
            MoreMenuItem(
                icon: "gearshape.fill",
                title: "Settings",
                color: .gray,
                action: { showSettings = true }
            )
            
            Divider().background(Color.white.opacity(0.1)).padding(.leading, 56)
            
            MoreMenuItem(
                icon: "calendar.badge.clock",
                title: "Team Calendar",
                color: .blue,
                action: { showCalendar = true }
            )
            
            Divider().background(Color.white.opacity(0.1)).padding(.leading, 56)
            
            MoreMenuItem(
                icon: "banknote.fill",
                title: "Leave Encashment",
                color: .green,
                action: { showEncashment = true }
            )
        }
        .padding()
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal)
    }
    
    // MARK: - Resources Section
    
    private var resourcesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Resources")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.white.opacity(0.6))
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                MoreMenuItem(
                    icon: "doc.text.fill",
                    title: "Leave Policies",
                    color: .purple,
                    action: { showPolicy = true }
                )
                
                Divider().background(Color.white.opacity(0.1)).padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "questionmark.circle.fill",
                    title: "Help & FAQ",
                    color: .cyan,
                    action: { showHelp = true }
                )
                
                Divider().background(Color.white.opacity(0.1)).padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "envelope.fill",
                    title: "Send Feedback",
                    color: .pink,
                    action: { showFeedback = true }
                )
                
                Divider().background(Color.white.opacity(0.1)).padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "doc.fill",
                    title: "Terms of Service",
                    color: .gray,
                    action: { showTerms = true }
                )
                
                Divider().background(Color.white.opacity(0.1)).padding(.leading, 56)
                
                MoreMenuItem(
                    icon: "lock.shield.fill",
                    title: "Privacy Policy",
                    color: .gray,
                    action: { showPrivacy = true }
                )
            }
            .padding()
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 20))
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
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 16))
        }
        .padding(.horizontal)
    }
    
    // MARK: - Version Info
    
    private var versionInfo: some View {
        VStack(spacing: 4) {
            Text("CDBL Connect")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
            Text("Version 1.0.0")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.3))
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
                    .foregroundStyle(.white)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.4))
            }
            .padding(.vertical, 12)
        }
    }
}

#Preview {
    ZStack {
        FluidBackground()
        MoreView()
            .environmentObject(AppState.shared)
    }
}
