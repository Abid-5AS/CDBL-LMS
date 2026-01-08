import SwiftUI

enum AppTab: CaseIterable {
    case home, explore, settings

    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .explore: return "magnifyingglass"
        case .settings: return "gearshape.fill"
        }
    }
}

struct ContentView: View {
    @State private var isExpanded: Bool = false
    @Namespace private var namespace
    @State private var selectedTab: AppTab = .home
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [Color(red: 0.2, green: 0.1, blue: 0.5),
                         Color(red: 0.1, green: 0.7, blue: 0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Main content
            VStack {
                Spacer()

                Group {
                    switch selectedTab {
                    case .home:
                        Text("Home")
                    case .explore:
                        Text("Explore")
                    case .settings:
                        Text("Settings")
                    }
                }
                .font(.largeTitle.bold())
                .foregroundStyle(.white)

                Spacer()
            }

            // Floating Bottom Tab Bar
            VStack {
                Spacer()

                HStack(spacing: 0) {
                    ForEach(AppTab.allCases, id: \.self) { tab in
                        Button {
                            withAnimation(
                                .spring(response: 0.45, dampingFraction: 0.8)
                            ) {
                                selectedTab = tab
                            }
                        } label: {
                            ZStack {
                                if selectedTab == tab {
                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                colors: [.blue, .purple],
                                                startPoint: .top,
                                                endPoint: .bottom
                                            )
                                        )
                                        .matchedGeometryEffect(
                                            id: "TAB_PILL",
                                            in: namespace
                                        )
                                }

                                VStack(spacing: 4) {
                                    Image(systemName: tab.icon)
                                        .font(.system(size: 18, weight: .semibold))
                                    Text(String(describing: tab).capitalized)
                                        .font(.caption2)
                                }
                                .foregroundStyle(
                                    selectedTab == tab ? .white : .secondary
                                )
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(6)
                .background(
                    .ultraThinMaterial,
                    in: Capsule()
                )
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }
        }
    }
}

#Preview {
    ContentView()
}
