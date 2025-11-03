//
//  AttachmentManifest.swift
//  CDBLLeaveCompanion
//
//  Attachment manifest with SHA-256 hashing and size/type validation
//

import Foundation
import CommonCrypto

// MARK: - Attachment Reference

struct AttachmentRef: Codable, Identifiable {
    let id = UUID()
    let name: String
    let sha256: String
    let size: Int       // Bytes
    let mime: String
    let localUrl: String?
    
    enum CodingKeys: String, CodingKey {
        case name, sha256, size, mime, localUrl
    }
}

// MARK: - Attachment Manifest

/// Manifests attachments with validation and hashing
class AttachmentManifest {
    
    /// Maximum file size: 5 MB
    static let maxFileSize = 5 * 1024 * 1024
    
    /// Maximum total size: 20 MB
    static let maxTotalSize = 20 * 1024 * 1024
    
    /// Allowed MIME types
    static let allowedTypes: Set<String> = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/heic"
    ]
    
    private var files: [AttachmentRef] = []
    
    // MARK: - Adding Files
    
    /// Add file to manifest with validation
    func addFile(_ fileURL: URL) throws -> AttachmentRef {
        // Validate file exists
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            throw AttachmentError.fileNotFound
        }
        
        // Read file
        let data = try Data(contentsOf: fileURL)
        
        // Validate size
        if data.count > Self.maxFileSize {
            let mbSize = Double(data.count) / (1024 * 1024)
            throw AttachmentError.fileTooLarge(
                size: mbSize,
                max: Double(Self.maxFileSize) / (1024 * 1024)
            )
        }
        
        // Compute SHA-256
        let sha256 = computeSHA256(data)
        
        // Validate type
        let mime = try detectMIMEType(fileURL: fileURL)
        
        let ref = AttachmentRef(
            name: fileURL.lastPathComponent,
            sha256: sha256,
            size: data.count,
            mime: mime,
            localUrl: fileURL.path
        )
        
        files.append(ref)
        try validateTotalSize()
        
        return ref
    }
    
    // MARK: - Validation
    
    /// Validate total size doesn't exceed limit
    func validateTotalSize() throws {
        let totalSize = files.reduce(0) { $0 + $1.size }
        
        if totalSize > Self.maxTotalSize {
            let mbSize = Double(totalSize) / (1024 * 1024)
            throw AttachmentError.totalSizeExceeded(
                size: mbSize,
                max: Double(Self.maxTotalSize) / (1024 * 1024)
            )
        }
    }
    
    // MARK: - MIME Type Detection
    
    private func detectMIMEType(fileURL: URL) throws -> String {
        if #available(iOS 14.0, *) {
            guard let typeIdentifier = try? fileURL.resourceValues(forKeys: [.typeIdentifierKey]).typeIdentifier,
                  let utType = UTType(typeIdentifier) else {
                throw AttachmentError.invalidMIMEType
            }
            
            // Map to MIME type
            if let mimeType = utType.preferredMIMEType {
                // Validate against allowed types
                if Self.allowedTypes.contains(mimeType) {
                    return mimeType
                }
            }
            
            throw AttachmentError.unsupportedMIMEType(type: utType.identifier)
        } else {
            // Fallback: check extension
            let ext = fileURL.pathExtension.lowercased()
            let extensionMap: [String: String] = [
                "pdf": "application/pdf",
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "heic": "image/heic"
            ]
            
            if let mime = extensionMap[ext] {
                return mime
            }
            
            throw AttachmentError.unsupportedFileExtension(ext: ext)
        }
    }
    
    // MARK: - SHA-256 Computation
    
    private func computeSHA256(_ data: Data) -> String {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { bytes in
            _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
    
    // MARK: - Access
    
    func getFiles() -> [AttachmentRef] {
        return files
    }
    
    func getTotalSize() -> Int {
        return files.reduce(0) { $0 + $1.size }
    }
    
    func clear() {
        files.removeAll()
    }
}

// MARK: - Attachment Errors

enum AttachmentError: LocalizedError {
    case fileNotFound
    case fileTooLarge(size: Double, max: Double)
    case totalSizeExceeded(size: Double, max: Double)
    case invalidMIMEType
    case unsupportedMIMEType(type: String)
    case unsupportedFileExtension(ext: String)
    
    var errorDescription: String? {
        switch self {
        case .fileNotFound:
            return "File not found"
        case .fileTooLarge(let size, let max):
            return String(format: "File too large (%.1f MB). Maximum allowed is %.1f MB per file.", size, max)
        case .totalSizeExceeded(let size, let max):
            return String(format: "Total attachment size too large (%.1f MB). Maximum allowed is %.1f MB total.", size, max)
        case .invalidMIMEType:
            return "Cannot determine file type"
        case .unsupportedMIMEType(let type):
            return "Unsupported file type: \(type). Use PDF, JPG, PNG, or HEIC."
        case .unsupportedFileExtension(let ext):
            return "Unsupported file extension: \(ext). Use PDF, JPG, PNG, or HEIC."
        }
    }
}

#if canImport(UniformTypeIdentifiers)
import UniformTypeIdentifiers
#endif

