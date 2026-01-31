import SwiftUI
import LocalAuthentication

struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    @Binding var isAuthenticated: Bool
    
    var body: some View {
        if viewModel.requiresOtp {
            OtpVerificationView(viewModel: viewModel, isAuthenticated: $isAuthenticated)
        } else {
            loginContent
        }
    }
    
    // MARK: - Login Content
    
    private var loginContent: some View {
        GeometryReader { geometry in
            ZStack {
                Color(.systemBackground).ignoresSafeArea()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 30) {
                        logoHeader
                        
                        VStack(spacing: 24) {
                            Text("Welcome Back")
                                .font(.title2.bold())
                                .foregroundStyle(.primary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            emailField
                            passwordField
                            
                            if let error = viewModel.error {
                                Text(error)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            
                            signInButton
                            biometricButton
                        }
                        .padding(24)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                        .padding(.horizontal, 20)
                        
                        #if DEBUG
                        quickLoginSection
                            .padding(.horizontal, 20)
                        #endif
                        
                        Text("Powered by SwiftUI")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 20)
                    }
                    .frame(minHeight: geometry.size.height)
                }
            }
        }
    }
    
    // MARK: - Subviews
    
    private var logoHeader: some View {
        VStack(spacing: 16) {
            Image(systemName: "cube.transparent")
                .font(.system(size: 60))
                .foregroundStyle(.primary)

            Text("CDBL Connect")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
        }
        .padding(.top, 60)
    }

    private var emailField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Email")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.leading, 8)

            TextField("Enter email", text: $viewModel.email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding()
                .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
                .foregroundStyle(.primary)
        }
    }

    private var passwordField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Password")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.leading, 8)

            SecureField("Enter password", text: $viewModel.password)
                .padding()
                .surfaceBackground(.clear, in: RoundedRectangle(cornerRadius: 12))
                .foregroundStyle(.primary)
        }
    }

    private var signInButton: some View {
        Button(action: performLogin) {
            HStack {
                if viewModel.isLoading {
                    ProgressView()
                        .tint(.accentColor)
                } else {
                    Text("Sign In")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
        }
        .buttonStyle(.borderedProminent)
        .tint(.accentColor)
        .disabled(viewModel.isLoading)
    }

    private var biometricButton: some View {
        Group {
            if viewModel.hasSavedCredentials {
                Button(action: authenticateBiometrics) {
                    HStack(spacing: 8) {
                        Image(systemName: "faceid")
                            .font(.title3)
                        Text("Login with FaceID")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                }
                .buttonStyle(.bordered)
                .foregroundStyle(.secondary)
                .padding(.top, 8)
            }
        }
    }

    private var quickLoginSection: some View {
        VStack(spacing: 12) {
            Text("Quick Login (Dev Only)")
                .font(.caption2)
                .foregroundStyle(.secondary)

            HStack {
                Toggle("Skip OTP", isOn: $viewModel.skipOtp)
                    .font(.caption)
                    .foregroundStyle(.primary)
                    .tint(.accentColor)
                
                if viewModel.skipOtp {
                    Text("✓")
                        .font(.caption)
                        .foregroundStyle(.green)
                        .fontWeight(.bold)
                }
            }
            .padding(8)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    QuickLoginButton("Admin") {
                        viewModel.quickLogin(as: "admin")
                        performLogin()
                    }
                    QuickLoginButton("HR Admin") {
                        viewModel.quickLogin(as: "hradmin")
                        performLogin()
                    }
                    QuickLoginButton("HR Head") {
                        viewModel.quickLogin(as: "hrhead")
                        performLogin()
                    }
                }

                HStack(spacing: 8) {
                    QuickLoginButton("Manager") {
                        viewModel.quickLogin(as: "manager")
                        performLogin()
                    }
                    QuickLoginButton("CEO") {
                        viewModel.quickLogin(as: "ceo")
                        performLogin()
                    }
                    QuickLoginButton("Employee") {
                        viewModel.quickLogin(as: "employee")
                        performLogin()
                    }
                }
            }
        }
        .padding(.vertical, 10)
        .padding(.horizontal)
        .surfaceBackground(.regular, in: RoundedRectangle(cornerRadius: 22))
    }
    
    // MARK: - Actions
    
    private func performLogin() {
        // Prevent duplicate calls
        guard !viewModel.isLoading else { return }
        
        Task {
            let success = await viewModel.login()
            if success {
                withAnimation {
                    isAuthenticated = true
                }
            }
        }
    }
    
    private func authenticateBiometrics() {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            viewModel.error = "Biometrics not available"
            return
        }
        
        context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Log in to your account"
        ) { success, authError in
            DispatchQueue.main.async {
                if success {
                    Task {
                        let success = await viewModel.loginWithSavedToken()
                        if success {
                            withAnimation {
                                isAuthenticated = true
                            }
                        }
                    }
                } else {
                    viewModel.error = "Authentication failed"
                }
            }
        }
    }
}

// MARK: - Quick Login Button

struct QuickLoginButton: View {
    let title: String
    let action: () -> Void
    
    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.bordered)
        .foregroundStyle(.primary)
        .controlSize(.small)
    }
}

#Preview {
    LoginView(isAuthenticated: .constant(false))
}
