import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTab: TopLevelDestination = .dashboard
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ForEach(appState.topLevelDestinations) { destination in
                destinationView(for: destination)
                    .tag(destination)
                    .tabItem {
                        Label(destination.title, systemImage: destination.icon)
                    }
            }
        }
    }
    
    // MARK: - Destination View
    
    @ViewBuilder
    private func destinationView(for destination: TopLevelDestination) -> some View {
        switch destination {
        case .dashboard:
            dashboardForRole
        case .leaves:
            LeavesListView()
        case .holidays:
            HolidaysView()
        case .approvals:
            ApprovalsListView()
        case .team:
            TeamListView()
        case .reports:
            ReportsView()
        case .admin:
            AdminHomeView()
        case .more:
            MoreView()
        }
    }
    
    @ViewBuilder
    private var dashboardForRole: some View {
        switch appState.userRole {
        case .employee:
            EmployeeDashboardView()
        case .deptHead:
            ManagerDashboardView()
        case .hrAdmin:
            HRDashboardView()
        case .hrHead:
            HRHeadDashboardView()
        case .ceo:
            CEODashboardView()
        case .systemAdmin:
            AdminDashboardView()
        }
    }
    
}

// MARK: - Admin Home View (for system admin tab)

struct AdminHomeView: View {
    var body: some View {
        AdminDashboardView()
    }
}

#Preview {
    MainTabView()
        .environmentObject(AppState.shared)
}
