//
//  ReceiptIngestor.swift
//  CDBLLeaveCompanion
//
//  Receipt reconciliation for queue management
//

import Foundation

// MARK: - Receipt Model

struct Receipt: Codable {
    let receiptId: String
    let actionId: String       // References original delta
    let status: String         // "success", "partial", "failure"
    let timestamp: Date
    let message: String?
    let missingBlobs: [String]? // SHA-256s of missing attachments
    let packageHash: String    // For display in request detail
}

// MARK: - ReceiptIngestor

/// Imports and reconciles receipts from QR scanning
class ReceiptIngestor {
    
    static let shared = ReceiptIngestor()
    private let queueManager = QueueManager.shared
    
    private init() {}
    
    /// Import receipt from QR data
    func importReceipt(_ qrData: Data) throws -> Receipt {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let receipt = try decoder.decode(Receipt.self, from: qrData)
        
        // Validate signature if present
        // TODO: Implement signature verification
        
        return receipt
    }
    
    /// Reconcile queue based on receipt
    func reconcileQueue(receipt: Receipt) async throws -> ReconciliationResult {
        guard let actionId = UUID(uuidString: receipt.actionId) else {
            throw ReceiptError.invalidActionId
        }
        
        switch receipt.status {
        case "success":
            // Clear from queue
            try await Task.detached { [weak self] in
                try await MainActor.run {
                    try self?.queueManager.deleteAction(actionId: actionId)
                }
            }.value
            
            return .success(cleared: true)
            
        case "partial":
            // Mark as partial, keep in queue with missing blobs
            try await Task.detached { [weak self] in
                try await MainActor.run {
                    try self?.queueManager.markAsPartial(
                        actionId: actionId,
                        missingBlobs: receipt.missingBlobs ?? []
                    )
                }
            }.value
            
            return .partial(missingBlobs: receipt.missingBlobs ?? [])
            
        case "failure":
            // Keep in queue, mark as failed
            try await Task.detached { [weak self] in
                try await MainActor.run {
                    try self?.queueManager.markAsFailed(actionId: actionId, incrementRetry: true)
                }
            }.value
            
            return .failed(message: receipt.message ?? "Import failed")
            
        default:
            throw ReceiptError.invalidStatus(receipt.status)
        }
    }
}

// MARK: - Reconciliation Result

enum ReconciliationResult {
    case success(cleared: Bool)
    case partial(missingBlobs: [String])
    case failed(message: String)
}

// MARK: - Receipt Errors

enum ReceiptError: LocalizedError {
    case invalidActionId
    case invalidStatus(String)
    case reconciliationFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidActionId:
            return "Invalid action ID in receipt"
        case .invalidStatus(let status):
            return "Invalid receipt status: \(status)"
        case .reconciliationFailed:
            return "Receipt reconciliation failed"
        }
    }
}

