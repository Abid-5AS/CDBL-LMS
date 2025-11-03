//
//  RootView.swift
//  CDBLLeaveCompanion
//
//  Root navigation view with iOS 26 Liquid Glass styling
//  Uses NavigationSplitView for iPad/Mac, TabView for iPhone
//

import SwiftUI
import CoreData

struct RootView: View {
    @State private var selectedTab = 0
    @StateObject private var networkMonitor = NetworkMonitor()
    
    var body: some View {
        Group {
            #if os(iOS)
            if UIDevice.current.userInterfaceIdiom == .pad {
                // iPad: Use NavigationSplitView with Liquid Glass
                NavigationSplitView {
                    SidebarView(selectedTab: $selectedTab)
                        .navigationSplitViewColumnWidth(min: 200, ideal: 250)
                } detail: {
                    NavigationStack {
                        if #available(iOS 26.0, *) {
                            DetailContentView(selectedTab: selectedTab)
                                .backgroundExtensionEffect() // iOS 26 Liquid Glass: extend content under sidebar
                        } else {
                            DetailContentView(selectedTab: selectedTab)
                        }
                    }
                }
            } else {
                // iPhone: Use TabView with iOS 26 navigation patterns
                TabView(selection: $selectedTab) {
                    DashboardView()
                        .tabItem {
                            Label("Dashboard", systemImage: "chart.bar.fill")
                        }
                        .tag(0)
                    
                    LeaveFormView()
                        .tabItem {
                            Label("Apply", systemImage: "plus.circle.fill")
                        }
                        .tag(1)
                    
                    HistoryView()
                        .tabItem {
                            Label("History", systemImage: "clock.fill")
                        }
                        .tag(2)
                    
                    PairSyncHub()
                        .tabItem {
                            Label("Pair/Sync", systemImage: "qrcode.viewfinder")
                        }
                        .tag(3)
                    
                    SettingsView()
                        .tabItem {
                            Label("Settings", systemImage: "gear")
                        }
                        .tag(4)
                }
                .overlay(alignment: .top) {
                    if !networkMonitor.isConnected {
                        OfflineIndicator()
                            .padding(.top, 8)
                    }
                }
            }
            #else
            // macOS (kept minimal to avoid iOS availability checks on macOS)
            NavigationSplitView {
                SidebarView(selectedTab: $selectedTab)
                    .navigationSplitViewColumnWidth(min: 200, ideal: 250)
            } detail: {
                NavigationStack {
                    DetailContentView(selectedTab: selectedTab)
                }
            }
            #endif
        }
        .modifier(ParallaxBackgroundIfAvailable()) // Phase 4: Parallax floating background animation
    }
}

// MARK: - Helpers

private struct ParallaxBackgroundIfAvailable: ViewModifier {
    func body(content: Content) -> some View {
        #if os(iOS)
        if #available(iOS 26.0, *) {
            // If your project defines `.parallaxBackground()`, this will apply it on iOS 26+
            return AnyView(content.parallaxBackground())
        } else {
            return AnyView(content)
        }
        #else
        return AnyView(content)
        #endif
    }
}

// MARK: - Sidebar View

struct SidebarView: View {
    @Binding var selectedTab: Int
    
    var body: some View {
        List {
            NavigationLink(value: 0) {
                Label("Dashboard", systemImage: "chart.bar.fill")
            }
            
            NavigationLink(value: 1) {
                Label("Apply Leave", systemImage: "plus.circle.fill")
            }
            
            NavigationLink(value: 2) {
                Label("History", systemImage: "clock.fill")
            }
            
            NavigationLink(value: 3) {
                Label("Pair/Sync", systemImage: "qrcode.viewfinder")
            }
            
            NavigationLink(value: 4) {
                Label("Settings", systemImage: "gear")
            }
        }
        .navigationTitle("CDBL Leave")
        .background(
            Group {
                #if os(iOS)
                if #available(iOS 26.0, *) {
                    Color.clear.backgroundExtensionEffect()
                } else {
                    Color.clear
                }
                #else
                Color.clear
                #endif
            }
        ) // iOS 26 Liquid Glass: extend background under sidebar
    }
}

// MARK: - Detail Content View

struct DetailContentView: View {
    let selectedTab: Int
    
    var body: some View {
        Group {
            switch selectedTab {
            case 0:
                DashboardView()
            case 1:
                LeaveFormView()
            case 2:
                HistoryView()
            case 3:
                PairSyncHub()
            case 4:
                SettingsView()
            default:
                DashboardView()
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
            .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
    }
}
#endif

