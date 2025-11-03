//
//  QRFramer.swift
//  CDBLLeaveCompanion
//
//  QR frame encoding for multi-frame snapshot transmission
//  Implements 2KB frames with Base45+zlib, EC=Q, CRC32 checksums
//

import Foundation
import Compression
import CommonCrypto

// MARK: - QR Frame Model

/// Single QR frame with metadata and payload
struct QRFrame: Codable {
    /// UUID for this snapshot session
    let sessionId: String
    
    /// 0-based frame index
    let index: Int
    
    /// Total expected frames
    let totalFrames: Int
    
    /// CRC32 of this frame's payload
    let crc32: UInt32
    
    /// Base45-encoded zlib-compressed data (≤2KB)
    let payload: String
    
    /// Encoding format version
    let version: Int = 1
}

// MARK: - QRFramer

/// Encodes data into multi-frame QR code package
class QRFramer {
    
    /// Maximum payload size per frame (2KB compressed)
    static let maxFramePayloadSize = 2048
    
    /// Maximum session size (120KB uncompressed)
    static let maxSessionSize = 120 * 1024
    
    // MARK: - Frame Generation
    
    /// Chunk data into QR frames
    static func generateFrames(from data: Data, sessionId: String = UUID().uuidString) throws -> [QRFrame] {
        // Compress data
        let compressed = try compressData(data)
        
        // Check session size limit
        guard compressed.count <= maxSessionSize else {
            throw QRFrameError.sessionTooLarge(
                size: compressed.count,
                max: maxSessionSize
            )
        }
        
        // Encode to Base45
        let base45Encoded = Base45.encode(compressed)
        
        // Split into frames
        let totalFrames = (base45Encoded.count + maxFramePayloadSize - 1) / maxFramePayloadSize
        
        var frames: [QRFrame] = []
        var offset = 0
        var index = 0
        
        while offset < base45Encoded.count {
            let chunkEnd = min(offset + maxFramePayloadSize, base45Encoded.count)
            let chunk = base45Encoded[offset..<chunkEnd]
            let chunkString = String(data: Data(chunk), encoding: .utf8) ?? ""
            
            // Compute CRC32
            let crc32 = computeCRC32(Data(chunk))
            
            let frame = QRFrame(
                sessionId: sessionId,
                index: index,
                totalFrames: totalFrames,
                crc32: crc32,
                payload: chunkString
            )
            
            frames.append(frame)
            offset = chunkEnd
            index += 1
        }
        
        return frames
    }
    
    // MARK: - Compression
    
    private static func compressData(_ data: Data) throws -> Data {
        // Use zlib compression
        let compressed = try data.compressed(using: .zlib)
        return compressed
    }
    
    // MARK: - Checksums
    
    /// Compute CRC32 checksum
    static func computeCRC32(_ data: Data) -> UInt32 {
        var crc: UInt32 = 0
        data.withUnsafeBytes { bytes in
            crc = crc32(crc, bytes.baseAddress, UInt32(data.count))
        }
        return crc
    }
    
    /// Compute SHA-256 hash for final verification
    static func computeSHA256(_ data: Data) -> String {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { bytes in
            _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - QRFrameError

enum QRFrameError: LocalizedError {
    case sessionTooLarge(size: Int, max: Int)
    case compressionFailed
    case encodingFailed
    
    var errorDescription: String? {
        switch self {
        case .sessionTooLarge(let size, let max):
            return "Data too large (\(size) bytes). Maximum is \(max) bytes."
        case .compressionFailed:
            return "Compression failed"
        case .encodingFailed:
            return "Base45 encoding failed"
        }
    }
}

// MARK: - Base45 Encoding

/// Base45 encoding for compact QR payloads
struct Base45 {
    
    /// Base45 alphabet
    private static let alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"
    
    /// Encode data to Base45 string
    static func encode(_ data: Data) -> String {
        var result = ""
        var buffer = 0
        var bits = 0
        
        for byte in data {
            buffer = (buffer << 8) | Int(byte)
            bits += 8
            
            while bits >= 9 {
                let div = buffer / 45
                let mod = buffer % 45
                result.append(alphabet[alphabet.index(alphabet.startIndex, offsetBy: mod)])
                buffer = div
                bits -= 9
            }
        }
        
        if bits > 0 {
            let mod = buffer % 45
            result.append(alphabet[alphabet.index(alphabet.startIndex, offsetBy: mod)])
        }
        
        return result
    }
    
    /// Decode Base45 string to data
    static func decode(_ string: String) throws -> Data {
        var result = Data()
        var buffer = 0
        var bits = 0
        
        for char in string {
            guard let index = alphabet.firstIndex(of: char) else {
                throw Base45DecodingError.invalidCharacter(char)
            }
            let value = alphabet.distance(from: alphabet.startIndex, to: index)
            
            buffer = buffer * 45 + value
            bits += 9
            
            while bits >= 8 {
                let byte = UInt8(buffer >> (bits - 8))
                result.append(byte)
                buffer &= (1 << (bits - 8)) - 1
                bits -= 8
            }
        }
        
        return result
    }
}

enum Base45DecodingError: LocalizedError {
    case invalidCharacter(Character)
    
    var errorDescription: String? {
        switch self {
        case .invalidCharacter(let char):
            return "Invalid Base45 character: \(char)"
        }
    }
}

// MARK: - Data Compression Extension

extension Data {
    /// Compress data using specified algorithm
    func compressed(using algorithm: NSData.CompressionAlgorithm) throws -> Data {
        return try (self as NSData).compressed(using: algorithm) as Data
    }
    
    /// Decompress data using specified algorithm
    func decompressed(using algorithm: NSData.CompressionAlgorithm) throws -> Data {
        return try (self as NSData).decompressed(using: algorithm) as Data
    }
}

