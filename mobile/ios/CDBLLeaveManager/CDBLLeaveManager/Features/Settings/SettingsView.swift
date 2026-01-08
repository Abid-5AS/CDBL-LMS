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
                FluidBackground()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Appearance
                        appearanceSection
                        
                        // Notifications
                        notificationsSection
                        
                        // Security
                        securitySection
                        
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
                    .foregroundStyle(.white)
                }
            }
        }
    }
    
    // MARK: - Appearance Section
    
    private var appearanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Appearance")
                .font(.headline)
                .foregroundStyle(.white)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "gear",
                    title: "Use System Theme",
                    isOn: $useSystemTheme
                )
                
                if !useSystemTheme {
                    Divider().background(Color.white.opacity(0.1))
                    SettingsToggleRow(
                        icon: "moon.fill",
                        title: "Dark Mode",
                        isOn: $isDarkMode
                    )
                }
            }
            .padding()
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Notifications Section
    
    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Notifications")
                .font(.headline)
                .foregroundStyle(.white)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "bell.fill",
                    title: "Push Notifications",
                    isOn: $notificationsEnabled
                )
                
                Divider().background(Color.white.opacity(0.1))
                
                SettingsRow(icon: "envelope.fill", title: "Email Notifications", showChevron: true)
            }
            .padding()
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - Security Section
    
    private var securitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Security")
                .font(.headline)
                .foregroundStyle(.white)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                SettingsToggleRow(
                    icon: "faceid",
                    title: "Biometric Login",
                    isOn: $biometricsEnabled
                )
                
                Divider().background(Color.white.opacity(0.1))
                
                // TODO: Link to ChangePasswordView
                SettingsRow(icon: "lock.fill", title: "Change Password", showChevron: true)
                
                Divider().background(Color.white.opacity(0.1))
                
                // TODO: Link to DelegationView
                SettingsRow(icon: "person.2.fill", title: "Delegation Settings", showChevron: true)
            }
            .padding()
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
        }
    }
    
    // MARK: - About Section
    
    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("About")
                .font(.headline)
                .foregroundStyle(.white)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                NavigationLink(destination: TermsView()) {
                    SettingsRow(icon: "doc.text.fill", title: "Terms of Service", showChevron: true)
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                NavigationLink(destination: PrivacyView()) {
                    SettingsRow(icon: "lock.shield.fill", title: "Privacy Policy", showChevron: true)
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                HStack {
                    Image(systemName: "info.circle.fill")
                    .foregroundStyle(.white.opacity(0.6))
                    .frame(width: 24)
                    
                    Text("Version")
                        .foregroundStyle(.white.opacity(0.9))
                    
                    Spacer()
                    
                    Text("1.0.0 (Build 1)")
                        .foregroundStyle(.white.opacity(0.5))
                }
                .padding(.vertical, 12)
            }
            .padding()
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20))
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
                .foregroundStyle(.white.opacity(0.6))
                .frame(width: 24)
            
            Text(title)
                .foregroundStyle(.white.opacity(0.9))
            
            Spacer()
            
            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.4))
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
                .foregroundStyle(.white.opacity(0.6))
                .frame(width: 24)
            
            Text(title)
                .foregroundStyle(.white.opacity(0.9))
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(.cyan)
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState.shared)
}
