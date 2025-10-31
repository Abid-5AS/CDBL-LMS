//
//  LeaveSigner.swift
//  CDBLLeaveCompanion
//
//  HMAC-SHA256 signing service for leave requests
//  Uses CryptoKit and Keychain for secure key storage
//

import Foundation
import CryptoKit

// MARK: - Signed Leave Package

struct SignedLeavePackage: Codable {
    let data: LeaveRequest
    let signature: String
    let timestamp: String
    let expiry: String
}

// MARK: - Leave Signer

class LeaveSigner {
    static let shared = LeaveSigner()
    
    private let keychainService = "com.cdbl.leavecompanion"
    private let keychainKey = "deviceSigningKey"
    
    private init() {}
    
    // MARK: - Key Management
    
    /// Get or generate device-specific signing key from Keychain
    private func getOrCreateSigningKey() throws -> SymmetricKey {
        // Try to retrieve existing key from Keychain
        if let existingKey = retrieveKeyFromKeychain() {
            return existingKey
        }
        
        // Generate new key
        let newKey = SymmetricKey(size: .bits256)
        
        // Store in Keychain
        try storeKeyInKeychain(newKey)
        
        return newKey
    }
    
    private func retrieveKeyFromKeychain() -> SymmetricKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainKey,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data else {
            return nil
        }
        
        return SymmetricKey(data: data)
    }
    
    private func storeKeyInKeychain(_ key: SymmetricKey) throws {
        let keyData = key.withUnsafeBytes { Data(Array($0)) }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainKey,
            kSecValueData as String: keyData
        ]
        
        // Delete existing item if present
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw SigningError.keychainError("Failed to store key in Keychain: \(status)")
        }
    }
    
    // MARK: - Signing
    
    /// Sign a leave request and create a signed package with 24h expiry
    func signLeaveRequest(_ request: LeaveRequest) throws -> SignedLeavePackage {
        let key = try getOrCreateSigningKey()
        
        // Encode request to JSON for signing
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        let requestData = try encoder.encode(request)
        
        // Generate HMAC-SHA256 signature
        let signature = HMAC<SHA256>.authenticationCode(for: requestData, using: key)
        let signatureHex = Data(signature).map { String(format: "%02x", $0) }.joined()
        
        // Create timestamps
        let now = Date()
        let expiry = now.addingTimeInterval(24 * 60 * 60) // 24 hours
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        return SignedLeavePackage(
            data: request,
            signature: signatureHex,
            timestamp: formatter.string(from: now),
            expiry: formatter.string(from: expiry)
        )
    }
    
    // MARK: - Verification (for testing)
    
    /// Verify a signed package's signature (for local validation)
    func verifySignature(_ package: SignedLeavePackage) throws -> Bool {
        let key = try getOrCreateSigningKey()
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        let requestData = try encoder.encode(package.data)
        
        guard let signatureData = Data(hexString: package.signature) else {
            throw SigningError.invalidSignature
        }
        
        let computedSignature = HMAC<SHA256>.authenticationCode(for: requestData, using: key)
        
        return Data(computedSignature) == signatureData
    }
    
    /// Verify sync package signature
    func verifySyncPackage(_ package: SyncPackage) throws -> Bool {
        let key = try getOrCreateSigningKey()
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(package.data)
        
        guard let signatureData = Data(hexString: package.signature) else {
            return false
        }
        
        let computedSignature = HMAC<SHA256>.authenticationCode(for: data, using: key)
        
        return Data(computedSignature) == signatureData
    }
}

// MARK: - Signing Errors

enum SigningError: LocalizedError {
    case keychainError(String)
    case invalidSignature
    case encodingError
    
    var errorDescription: String? {
        switch self {
        case .keychainError(let message):
            return message
        case .invalidSignature:
            return "Invalid signature format"
        case .encodingError:
            return "Failed to encode leave request"
        }
    }
}

// MARK: - Data Hex Extension

extension Data {
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var i = hexString.startIndex
        for _ in 0..<len {
            let j = hexString.index(i, offsetBy: 2)
            let bytes = hexString[i..<j]
            if var num = UInt8(bytes, radix: 16) {
                data.append(&num, count: 1)
            } else {
                return nil
            }
            i = j
        }
        self = data
    }
}

