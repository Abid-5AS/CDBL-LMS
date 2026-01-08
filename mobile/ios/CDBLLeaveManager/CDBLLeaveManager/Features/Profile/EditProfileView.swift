//
//  EditProfileView.swift
//  CDBLLeaveManager
//
//  Edit profile form.
//

import SwiftUI
import Combine

struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = EditProfileViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Avatar
                        avatarSection
                        
                        // Form Fields
                        formFields
                        
                        // Save Button
                        saveButton
                        
                        Spacer().frame(height: 40)
                    }
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
            .task {
                await viewModel.loadProfile()
            }
        }
    }
    
    // MARK: - Avatar Section
    
    private var avatarSection: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [.cyan.opacity(0.5), .purple.opacity(0.5)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 100, height: 100)
                .overlay(
                    Text(viewModel.initials)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(.white)
                )
                .glassEffect(in: Circle())
            
            Button(action: {}) {
                Text("Change Photo")
                    .font(.caption)
                    .foregroundStyle(.cyan)
            }
        }
    }
    
    // MARK: - Form Fields
    
    private var formFields: some View {
        VStack(spacing: 16) {
            ProfileTextField(
                label: "Full Name",
                text: $viewModel.name,
                icon: "person.fill"
            )
            
            ProfileTextField(
                label: "Email",
                text: .constant(viewModel.email),
                icon: "envelope.fill",
                isDisabled: true
            )
            
            ProfileTextField(
                label: "Phone",
                text: $viewModel.phone,
                icon: "phone.fill"
            )
            
            ProfileTextField(
                label: "Address",
                text: $viewModel.address,
                icon: "house.fill"
            )
            
            ProfileTextField(
                label: "Emergency Contact",
                text: $viewModel.emergencyContact,
                icon: "staroflife.fill"
            )

            
            ProfileTextField(
                label: "Employee ID",
                text: .constant(viewModel.employeeId),
                icon: "person.badge.key.fill",
                isDisabled: true
            )
            
            ProfileTextField(
                label: "Department",
                text: .constant(viewModel.department),
                icon: "building.2.fill",
                isDisabled: true
            )
            
            ProfileTextField(
                label: "Designation",
                text: .constant(viewModel.designation),
                icon: "briefcase.fill",
                isDisabled: true
            )
            
            // Error
            if let error = viewModel.error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Save Button
    
    private var saveButton: some View {
        Button(action: save) {
            HStack {
                if viewModel.isSaving {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: "checkmark")
                    Text("Save Changes")
                }
            }
            .fontWeight(.semibold)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
        }
        .buttonStyle(.glassProminent)
        .tint(.green)
        .disabled(viewModel.isSaving)
        .padding(.horizontal)
    }
    
    private func save() {
        Task {
            let success = await viewModel.saveProfile()
            if success {
                dismiss()
            }
        }
    }
}

// MARK: - Profile Text Field

struct ProfileTextField: View {
    let label: String
    @Binding var text: String
    let icon: String
    var isDisabled: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.6))
            
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundStyle(.white.opacity(0.5))
                    .frame(width: 24)
                
                TextField("", text: $text)
                    .foregroundStyle(isDisabled ? .white.opacity(0.5) : .white)
                    .disabled(isDisabled)
            }
            .padding()
            .glassEffect(
                isDisabled ? .clear : .regular,
                in: RoundedRectangle(cornerRadius: 12)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        Color.white.opacity(isDisabled ? 0.1 : 0.2),
                        lineWidth: 1
                    )
            )
        }
    }
}

// MARK: - ViewModel

@MainActor
final class EditProfileViewModel: ObservableObject {
    @Published var name = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var address = ""
    @Published var emergencyContact = ""
    @Published var employeeId = ""
    @Published var department = ""
    @Published var designation = ""
    @Published var isSaving = false
    @Published var error: String?
    
    private let authService = AuthService.shared
    
    var initials: String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return name.prefix(2).uppercased()
    }
    
    func loadProfile() async {
        do {
            let profile = try await authService.getUserProfile()
            
            name = profile.name ?? ""
            email = profile.email
            phone = profile.phone ?? ""
            address = profile.address ?? ""
            emergencyContact = profile.emergencyContact ?? ""
            employeeId = profile.employeeId ?? ""
            department = profile.department ?? ""
            designation = profile.designation ?? ""
        } catch {
            self.error = error.localizedDescription
        }
    }
    
    func saveProfile() async -> Bool {
        isSaving = true
        error = nil
        
        do {
            let request = UpdateProfileRequest(
                name: name,
                phone: phone,
                emergencyContact: emergencyContact,
                address: address
            )
            _ = try await authService.updateProfile(request)
            isSaving = false
            return true
        } catch {
            isSaving = false
            self.error = error.localizedDescription
            return false
        }
    }
}


#Preview {
    EditProfileView()
}

