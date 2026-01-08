//
//  CDBLLeaveManagerApp.swift
//  CDBLLeaveManager
//
//  Created by Md.Abid Shahriar on 24/12/25.
//

import SwiftUI

@main
struct CDBLLeaveManagerApp: App {
    @StateObject private var appState = AppState.shared
    
    var body: some Scene {
        WindowGroup {
            Group {
                if appState.isAuthenticated {
                    MainTabView()
                        .environmentObject(appState)
                        .transition(.opacity)
                } else {
                    LoginView(isAuthenticated: $appState.isAuthenticated)
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: appState.isAuthenticated)
            .preferredColorScheme(.dark) // Liquid Glass looks best in dark mode
        }
    }
}
