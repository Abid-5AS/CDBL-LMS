//
//  TokenManager.swift
//  CDBLLeaveManager
//
//  Secure token storage using Keychain with JWT decoding.
//

import Foundation
import Security

final class TokenManager {
    static let shared = TokenManager()
    
    private let tokenKey = "com.cdbl.leavemanager.authToken"
    private let refreshTokenKey = "com.cdbl.leavemanager.refreshToken"
    private let userEmailKey = "com.cdbl.leavemanager.userEmail"
    
    private init() {}
    
    // MARK: - Token Management
    
    func saveToken(_ token: String) {
        save(token, forKey: tokenKey)
    }
    
    func getToken() -> String? {
        return retrieve(forKey: tokenKey)
    }
    
    func saveRefreshToken(_ token: String) {
        save(token, forKey: refreshTokenKey)
    }
    
    func getRefreshToken() -> String? {
        return retrieve(forKey: refreshTokenKey)
    }
    
    func saveUserEmail(_ email: String) {
        UserDefaults.standard.set(email, forKey: userEmailKey)
    }
    
    func getUserEmail() -> String? {
        return UserDefaults.standard.string(forKey: userEmailKey)
    }
    
    func clearToken() {
        delete(forKey: tokenKey)
        delete(forKey: refreshTokenKey)
    }
    
    func hasValidToken() -> Bool {
        guard let token = getToken() else { return false }
        return !isTokenExpired(token)
    }
    
    // MARK: - JWT Decoding
    
    struct JWTPayload {
        let userId: String
        let email: String
        let role: String
        let employeeId: String
        let department: String
        let exp: Date
        
        var isExpired: Bool {
            return exp < Date()
        }
    }
    
    func decodeToken(_ token: String) -> JWTPayload? {
        let segments = token.components(separatedBy: ".")
        guard segments.count == 3 else { return nil }
        
        let payloadSegment = segments[1]
        
        // Add padding if needed
        var base64 = payloadSegment
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        
        let remainder = base64.count % 4
        if remainder > 0 {
            base64 += String(repeating: "=", count: 4 - remainder)
        }
        
        guard let data = Data(base64Encoded: base64),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        
        let exp: Date
        if let expTimestamp = json["exp"] as? TimeInterval {
            exp = Date(timeIntervalSince1970: expTimestamp)
        } else {
            exp = Date()
        }
        
        return JWTPayload(
            userId: json["userId"] as? String ?? json["sub"] as? String ?? "",
            email: json["email"] as? String ?? "",
            role: json["role"] as? String ?? "EMPLOYEE",
            employeeId: json["employeeId"] as? String ?? "",
            department: json["department"] as? String ?? "",
            exp: exp
        )
    }
    
    func getUserRole() -> String {
        guard let token = getToken(),
              let payload = decodeToken(token) else {
            return "EMPLOYEE"
        }
        return payload.role
    }
    
    func isTokenExpired(_ token: String) -> Bool {
        guard let payload = decodeToken(token) else { return true }
        return payload.isExpired
    }
    
    // MARK: - Keychain Operations
    
    private func save(_ value: String, forKey key: String) {
        guard let data = value.data(using: .utf8) else { return }
        
        // Delete existing item first
        delete(forKey: key)
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func retrieve(forKey key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return value
    }
    
    private func delete(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}
