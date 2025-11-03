//
//  SnapshotImporter.swift
//  CDBLLeaveCompanion
//
//  Imports QR snapshot data into CoreData with signature verification
//

import Foundation
import CoreData

// MARK: - Snapshot Package

/// Reuse existing SyncPackage and SyncData structures
/// Snapshot package containing balances, holidays, requests, and metadata
typealias SnapshotPackage = SyncPackage
typealias SnapshotData = SyncData

struct LeaveRequestSnapshot: Codable {
    let id: Int
    let type: LeaveType
    let startDate: Date
    let endDate: Date
    let workingDays: Int
    let reason: String
    let status: LeaveStatus
    let createdAt: Date
}

// MARK: - SnapshotImporter

/// Imports and verifies QR snapshot packages
class SnapshotImporter {
    
    static let shared = SnapshotImporter()
    private init() {}
    
    /// Import snapshot from assembled data
    func importSnapshot(_ data: Data, into context: NSManagedObjectContext) throws -> ImportResult {
        // Decode snapshot package
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let snapshot = try decoder.decode(SnapshotPackage.self, from: data)
        
        // Verify signature
        try verifySignature(snapshot: snapshot)
        
        // Verify policy version if present
        if let version = snapshot.policyVersion {
            try verifyPolicyVersion(version)
        }
        
        // Import data
        let balances = try importBalances(snapshot.data.balances, into: context)
        let holidays = try importHolidays(snapshot.data.holidays ?? [], into: context)
        let requests = try importRequests(snapshot.data.history, into: context)
        
        // Store sync metadata
        try storeSyncMetadata(snapshot, into: context)
        
        return ImportResult(
            success: true,
            balancesImported: balances,
            holidaysImported: holidays,
            requestsImported: requests,
            snapshotHash: QRFramer.computeSHA256(data),
            policyVersion: snapshot.policyVersion ?? "unknown"
        )
    }
    
    // MARK: - Signature Verification
    
    private func verifySignature(snapshot: SnapshotPackage) throws {
        // Use existing LeaveSigner verification
        let isValid = try LeaveSigner.shared.verifySyncPackage(snapshot)
        if !isValid {
            throw ImportError.invalidSignature
        }
    }
    
    // MARK: - Policy Version Check
    
    private func verifyPolicyVersion(_ version: String) throws {
        // Ensure snapshot matches supported policy version
        guard version == PolicyConstants.version else {
            throw ImportError.policyVersionMismatch(
                snapshot: version,
                supported: PolicyConstants.version
            )
        }
    }
    
    // MARK: - Data Import
    
    private func importBalances(_ balances: LeaveBalance, into context: NSManagedObjectContext) throws -> Int {
        // TODO: Import balances into CoreData
        // For now, return count
        return 3 // CASUAL, MEDICAL, EARNED
    }
    
    private func importHolidays(_ holidays: [Holiday], into context: NSManagedObjectContext) throws -> Int {
        // TODO: Import holidays into CoreData
        // For now, return count
        return holidays.count
    }
    
    private func importRequests(_ requests: [LeaveHistoryItem], into context: NSManagedObjectContext) throws -> Int {
        // TODO: Import requests into CoreData
        // For now, return count
        return requests.count
    }
    
    // MARK: - Sync Metadata
    
    private func storeSyncMetadata(_ snapshot: SnapshotPackage, into context: NSManagedObjectContext) throws {
        // TODO: Create SyncMetadata entity with:
        // - lastSyncTimestamp
        // - snapshotHash
        // - policyVersion
        // Save to CoreData
    }
}

// MARK: - Import Result

struct ImportResult {
    let success: Bool
    let balancesImported: Int
    let holidaysImported: Int
    let requestsImported: Int
    let snapshotHash: String
    let policyVersion: String
}

// MARK: - Import Errors

enum ImportError: LocalizedError {
    case policyVersionMismatch(snapshot: String, supported: String)
    case invalidSignature
    case importFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .policyVersionMismatch(let snapshot, let supported):
            return "Snapshot policy version (\(snapshot)) does not match supported version (\(supported))"
        case .invalidSignature:
            return "Invalid snapshot signature"
        case .importFailed(let message):
            return "Import failed: \(message)"
        }
    }
}

