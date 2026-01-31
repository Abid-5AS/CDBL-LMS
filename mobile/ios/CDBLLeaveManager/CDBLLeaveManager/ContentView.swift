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
    @State private var selectedTab: AppTab = .home
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ForEach(AppTab.allCases, id: \.self) { tab in
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
                .font(.title2.weight(.semibold))
                .tabItem {
                    Label(String(describing: tab).capitalized, systemImage: tab.icon)
                }
                .tag(tab)
            }
        }
    }
}

#Preview {
    ContentView()
}
