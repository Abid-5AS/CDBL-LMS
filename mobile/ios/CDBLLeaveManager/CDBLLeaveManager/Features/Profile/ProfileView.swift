import SwiftUI
import Combine

struct ProfileView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showingEditProfile = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    profileHeader
                    
                    // Info Card
                    infoCard
                    
                    // Settings
                    settingsSection
                    
                    // Logout
                    logoutButton
                    
                    Spacer().frame(height: 100)
                }
            }
            .refreshable {
                await viewModel.loadProfile()
            }
            .task {
                await viewModel.loadProfile()
            }
            .sheet(isPresented: $showingEditProfile) {
                EditProfileView()
                    .onDisappear {
                        Task { await viewModel.loadProfile() }
                    }
            }
        }
    }
    
    // MARK: - Profile Header
    
    private var profileHeader: some View {
        VStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.cyan.opacity(0.5), .purple.opacity(0.5)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 100, height: 100)
                
                Text(viewModel.initials)
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(.white)
            }
            .glassEffect(in: Circle())
            .overlay(
                Circle()
                    .strokeBorder(
                        LinearGradient(
                            colors: [.white.opacity(0.5), .clear],
                            startPoint: .top,
                            endPoint: .bottom
                        ),
                        lineWidth: 2
                    )
            )
            
            // Name & Role
            VStack(spacing: 4) {
                Text(viewModel.name)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                
                Text(viewModel.designation)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))
                
                HStack(spacing: 12) {
                    // Role Badge
                    Text(appState.userRole.displayName)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.cyan.opacity(0.2))
                        .clipShape(Capsule())
                        .foregroundStyle(.cyan)
                    
                    // Edit Button
                    Button(action: { showingEditProfile = true }) {
                        Label("Edit", systemImage: "pencil")
                            .font(.caption)
                            .fontWeight(.medium)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Capsule())
                            .foregroundStyle(.white)
                    }
                }
            }
        }
        .padding(.top, 60)
    }
    
    // MARK: - Info Card
    
    private var infoCard: some View {
        VStack(spacing: 0) {
            ProfileRow(icon: "envelope.fill", title: "Email", value: viewModel.email)
            Divider().background(Color.white.opacity(0.1))
            ProfileRow(icon: "phone.fill", title: "Phone", value: viewModel.phone)
            Divider().background(Color.white.opacity(0.1))
            ProfileRow(icon: "building.2.fill", title: "Department", value: viewModel.department)
            Divider().background(Color.white.opacity(0.1))
            ProfileRow(icon: "person.badge.key.fill", title: "Employee ID", value: viewModel.employeeId)
        }
        .padding()
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal)
    }
    
    // MARK: - Settings Section
    
    private var settingsSection: some View {
        VStack(alignment: .leading) {
            Text("Settings")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.8))
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                // Notifications -> Settings for now
                NavigationLink(destination: SettingsView()) {
                    ProfileRow(icon: "bell.fill", title: "Notifications", value: "On", showChevron: true)
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                NavigationLink(destination: SettingsView()) {
                    ProfileRow(icon: "faceid", title: "Security", value: "FaceID", showChevron: true)
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                // Placeholder for Delegation
                ProfileRow(icon: "person.crop.circle.badge.checkmark", title: "Delegation", value: "", showChevron: true)
                
                Divider().background(Color.white.opacity(0.1))
                
                // Change Password -> Placeholder or Settings
                NavigationLink(destination: SettingsView()) {
                    ProfileRow(icon: "lock.fill", title: "Change Password", value: "", showChevron: true)
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                NavigationLink(destination: HelpView()) {
                    ProfileRow(icon: "questionmark.circle.fill", title: "Help & Support", value: "", showChevron: true)
                }
            }
            .padding()
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 24))
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
}

// MARK: - Profile Row

struct ProfileRow: View {
    let icon: String
    let title: String
    let value: String
    var showChevron: Bool = false
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(.white.opacity(0.6))
                .frame(width: 24)
            
            Text(title)
                .foregroundStyle(.white.opacity(0.9))
            
            Spacer()
            
            Text(value)
                .foregroundStyle(.white.opacity(0.6))
            
            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.4))
            }
        }
        .padding(.vertical, 12)
    }
}

// MARK: - ViewModel

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var name = "Loading..."
    @Published var email = "..."
    @Published var phone = "..."
    @Published var department = "..."
    @Published var designation = "..."
    @Published var employeeId = "..."
    @Published var isLoading = false
    @Published var error: String?
    
    var initials: String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return name.prefix(2).uppercased()
    }
    
    private let authService = AuthService.shared
    
    func loadProfile() async {
        isLoading = true
        
        do {
            let profile = try await authService.getUserProfile()
            
            name = profile.name ?? "User"
            email = profile.email
            phone = profile.phone ?? "Not set"
            department = profile.department ?? "N/A"
            designation = profile.designation ?? "N/A"
            employeeId = profile.employeeId ?? "N/A"
            
            isLoading = false
        } catch {
            // Use data from token as fallback
            if let payload = TokenManager.shared.decodeToken(TokenManager.shared.getToken() ?? "") {
                email = payload.email
                department = payload.department
            }
            isLoading = false
        }
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        ProfileView()
            .environmentObject(AppState.shared)
    }
}
