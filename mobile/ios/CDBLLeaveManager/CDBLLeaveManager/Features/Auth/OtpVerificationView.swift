//
//  OtpVerificationView.swift
//  CDBLLeaveManager
//
//  OTP verification screen with system materials.
//

import SwiftUI

struct OtpVerificationView: View {
    @ObservedObject var viewModel: LoginViewModel
    @Binding var isAuthenticated: Bool
    
    @FocusState private var focusedField: Int?
    @State private var otpDigits: [String] = Array(repeating: "", count: 6)
    
    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            
            VStack(spacing: 32) {
                // Header
                VStack(spacing: 16) {
                    Image(systemName: "lock.shield.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(.primary)
                    
                    Text("Verification")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(.primary)
                    
                    Text("Enter the 6-digit code sent to")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    
                    Text(viewModel.email)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.accentColor)
                }
                .padding(.top, 60)
                
                // OTP Input
                HStack(spacing: 12) {
                    ForEach(0..<6, id: \.self) { index in
                        OtpDigitField(
                            digit: $otpDigits[index],
                            isFocused: focusedField == index
                        )
                        .focused($focusedField, equals: index)
                        .onChange(of: otpDigits[index]) { _, newValue in
                            handleDigitChange(at: index, newValue: newValue)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Error
                if let error = viewModel.error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal)
                }
                
                // Verify Button
                Button(action: verify) {
                    HStack {
                        if viewModel.isLoading {
                            ProgressView()
                                .tint(.accentColor)
                        } else {
                            Text("Verify")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                }
                .buttonStyle(.borderedProminent)
                .tint(.accentColor)
                .disabled(viewModel.isLoading || otpDigits.joined().count != 6)
                .padding(.horizontal)
                
                // Resend
                Button(action: {}) {
                    Text("Didn't receive code? Resend")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                
                // Back to Login
                Button(action: { viewModel.requiresOtp = false }) {
                    HStack {
                        Image(systemName: "arrow.left")
                        Text("Back to Login")
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                
                Spacer()
            }
        }
        .onAppear {
            focusedField = 0
        }
    }
    
    private func handleDigitChange(at index: Int, newValue: String) {
        // Only allow single digit
        if newValue.count > 1 {
            otpDigits[index] = String(newValue.suffix(1))
        }
        
        // Auto-advance to next field
        if !newValue.isEmpty && index < 5 {
            focusedField = index + 1
        }
        
        // Update viewModel
        viewModel.otpCode = otpDigits.joined()
        
        // Auto-submit when complete
        if otpDigits.joined().count == 6 {
            verify()
        }
    }
    
    private func verify() {
        viewModel.otpCode = otpDigits.joined()
        Task {
            let success = await viewModel.verifyOtp()
            if success {
                withAnimation {
                    isAuthenticated = true
                }
            }
        }
    }
}

// MARK: - OTP Digit Field

struct OtpDigitField: View {
    @Binding var digit: String
    let isFocused: Bool
    
    var body: some View {
        TextField("", text: $digit)
            .keyboardType(.numberPad)
            .textContentType(.oneTimeCode)
            .multilineTextAlignment(.center)
            .font(.system(size: 24, weight: .bold, design: .rounded))
            .foregroundStyle(.primary)
            .frame(width: 48, height: 56)
            .surfaceBackground(
                isFocused ? .regular : .clear,
                in: RoundedRectangle(cornerRadius: 12)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        isFocused ? Color.accentColor : Color(.separator),
                        lineWidth: isFocused ? 2 : 1
                    )
            )
    }
}

#Preview {
    OtpVerificationView(
        viewModel: LoginViewModel(),
        isAuthenticated: .constant(false)
    )
}
