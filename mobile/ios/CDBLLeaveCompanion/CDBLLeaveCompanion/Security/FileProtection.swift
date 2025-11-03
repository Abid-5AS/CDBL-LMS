//
//  FileProtection.swift
//  CDBLLeaveCompanion
//
//  File protection helpers for secure storage
//

import Foundation

/// File protection utilities for CoreData and exports
enum FileProtection {
    
    /// Apply NSFileProtectionCompleteUntilFirstUserAuthentication to CoreData store
    static func applyToCoreDataStore(storeURL: URL) throws {
        let attributes: [FileAttributeKey: Any] = [
            .protectionKey: FileProtectionType.completeUntilFirstUserAuthentication
        ]
        try FileManager.default.setAttributes(attributes, ofItemAtPath: storeURL.path)
    }
    
    /// Apply protection to exported temp files
    static func applyToExports(fileURL: URL) throws {
        let attributes: [FileAttributeKey: Any] = [
            .protectionKey: FileProtectionType.completeUntilFirstUserAuthentication
        ]
        try FileManager.default.setAttributes(attributes, ofItemAtPath: fileURL.path)
    }
    
    /// Apply protection recursively to directory
    static func applyToDirectory(directoryURL: URL) throws {
        let enumerator = FileManager.default.enumerator(
            at: directoryURL,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsHiddenFiles]
        )
        
        while let fileURL = enumerator?.nextObject() as? URL {
            let attributes: [FileAttributeKey: Any] = [
                .protectionKey: FileProtectionType.completeUntilFirstUserAuthentication
            ]
            try FileManager.default.setAttributes(attributes, ofItemAtPath: fileURL.path)
        }
    }
}

