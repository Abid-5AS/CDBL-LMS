//
//  QRAssembler.swift
//  CDBLLeaveCompanion
//
//  QR frame assembly with CRC32 verification, adaptive downshift, and session resume
//

import Foundation
import Compression
import CommonCrypto

// MARK: - Assembly Status

enum AssemblyStatus {
    case collecting                  // More frames needed
    case complete                    // All frames collected and verified
    case error(AssemblyError)        // Error occurred
    
    var isComplete: Bool {
        if case .complete = self { return true }
        return false
    }
    
    var error: AssemblyError? {
        if case .error(let err) = self { return err }
        return nil
    }
}

enum AssemblyError: LocalizedError {
    case crc32Mismatch(frameIndex: Int)
    case sessionMismatch
    case sha256Mismatch
    case decompressionFailed
    case invalidFrameOrder
    case missingFrames([Int])
    
    var errorDescription: String? {
        switch self {
        case .crc32Mismatch(let idx):
            return "CRC32 mismatch for frame \(idx)"
        case .sessionMismatch:
            return "Frame from different session"
        case .sha256Mismatch:
            return "Final SHA-256 verification failed"
        case .decompressionFailed:
            return "Decompression failed"
        case .invalidFrameOrder:
            return "Frames received out of order"
        case .missingFrames(let indices):
            return "Missing frames: \(indices.map(String.init).joined(separator: ", "))"
        }
    }
}

// MARK: - QRAssembler

/// Assembles multi-frame QR snapshots with adaptive downshift support
class QRAssembler {
    
    // Session state
    private var sessionId: String?
    private var frames: [Int: QRFrame] = [:]
    private var totalFrames: Int?
    
    // Adaptive downshift tracking
    private var frameLossHistory: [(timestamp: Date, lost: Int)] = []
    private let downshiftWindow: TimeInterval = 3.0 // 3 seconds
    private let downshiftThreshold = 0.03 // 3% loss
    
    // Collection complete
    private var isComplete = false
    private var finalPayload: Data?
    
    // MARK: - Frame Collection
    
    /// Add a frame to the assembly
    func addFrame(_ frame: QRFrame) -> AssemblyStatus {
        // Validate session ID
        if let existingSessionId = sessionId {
            guard frame.sessionId == existingSessionId else {
                return .error(.sessionMismatch)
            }
        } else {
            sessionId = frame.sessionId
        }
        
        // Validate frame count
        if let expectedTotal = totalFrames {
            guard frame.totalFrames == expectedTotal else {
                return .error(.invalidFrameOrder)
            }
        } else {
            totalFrames = frame.totalFrames
        }
        
        // Verify CRC32
        guard verifyCRC32(frame: frame) else {
            trackFrameLoss(frame.index)
            return .error(.crc32Mismatch(frameIndex: frame.index))
        }
        
        // Store frame
        frames[frame.index] = frame
        
        // Check if complete
        if let total = totalFrames, frames.count == total {
            return tryReassemble()
        }
        
        return .collecting
    }
    
    /// Verify CRC32 of a frame
    func verifyCRC32(frame: QRFrame) -> Bool {
        guard let data = frame.payload.data(using: .utf8) else {
            return false
        }
        let computed = QRFramer.computeCRC32(data)
        return computed == frame.crc32
    }
    
    // MARK: - Reassembly
    
    /// Attempt to reassemble the complete payload
    private func tryReassemble() -> AssemblyStatus {
        guard let total = totalFrames, frames.count == total else {
            let missing = computeMissingFrames()
            return .error(.missingFrames(missing))
        }
        
        // Reassemble in order
        var assembled = ""
        for i in 0..<total {
            guard let frame = frames[i] else {
                return .error(.missingFrames([i]))
            }
            assembled.append(frame.payload)
        }
        
        // Decode Base45
        let decodedData: Data
        do {
            decodedData = try Base45.decode(assembled)
        } catch {
            return .error(.decompressionFailed)
        }
        
        // Decompress
        let decompressedData: Data
        do {
            decompressedData = try decodedData.decompressed(using: .zlib)
        } catch {
            return .error(.decompressionFailed)
        }
        
        finalPayload = decompressedData
        isComplete = true
        
        return .complete
    }
    
    // MARK: - Adaptive Downshift
    
    /// Track frame loss for adaptive downshift
    private func trackFrameLoss(_ frameIndex: Int) {
        let now = Date()
        frameLossHistory.append((timestamp: now, lost: frameIndex))
        
        // Clean old entries
        frameLossHistory = frameLossHistory.filter { now.timeIntervalSince($0.timestamp) <= downshiftWindow }
    }
    
    /// Calculate frame loss rate over window
    func trackFrameLoss(window: TimeInterval) -> Double {
        let now = Date()
        let recent = frameLossHistory.filter { now.timeIntervalSince($0.timestamp) <= window }
        let totalScanned = frames.count + recent.count
        
        guard totalScanned > 0 else { return 0 }
        
        return Double(recent.count) / Double(totalScanned)
    }
    
    /// Check if adaptive downshift should trigger
    func shouldDownshift() -> Bool {
        let lossRate = trackFrameLoss(window: downshiftWindow)
        return lossRate > downshiftThreshold
    }
    
    // MARK: - Session Resume
    
    /// Get missing frame indices
    func computeMissingFrames() -> [Int] {
        guard let total = totalFrames else { return [] }
        var missing: [Int] = []
        for i in 0..<total {
            if frames[i] == nil {
                missing.append(i)
            }
        }
        return missing
    }
    
    /// Get progress percentage
    func calculateProgress() -> Double {
        guard let total = totalFrames, total > 0 else { return 0 }
        return Double(frames.count) / Double(total)
    }
    
    // MARK: - Final Verification
    
    /// Compute final SHA-256 hash
    func finalSHA256() -> String? {
        guard let data = finalPayload else { return nil }
        return QRFramer.computeSHA256(data)
    }
    
    /// Get reassembled data
    func reassemble() -> Data? {
        return finalPayload
    }
    
    /// Reset for new session
    func reset() {
        sessionId = nil
        frames = [:]
        totalFrames = nil
        frameLossHistory = []
        isComplete = false
        finalPayload = nil
    }
}

