//
//  SettingsView.swift
//  CDBLLeaveCompanion
//
//  Settings screen with device info, storage stats, and diagnostics
//

import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Device & Sync") {
                    SettingRow(label: "Device ID", value: "550e8400...")
                    SettingRow(label: "Pending actions", value: "2")
                    SettingRow(label: "Last receipt hash", value: "abc123...")
                }
                
                Section("Storage Stats") {
                    SettingRow(label: "Queue", value: "42 KB")
                    SettingRow(label: "Attachments", value: "1.2 MB")
                    SettingRow(label: "CoreData", value: "512 KB")
                    
                    Button("Clear Cache") {
                        // TODO: Clear cache
                    }
                    .foregroundColor(.red)
                }
                
                Section("Feature Flags") {
                    SettingRow(label: "OFFLINE_BUILD", value: "Enabled")
                    SettingRow(label: "ALLOW_SAFE_ONLINE", value: "Disabled")
                }
                
                Section("About") {
                    SettingRow(label: "App version", value: "1.0.0")
                    SettingRow(label: "Policy version", value: "v2.0")
                }
            }
            .navigationTitle("Settings")
        }
    }
}

// MARK: - Setting Row

struct SettingRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(StyleGuide.Colors.foreground)
            Spacer()
            Text(value)
                .foregroundColor(StyleGuide.Colors.foregroundSecondary)
                .font(.caption)
        }
    }
}

#if DEBUG
@available(iOS 17.0, *)
struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
    }
}
#endif

