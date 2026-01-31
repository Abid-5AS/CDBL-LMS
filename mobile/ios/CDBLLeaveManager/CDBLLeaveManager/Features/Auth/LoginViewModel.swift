//
//  LoginViewModel.swift
//  CDBLLeaveManager
//
//  ViewModel for login flow with API integration.
//

import SwiftUI
import Combine

@MainActor
final class LoginViewModel: ObservableObject {
    // MARK: - Published State
    
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var error: String?
    @Published var requiresOtp = false
    @Published var otpCode = ""
    @Published var hasSavedCredentials = false
    
    // MARK: - Config
    
    @Published var skipOtp: Bool = {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }()
    
    // MARK: - Private
    
    private let authService = AuthService.shared
    private let tokenManager = TokenManager.shared
    
    // MARK: - Init
    
    init() {
        checkSavedCredentials()
    }
    
    private func checkSavedCredentials() {
        hasSavedCredentials = tokenManager.getUserEmail() != nil && tokenManager.hasValidToken()
    }
    
    // MARK: - Login
    
    func login() async -> Bool {
        guard !email.isEmpty, !password.isEmpty else {
            error = "Please enter email and password"
            return false
        }
        
        isLoading = true
        error = nil
        
        #if DEBUG
        print("🔐 Login attempt - Email: \(email), Skip OTP: \(skipOtp)")
        #endif
        
        do {
            let response = try await authService.login(
                email: email,
                password: password,
                skipOtp: skipOtp
            )
            
            #if DEBUG
            print("🔐 Response - Success: \(response.success), Error: \(response.error ?? "none")")
            if let data = response.data {
                print("🔐 Data - requiresOtp: \(data.requiresOtp ?? false), token: \(data.token != nil ? "present" : "nil")")
            }
            #endif
            
            isLoading = false
            
            if response.success {
                if let data = response.data {
                    // Only redirect to OTP if skipOtp is false and server requires it
                    if !skipOtp && data.requiresOtp == true {
                        requiresOtp = true
                        return false
                    }
                    
                    if let token = data.token {
                        handleSuccessfulLogin(
                            token: token,
                            refreshToken: data.refreshToken,
                            user: data.user
                        )
                        return true
                    }
                }
            }
            
            error = response.error ?? "Login failed"
            return false
            
        } catch let apiError as APIError {
            isLoading = false
            error = apiError.localizedDescription
            return false
        } catch {
            isLoading = false
            self.error = error.localizedDescription
            return false
        }
    }
    
    // MARK: - OTP Verification
    
    func verifyOtp() async -> Bool {
        guard otpCode.count == 6 else {
            error = "Please enter the 6-digit code"
            return false
        }
        
        isLoading = true
        error = nil
        
        do {
            let response = try await authService.verifyOtp(email: email, code: otpCode)
            
            isLoading = false
            
            if response.success, let data = response.data, let token = data.token {
                handleSuccessfulLogin(
                    token: token,
                    refreshToken: data.refreshToken,
                    user: data.user
                )
                return true
            }
            
            error = response.error ?? "Verification failed"
            return false
            
        } catch {
            isLoading = false
            self.error = error.localizedDescription
            return false
        }
    }
    
    // MARK: - Biometric Login
    
    func loginWithSavedToken() async -> Bool {
        guard tokenManager.hasValidToken() else {
            error = "Session expired. Please login again."
            return false
        }
        
        // Token is valid, just check with server
        isLoading = true
        
        do {
            let _ = try await authService.getCurrentUser()
            isLoading = false
            
            AppState.shared.checkAuthState()
            return AppState.shared.isAuthenticated
            
        } catch {
            isLoading = false
            tokenManager.clearToken()
            self.error = "Session expired. Please login again."
            return false
        }
    }
    
    // MARK: - Helpers
    
    private func handleSuccessfulLogin(token: String, refreshToken: String?, user: AuthUser?) {
        AppState.shared.login(
            token: token,
            refreshToken: refreshToken,
            user: user
        )
    }
    
    func clearError() {
        error = nil
    }
    
    // MARK: - Quick Login (Dev)
    
    func quickLogin(as role: String) {
        switch role.lowercased() {
        case "admin":
            email = "admin1@test.local"
            password = "password123"
        case "hr", "hradmin":
            email = "hradmin1@test.local"
            password = "password123"
        case "hrhead":
            email = "hrhead1@test.local"
            password = "password123"
        case "manager", "depthead":
            email = "manager1@test.local"
            password = "password123"
        case "ceo":
            email = "ceo1@test.local"
            password = "password123"
        default:
            email = "employee1@test.local"
            password = "password123"
        }
    }
}
