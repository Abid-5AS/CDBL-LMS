//
//  DeltaOutbox.swift
//  CDBLLeaveCompanion
//
//  Delta package builder with UUIDv7 idempotency and attachment manifests
//

import Foundation
import CryptoKit

// MARK: - Delta Package Models

/// Complete delta package for export
struct DeltaPackage: Codable {
    let actionId: String       // UUIDv7 (time-ordered)
    let timestamp: Date        // Creation timestamp
    let payloadHash: String    // SHA-256 of normalized payload
    let policyVersion: String  // "v2.0"
    let actions: [QueuedActionPayload]
    let manifest: AttachmentManifestPayload
}

struct QueuedActionPayload: Codable {
    let type: String           // "CREATE_LEAVE", "CANCEL_LEAVE", etc.
    let payload: LeaveRequest  // Actual request data
    let createdAt: Date
}

struct AttachmentManifestPayload: Codable {
    let files: [AttachmentRef]
    let totalSize: Int         // Sum of all file sizes
}

// MARK: - DeltaOutbox

/// Builds delta packages with idempotency keys and manifest
class DeltaOutbox {
    
    static let shared = DeltaOutbox()
    private init() {}
    
    /// Build a delta package from queued actions
    func buildPackage(
        actions: [QueuedActionPayload],
        attachments: AttachmentManifest
    ) throws -> DeltaPackage {
        // Generate UUIDv7-like action ID (time-ordered)
        let actionId = generateTimeOrderedUUID()
        
        // Normalize payload for hashing
        let payloadData = try normalizePayload(actions)
        let payloadHash = computeSHA256(payloadData)
        
        // Build manifest
        let manifest = AttachmentManifestPayload(
            files: attachments.getFiles(),
            totalSize: attachments.getTotalSize()
        )
        
        return DeltaPackage(
            actionId: actionId,
            timestamp: Date(),
            payloadHash: payloadHash,
            policyVersion: PolicyConstants.version,
            actions: actions,
            manifest: manifest
        )
    }
    
    /// Export package as JSON data
    func exportJSON(_ package: DeltaPackage) throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try encoder.encode(package)
    }
    
    // MARK: - UUID Generation
    
    /// Generate time-ordered UUID (approximation of UUIDv7)
    private func generateTimeOrderedUUID() -> String {
        // For v1, generate UUIDv4
        // TODO: Implement true UUIDv7 when available in Swift
        return UUID().uuidString
    }
    
    // MARK: - Payload Normalization
    
    /// Normalize payload for consistent hashing
    private func normalizePayload(_ actions: [QueuedActionPayload]) throws -> Data {
        // Encode with sorted keys for deterministic output
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]
        return try encoder.encode(actions)
    }
    
    // MARK: - Hashing
    
    /// Compute SHA-256 hash
    private func computeSHA256(_ data: Data) -> String {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { bytes in
            _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

import CommonCrypto

