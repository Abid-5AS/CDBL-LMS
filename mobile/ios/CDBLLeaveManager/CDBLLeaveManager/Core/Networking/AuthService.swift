//
//  AuthService.swift
//  CDBLLeaveManager
//
//  Authentication API service.
//

import Foundation

actor AuthService {
    static let shared = AuthService()
    
    private let client = APIClient.shared
    
    private init() {}
    
    // MARK: - Login
    
    func login(email: String, password: String, skipOtp: Bool = false) async throws -> LoginResponse {
        let request = LoginRequest(email: email, password: password, skipOtp: skipOtp)
        return try await client.request(
            "auth/mobile-login",
            method: .post,
            body: request,
            requiresAuth: false
        )
    }
    
    // MARK: - OTP Verification
    
    func verifyOtp(email: String, code: String) async throws -> LoginResponse {
        let request = VerifyOtpRequest(email: email, code: code)
        return try await client.request(
            "auth/mobile-verify-otp",
            method: .post,
            body: request,
            requiresAuth: false
        )
    }
    
    // MARK: - Get Current User
    
    func getCurrentUser() async throws -> AuthUser {
        return try await client.request("auth/me")
    }
    
    // MARK: - Get User Profile
    
    func getUserProfile() async throws -> UserDetailsResponse {
        return try await client.request("user/profile")
    }
    
    // MARK: - Update Profile
    
    func updateProfile(_ request: UpdateProfileRequest) async throws -> APIResponse<UserDetailsResponse> {
        return try await client.request(
            "user/profile",
            method: .put,
            body: request
        )
    }
    
    // MARK: - Change Password
    
    func changePassword(_ request: ChangePasswordRequest) async throws -> ChangePasswordResponse {
        return try await client.request(
            "settings/change-password",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Logout
    
    func logout() async {
        TokenManager.shared.clearToken()
    }
}
