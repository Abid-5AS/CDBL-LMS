import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedTab: TopLevelDestination = .dashboard
    @Namespace private var animation
    
    var body: some View {
        ZStack {
            FluidBackground()
            
            // Tab Content
            TabView(selection: $selectedTab) {
                ForEach(appState.topLevelDestinations) { destination in
                    destinationView(for: destination)
                        .tag(destination)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .ignoresSafeArea()
            
            // Custom Glass Tab Bar
            VStack {
                Spacer()
                customTabBar
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
    
    // MARK: - Custom Tab Bar
    
    private var customTabBar: some View {
        HStack(spacing: 8) {
            ForEach(appState.topLevelDestinations) { destination in
                TabButton(
                    destination: destination,
                    isSelected: selectedTab == destination,
                    namespace: animation
                ) {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                        selectedTab = destination
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 30))
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }
}

// MARK: - Tab Button

struct TabButton: View {
    let destination: TopLevelDestination
    let isSelected: Bool
    let namespace: Namespace.ID
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack {
                // Morphing pill background
                if isSelected {
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.blue.opacity(0.6),
                                    Color.purple.opacity(0.6)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .matchedGeometryEffect(id: "TAB_PILL", in: namespace)
                        .shadow(color: .blue.opacity(0.4), radius: 8, x: 0, y: 4)
                }
                
                // Icon + Label
                VStack(spacing: 4) {
                    Image(systemName: isSelected ? destination.icon : destination.unselectedIcon)
                        .font(.system(size: 20))
                        .symbolEffect(.bounce, value: isSelected)
                    
                    Text(destination.title)
                        .font(.caption2)
                        .fontWeight(isSelected ? .semibold : .regular)
                }
                .foregroundStyle(isSelected ? .white : .white.opacity(0.6))
                .frame(maxWidth: .infinity)
                .frame(height: 52)
            }
        }
        .buttonStyle(.plain)
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

