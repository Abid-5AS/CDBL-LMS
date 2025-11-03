//
//  SyncService.swift
//  CDBLLeaveCompanion
//
//  Service for syncing data from QR codes and handling conflicts
//

import Foundation
import CoreData

class SyncService {
    static let shared = SyncService()
    
    private init() {}
    
    func syncFromQRCode(_ qrCodeString: String) async throws -> SyncResult {
        // Parse QR code - could be JSON string or URL
        let jsonData: Data
        
        if let url = URL(string: qrCodeString), url.scheme == "https" {
            // Fetch from URL
            let (data, _) = try await URLSession.shared.data(from: url)
            jsonData = data
        } else {
            // Direct JSON string
            guard let data = qrCodeString.data(using: .utf8) else {
                throw SyncError.invalidQRCodeFormat
            }
            jsonData = data
        }
        
        // Decode signed package
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        // TODO: Verify signature using LeaveSigner
        let syncPackage = try decoder.decode(SyncPackage.self, from: jsonData)
        
        // Verify signature
        let isValid = try LeaveSigner.shared.verifySyncPackage(syncPackage)
        guard isValid else {
            throw SyncError.invalidSignature
        }
        
        // Check expiry
        if syncPackage.expiry < Date() {
            throw SyncError.expiredPackage
        }
        
        // Sync data to Core Data
        let syncedCount = try await syncToCoreData(syncPackage)
        
        return SyncResult(
            success: true,
            message: "Successfully synced \(syncedCount) items",
            syncedItems: syncedCount
        )
    }
    
    private func syncToCoreData(_ package: SyncPackage) async throws -> Int {
        // This will be implemented to sync balances, history, and profile
        // For now, return placeholder
        return 0
    }
}

// MARK: - Sync Package Model

struct SyncPackage: Codable {
    let data: SyncData
    let signature: String
    let timestamp: Date
    let expiry: Date
    let policyVersion: String?  // Policy v2.0 compatibility
}

struct SyncData: Codable {
    let balances: LeaveBalance
    let history: [LeaveHistoryItem]
    let holidays: [Holiday]?
    let profile: EmployeeProfile?
}

struct LeaveHistoryItem: Codable {
    let id: Int
    let type: String
    let startDate: Date
    let endDate: Date
    let workingDays: Int
    let status: String
    let createdAt: Date
}

struct EmployeeProfile: Codable {
    let name: String
    let email: String
    let department: String?
    let designation: String?
    let joiningDate: Date?
}

// MARK: - Sync Errors

enum SyncError: LocalizedError {
    case invalidQRCodeFormat
    case invalidSignature
    case expiredPackage
    case syncFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidQRCodeFormat:
            return "QR code format is invalid"
        case .invalidSignature:
            return "Signature verification failed"
        case .expiredPackage:
            return "Sync package has expired"
        case .syncFailed(let message):
            return "Sync failed: \(message)"
        }
    }
}

