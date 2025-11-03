//
//  PairingService.swift
//  CDBLLeaveCompanion
//
//  Service for pairing iOS device with desktop web app
//
//  Status: 🚧 Interface only, not implemented
//

import Foundation

protocol PairingServiceProtocol {
    func pair(with pairToken: String) async throws -> PairingResponse
    func unlinkDevice() async throws
    func isPaired() -> Bool
}

class PairingService: PairingServiceProtocol {
    static let shared = PairingService()
    
    private init() {}
    
    /// Pair device using QR code token
    /// - Parameter pairToken: Single-use token from QR code
    /// - Returns: Session token and device ID
    func pair(with pairToken: String) async throws -> PairingResponse {
        // TODO: Implement API call to /api/mobile/pair
        fatalError("Not implemented")
    }
    
    /// Unlink device from account
    func unlinkDevice() async throws {
        // TODO: Implement API call to unlink device
        fatalError("Not implemented")
    }
    
    /// Check if device is currently paired
    /// - Returns: True if paired
    func isPaired() -> Bool {
        // TODO: Check Keychain for session token
        return false
    }
}

// MARK: - Pairing Models

struct PairingResponse: Codable {
    let sessionToken: String
    let deviceId: String
    let expiresAt: Date
    let refreshToken: String?
}

// MARK: - TODO List

/*
 * TODO Implementation Tasks:
 * 1. Implement pair() with /api/mobile/pair API call
 * 2. Implement unlinkDevice() API call
 * 3. Store session token in Keychain
 * 4. Implement isPaired() check
 * 5. Handle pairing errors and retries
 * 6. Add QR code scanning integration
 * 7. Support remote revocation
 */

