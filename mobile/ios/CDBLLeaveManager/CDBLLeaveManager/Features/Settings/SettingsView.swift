//
//  SettingsView.swift
//  CDBLLeaveManager
//
//  Settings screen with theme and notification preferences.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    
    @AppStorage("isDarkMode") private var isDarkMode = true
    @AppStorage("useSystemTheme") private var useSystemTheme = true
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    @AppStorage("biometricsEnabled") private var biometricsEnabled = true
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Appearance
                        appearanceSection
                        
                        // Notifications
                        notificationsSection
                        
                        // Security
                        securitySection

                        // Integrations
                        integrationsSection
                        
                        // About
                        aboutSection
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundStyle(.primary)
                }
            }
        }
    }
    
    // MARK: - Appearance Section
    
    private var appearanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Appearance")
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "gear",
                    title: "Use System Theme",
                    isOn: $useSystemTheme
                )
                
                if !useSystemTheme {
                    Divider()
                    SettingsToggleRow(
                        icon: "moon.fill",
                        title: "Dark Mode",
                        isOn: $isDarkMode
                    )
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Notifications Section
    
    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Notifications")
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "bell.fill",
                    title: "Push Notifications",
                    isOn: $notificationsEnabled
                )
                
                Divider()
                
                SettingsRow(icon: "envelope.fill", title: "Email Notifications", showChevron: true)
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Security Section
    
    private var securitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Security")
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "faceid",
                    title: "Biometric Login",
                    isOn: $biometricsEnabled
                )
                
                Divider()
                
                NavigationLink(destination: ChangePasswordView()) {
                    SettingsRow(icon: "lock.fill", title: "Change Password", showChevron: true)
                }
                
                Divider()
                
                NavigationLink(destination: DelegationView()) {
                    SettingsRow(icon: "person.2.fill", title: "Delegation Settings", showChevron: true)
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }

    // MARK: - Integrations Section

    private var integrationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Integrations")
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal)

            VStack(spacing: 0) {
                NavigationLink(destination: CalendarIntegrationView()) {
                    SettingsRow(icon: "calendar.badge.clock", title: "Calendar Integration", showChevron: true)
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - About Section
    
    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("About")
                .font(.headline)
                .foregroundStyle(.primary)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                NavigationLink(destination: TermsView()) {
                    SettingsRow(icon: "doc.text.fill", title: "Terms of Service", showChevron: true)
                }
                
                Divider()
                
                NavigationLink(destination: PrivacyView()) {
                    SettingsRow(icon: "lock.shield.fill", title: "Privacy Policy", showChevron: true)
                }
                
                Divider()
                
                HStack {
                    Image(systemName: "info.circle.fill")
                    .foregroundStyle(.secondary)
                    .frame(width: 24)
                    
                    Text("Version")
                        .foregroundStyle(.secondary)
                    
                    Spacer()
                    
                    Text("1.0.0 (Build 1)")
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 12)
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
}

// MARK: - Settings Row Components

struct SettingsRow: View {
    let icon: String
    let title: String
    var showChevron: Bool = false
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 24)
            
            Text(title)
                .foregroundStyle(.secondary)
            
            Spacer()
            
            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

struct SettingsToggleRow: View {
    let icon: String
    let title: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 24)
            
            Text(title)
                .foregroundStyle(.secondary)
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(.accentColor)
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState.shared)
}
