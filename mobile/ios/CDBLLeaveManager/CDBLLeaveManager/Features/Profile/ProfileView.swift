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
                    .fill(Color(.tertiarySystemBackground))
                    .frame(width: 100, height: 100)
                
                Text(viewModel.initials)
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(.primary)
            }
            .surfaceBackground(in: Circle())
            .overlay(
                Circle()
                    .strokeBorder(
                        Color(.separator),
                        lineWidth: 1
                    )
            )
            
            // Name & Role
            VStack(spacing: 4) {
                Text(viewModel.name)
                    .font(.title2.bold())
                    .foregroundStyle(.primary)
                
                Text(viewModel.designation)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                
                HStack(spacing: 12) {
                    // Role Badge
                    Text(appState.userRole.displayName)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(Capsule())
                        .foregroundStyle(.primary)
                    
                    // Edit Button
                    Button(action: { showingEditProfile = true }) {
                        Label("Edit", systemImage: "pencil")
                            .font(.caption)
                            .fontWeight(.medium)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(Capsule())
                            .foregroundStyle(.primary)
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
            Divider()
            ProfileRow(icon: "phone.fill", title: "Phone", value: viewModel.phone)
            Divider()
            ProfileRow(icon: "building.2.fill", title: "Department", value: viewModel.department)
            Divider()
            ProfileRow(icon: "person.badge.key.fill", title: "Employee ID", value: viewModel.employeeId)
        }
        .padding()
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 24))
        .padding(.horizontal)
    }
    
    // MARK: - Settings Section
    
    private var settingsSection: some View {
        VStack(alignment: .leading) {
            Text("Settings")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 0) {
                NavigationLink(destination: NotificationsView()) {
                    ProfileRow(icon: "bell.fill", title: "Notifications", value: "On", showChevron: true)
                }
                
                Divider()
                
                NavigationLink(destination: SettingsView()) {
                    ProfileRow(icon: "faceid", title: "Security", value: "FaceID", showChevron: true)
                }
                
                Divider()
                
                NavigationLink(destination: DelegationView()) {
                    ProfileRow(icon: "person.crop.circle.badge.checkmark", title: "Delegation", value: "", showChevron: true)
                }
                
                Divider()
                
                NavigationLink(destination: ChangePasswordView()) {
                    ProfileRow(icon: "lock.fill", title: "Change Password", value: "", showChevron: true)
                }
                
                Divider()
                
                NavigationLink(destination: HelpView()) {
                    ProfileRow(icon: "questionmark.circle.fill", title: "Help & Support", value: "", showChevron: true)
                }
            }
            .padding()
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 24))
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
            .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 16))
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
                .foregroundStyle(.secondary)
                .frame(width: 24)
            
            Text(title)
                .foregroundStyle(.secondary)
            
            Spacer()
            
            Text(value)
                .foregroundStyle(.secondary)
            
            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
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
        Color(.systemBackground).ignoresSafeArea()
        ProfileView()
            .environmentObject(AppState.shared)
    }
}
