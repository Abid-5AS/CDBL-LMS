//
//  ChangePasswordView.swift
//  CDBLLeaveManager
//
//  Change password form.
//

import SwiftUI

struct ChangePasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var showCurrentPassword = false
    @State private var showNewPassword = false
    @State private var showConfirmPassword = false
    @State private var isSubmitting = false
    @State private var error: String?
    @State private var showSuccess = false
    
    private var isValid: Bool {
        !currentPassword.isEmpty &&
        newPassword.count >= 8 &&
        newPassword == confirmPassword
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                FluidBackground()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Icon
                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.cyan)
                            .padding(.top, 20)
                        
                        // Instructions
                        Text("Create a strong password that you don't use for other accounts")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                        
                        // Form Fields
                        VStack(spacing: 16) {
                            PasswordField(
                                label: "Current Password",
                                text: $currentPassword,
                                showPassword: $showCurrentPassword
                            )
                            
                            PasswordField(
                                label: "New Password",
                                text: $newPassword,
                                showPassword: $showNewPassword
                            )
                            
                            PasswordField(
                                label: "Confirm New Password",
                                text: $confirmPassword,
                                showPassword: $showConfirmPassword
                            )
                            
                            // Password Requirements
                            passwordRequirements
                        }
                        .padding(.horizontal)
                        
                        // Error
                        if let error = error {
                            HStack {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundStyle(.red)
                                Text(error)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                        }
                        
                        // Submit Button
                        Button(action: changePassword) {
                            HStack {
                                if isSubmitting {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: "checkmark.shield.fill")
                                    Text("Change Password")
                                }
                            }
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                        }
                        .buttonStyle(.glassProminent)
                        .tint(.cyan)
                        .disabled(!isValid || isSubmitting)
                        .padding(.horizontal)
                        
                        Spacer().frame(height: 40)
                    }
                }
                
                // Success Overlay
                if showSuccess {
                    successOverlay
                }
            }
            .navigationTitle("Change Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.white)
                }
            }
        }
    }
    
    // MARK: - Password Requirements
    
    private var passwordRequirements: some View {
        VStack(alignment: .leading, spacing: 8) {
            RequirementRow(
                text: "At least 8 characters",
                isMet: newPassword.count >= 8
            )
            
            RequirementRow(
                text: "Contains a number",
                isMet: newPassword.contains(where: { $0.isNumber })
            )
            
            RequirementRow(
                text: "Passwords match",
                isMet: !newPassword.isEmpty && newPassword == confirmPassword
            )
        }
        .padding()
        .glassEffect(.transparent, in: RoundedRectangle(cornerRadius: 12))
    }
    
    // MARK: - Success Overlay
    
    private var successOverlay: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(.green)
            
            Text("Password Changed!")
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(.white)
            
            Text("Your password has been updated successfully.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
                .multilineTextAlignment(.center)
            
            Button("Done") {
                dismiss()
            }
            .buttonStyle(.glassProminent)
            .tint(.cyan)
            .padding(.horizontal, 60)
        }
        .padding(40)
        .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 28))
        .padding(40)
    }
    
    // MARK: - Actions
    
    private func changePassword() {
        guard isValid else { return }
        
        isSubmitting = true
        error = nil
        
        Task {
            do {
                let request = ChangePasswordRequest(
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                )
                _ = try await AuthService.shared.changePassword(request)
                
                await MainActor.run {
                    isSubmitting = false
                    showSuccess = true
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    self.error = error.localizedDescription
                }
            }
        }
    }
}

// MARK: - Password Field

struct PasswordField: View {
    let label: String
    @Binding var text: String
    @Binding var showPassword: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.6))
            
            HStack {
                if showPassword {
                    TextField("", text: $text)
                        .foregroundStyle(.white)
                } else {
                    SecureField("", text: $text)
                        .foregroundStyle(.white)
                }
                
                Button(action: { showPassword.toggle() }) {
                    Image(systemName: showPassword ? "eye.slash" : "eye")
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
            .padding()
            .glassEffect(.frosted, in: RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Requirement Row

struct RequirementRow: View {
    let text: String
    let isMet: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: isMet ? "checkmark.circle.fill" : "circle")
                .font(.caption)
                .foregroundStyle(isMet ? .green : .white.opacity(0.4))
            
            Text(text)
                .font(.caption)
                .foregroundStyle(isMet ? .white : .white.opacity(0.5))
        }
    }
}

#Preview {
    ChangePasswordView()
}
